// No browser access: scheduler authenticates with an independent Vault-held key.
const url=Deno.env.get('SUPABASE_URL')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
async function rpc(name:string,args:unknown={}){const r=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify(args)});if(!r.ok)throw Error('Database request failed');return r.json()}
const b64=(v:Uint8Array)=>btoa(String.fromCharCode(...v)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const enc=(s:string)=>b64(new TextEncoder().encode(s));
let oauth:{value:string,until:number}|undefined;
type APNsCredentials={private_key:string,key_id:string,team_id:string,topic:string,environment:string};
let apnsBearer:{value:string,until:number}|undefined;
async function apnsAccess(c:APNsCredentials){
 if(apnsBearer&&apnsBearer.until>Date.now())return apnsBearer.value;
 if(c.topic!=='az.playlumio.app'||c.environment!=='production'||!c.key_id||!c.team_id)throw Error('Invalid APNs configuration');
 const now=Math.floor(Date.now()/1000),unsigned=enc(JSON.stringify({alg:'ES256',kid:c.key_id}))+'.'+enc(JSON.stringify({iss:c.team_id,iat:now}));
 const pem=c.private_key.replace(/-----[^-]+-----|\s/g,'');
 const key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),x=>x.charCodeAt(0)),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(unsigned));
 apnsBearer={value:unsigned+'.'+b64(new Uint8Array(signature)),until:Date.now()+45*60000};return apnsBearer.value;
}
async function sendAPNs(item:any){
 const raw=Deno.env.get('LUMI_APNS_CREDENTIALS');if(!raw)return 'retry';
 const c:APNsCredentials=JSON.parse(raw),bearer=await apnsAccess(c);
 if(!/^[a-fA-F0-9]{64}$/.test(item.token))return 'invalid';
 const response=await fetch('https://api.push.apple.com/3/device/'+item.token,{method:'POST',headers:{authorization:'bearer '+bearer,'apns-topic':c.topic,'apns-push-type':'alert','apns-priority':item.kind==='hourly'?'5':'10','apns-expiration':String(Math.floor(Date.now()/1000)+3600),'apns-collapse-id':item.notification_id,'content-type':'application/json'},body:JSON.stringify({aps:{alert:{title:item.title,body:item.body},sound:'default'},notification_id:item.notification_id,route:item.route,kind:item.kind}),signal:AbortSignal.timeout(10000)});
 if(response.ok)return 'sent';
 const error=await response.json().catch(()=>({}));
 if(response.status===410||['BadDeviceToken','DeviceTokenNotForTopic','Unregistered'].includes(error.reason))return 'invalid';
 if(error.reason==='ExpiredProviderToken')apnsBearer=undefined;
 return response.status===413?'failed':'retry';
}
async function access(c:{private_key:string,client_email:string}){
 if(oauth&&oauth.until>Date.now())return oauth.value;
 const now=Math.floor(Date.now()/1000),unsigned=enc(JSON.stringify({alg:'RS256',typ:'JWT'}))+'.'+enc(JSON.stringify({iss:c.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
 const pem=c.private_key.replace(/-----[^-]+-----|\s/g,''),key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),x=>x.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned));
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:unsigned+'.'+b64(new Uint8Array(signature))})});if(!r.ok)throw Error('Sender authentication failed');const data=await r.json();oauth={value:data.access_token,until:Date.now()+Math.min(3300,data.expires_in-60)*1000};return oauth.value;
}
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response(null,{status:405});
 try{
  const key=req.headers.get('Authorization')?.replace(/^Bearer /,'')||'';if(key.length<40||key.length>256)return new Response(null,{status:401});
  const credentials=await rpc('lumi_push_credentials',{p_key:key});if(!credentials)return new Response(null,{status:401});
  const batch=await rpc('lumi_push_claim');let sent=0,bearer:string|undefined;
  for(const item of batch){
   let result='retry';try{
    if(item.platform==='ios'){
     result=await sendAPNs(item);if(result==='sent')sent++;
     await rpc('lumi_push_ack',{p_id:item.id,p_attempt:item.attempt,p_result:result});continue;
    }
    bearer= bearer || await access(credentials);
    const r=await fetch('https://fcm.googleapis.com/v1/projects/'+encodeURIComponent(credentials.project_id)+'/messages:send',{method:'POST',headers:{Authorization:'Bearer '+bearer,'Content-Type':'application/json'},body:JSON.stringify({message:{token:item.token,notification:{title:item.title,body:item.body},data:{notification_id:item.notification_id,route:item.route,kind:item.kind},android:{priority:item.kind==='hourly'?'normal':'high',ttl:'3600s',notification:{tag:item.notification_id,channel_id:'lumi_updates',sound:'default'}}}})});
    if(r.ok){result='sent';sent++}else{const e=await r.json().catch(()=>null);const invalid=e?.error?.details?.some((d:{errorCode?:string})=>d.errorCode==='UNREGISTERED');result=invalid?'invalid':r.status===400?'failed':'retry';if(r.status===401)oauth=undefined}
   }catch{/* Lease will retry; do not log device identifiers. */}
   await rpc('lumi_push_ack',{p_id:item.id,p_attempt:item.attempt,p_result:result});
  }
  return Response.json({processed:batch.length,sent});
 }catch{return Response.json({error:'Push worker unavailable'},{status:503})}
});
