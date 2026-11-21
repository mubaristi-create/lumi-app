import {createPrivateKey,sign} from 'node:crypto';
import {writeFile,mkdir,appendFile} from 'node:fs/promises';
const {ASC_KEY_ID:kid,ASC_ISSUER_ID:iss,ASC_PRIVATE_KEY:pem,IOS_BUILD_NUMBER:number}=process.env;
const app='6835968304',group='8649bbd9-ebb9-47e1-aeae-dd15a61a1336';
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function token(){const key=createPrivateKey(pem.replace(/\r/g,''));if(key.asymmetricKeyDetails?.namedCurve!=='prime256v1')throw Error('Invalid API key type');const now=Math.floor(Date.now()/1000),data=encode({alg:'ES256',kid,typ:'JWT'})+'.'+encode({iss,iat:now,exp:now+300,aud:'appstoreconnect-v1'});return data+'.'+sign('sha256',Buffer.from(data),{key,dsaEncoding:'ieee-p1363'}).toString('base64url')}
async function request(path,method='GET',data){const response=await fetch('https://api.appstoreconnect.apple.com/v1/'+path,{method,redirect:'error',signal:AbortSignal.timeout(30000),headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});if(!response.ok)throw Error('Apple API HTTP '+response.status);return response.status===204?null:response.json()}
try{
 if(!/^[A-Z0-9]{10}$/.test(kid||'')||!/^[0-9a-f-]{36}$/i.test(iss||'')||!pem||!/^\d+$/.test(number||''))throw Error('API environment incomplete');
 if(process.env.IOS_RESOLVE_BUILD==='true'){
  const latest=await request('builds?'+new URLSearchParams({'filter[app]':app,limit:'200',sort:'-uploadedDate'}));
  const maximum=Math.max(0,...(latest.data||[]).map(x=>/^\d+$/.test(x.attributes.version)?Number(x.attributes.version):0));
  const selected=Math.max(Number(number),maximum+1);
  if(!process.env.GITHUB_OUTPUT)throw Error('API environment incomplete');
  await appendFile(process.env.GITHUB_OUTPUT,'build_number='+selected+'\n');
  console.log('Selected next iOS build number: '+selected);process.exit(0);
 }
 let build;
 for(let attempt=0;attempt<30;attempt++){
  const query=new URLSearchParams({'filter[app]':app,'filter[version]':number,limit:'10',include:'preReleaseVersion'});
  const response=await request('builds?'+query),candidate=response.data?.find(x=>x.attributes.version===number);
  if(candidate){const state=candidate.attributes.processingState;if(['FAILED','INVALID'].includes(state))throw Error('Apple build processing '+state);if(state==='VALID'){build=candidate;break}}
  console.log('Waiting for Apple build processing ('+(attempt+1)+'/30).');await new Promise(r=>setTimeout(r,30000));
 }
 if(!build)throw Error('Apple is still processing the uploaded build');
 const beta=await request('betaGroups/'+group);if(!beta.data?.attributes.isInternalGroup)throw Error('Expected existing internal test group');
 const existing=await request('betaGroups/'+group+'/builds?limit=200');
 if(!existing.data?.some(x=>x.id===build.id))await request('betaGroups/'+group+'/relationships/builds','POST',{data:[{type:'builds',id:build.id}]});
 const list=await request('betaGroups/'+group+'/builds?limit=200');if(!list.data?.some(x=>x.id===build.id))throw Error('Internal group assignment not confirmed');
 const detail=await request('builds/'+build.id+'/buildBetaDetail');
 const report={build:number,processingState:build.attributes.processingState,internalBuildState:detail.data?.attributes?.internalBuildState,internalGroupAssigned:true,externalReviewChanged:false};
 await mkdir('mobile/build/artifacts',{recursive:true});await writeFile('mobile/build/artifacts/TestFlight-status.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'TestFlight build '+number+': processing VALID; assigned to the existing internal testing group. Build 7 external review was not modified.\n');
}catch(error){console.error('TestFlight status check: '+(/^(Apple API HTTP \d+|Apple build processing (FAILED|INVALID)|Apple is still processing the uploaded build|Expected existing internal test group|Internal group assignment not confirmed|API environment incomplete|Invalid API key type)$/.test(error.message)?error.message:'request could not complete; credentials and response withheld'));process.exitCode=1}
