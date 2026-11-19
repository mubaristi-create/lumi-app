const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{webcrypto}=require('crypto'),esbuild=require('../mobile/node_modules/esbuild');
(async()=>{
 const pair=await webcrypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const pem='-----BEGIN PRIVATE KEY-----\n'+Buffer.from(await webcrypto.subtle.exportKey('pkcs8',pair.privateKey)).toString('base64')+'\n-----END PRIVATE KEY-----';
 const credentials={private_key:pem,key_id:'TESTKEY123',team_id:'TESTTEAM12',topic:'az.playlumio.app',environment:'production'};
 let responseStatus=200,responseReason='',requests=[],handler;
 const context={crypto:webcrypto,TextEncoder,Uint8Array,Date,JSON,Error,AbortSignal,Response,URLSearchParams,atob,btoa,
  Deno:{env:{get:n=>n==='LUMI_APNS_CREDENTIALS'?JSON.stringify(credentials):'test-only'},serve:fn=>handler=fn},
  fetch:async(url,options)=>{requests.push({url,options});return {ok:responseStatus===200,status:responseStatus,json:async()=>({reason:responseReason})}},module:{exports:{}}};
 vm.createContext(context);vm.runInContext(esbuild.transformSync(fs.readFileSync('supabase/functions/push-worker/index.ts','utf8')+'\nmodule.exports={sendAPNs,apnsAccess};',{loader:'ts',target:'es2022'}).code,context);
 const item={token:'a'.repeat(64),notification_id:'00000000-0000-4000-8000-000000000001',title:'Real server event',body:'Event body',route:'index.html#home',kind:'ranking'};
 assert.equal(await context.module.exports.sendAPNs(item),'sent');
 const request=requests[0],headers=request.options.headers,payload=JSON.parse(request.options.body);
 assert.equal(request.url,'https://api.push.apple.com/3/device/'+item.token);assert.equal(headers['apns-topic'],'az.playlumio.app');assert.equal(headers['apns-collapse-id'],item.notification_id);assert.equal(payload.notification_id,item.notification_id);assert.equal(payload.aps.alert.body,item.body);
 const jwt=headers.authorization.slice(7),parts=jwt.split('.');assert.equal(JSON.parse(Buffer.from(parts[0],'base64url')).alg,'ES256');
 assert(await webcrypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},pair.publicKey,Buffer.from(parts[2],'base64url'),new TextEncoder().encode(parts.slice(0,2).join('.'))));
 responseStatus=410;responseReason='Unregistered';assert.equal(await context.module.exports.sendAPNs(item),'invalid');
 responseStatus=429;responseReason='TooManyRequests';assert.equal(await context.module.exports.sendAPNs(item),'retry');
 assert.equal(await context.module.exports.sendAPNs({...item,token:'bad'}),'invalid');
 assert.equal((await handler(new Request('https://worker.invalid',{method:'POST'}))).status,401);
 console.log('PASS: APNs ES256 signature, production topic, identical inbox payload, collapse ID, invalid token and retry handling; unauthenticated worker rejected. No real device delivery simulated.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
