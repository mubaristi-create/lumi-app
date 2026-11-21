const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
(async()=>{
for(const platform of ['ios','android']){
 const calls=[],listeners={},local=new Map(),uuid='00000000-0000-4000-8000-000000000001';let permission='granted';
 const PushNotifications={createChannel:async()=>calls.push(['channel']),addListener:(n,fn)=>listeners[n]=fn,checkPermissions:async()=>({receive:permission}),requestPermissions:async()=>({receive:permission}),register:async()=>listeners.registration({value:'a'.repeat(64)})};
 const native={getItem:async()=>({value:uuid}),setItem:async()=>{throw Error('Existing installation should be reused')}};
 const client={rpc:async(name,args)=>{calls.push([name,args]);return {data:name==='lumi_notification_settings'?{push_enabled:true}:uuid}},auth:{getSession:async()=>({data:{session:{user:{id:'test-user'}}}}),onAuthStateChange(){}}};
 const context={PushNotifications,LocalNotifications:{cancel:async()=>{}},localStorage:{getItem:k=>{if(platform==='ios')throw Error('Web storage disabled');return local.get(k)},setItem:(k,v)=>local.set(k,v)},crypto:{randomUUID:()=>uuid},setTimeout,Event,CustomEvent:class{},location:{},window:{LumiServer:{client},addEventListener(){},dispatchEvent(){}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('mobile/push-client.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export async function installPush','async function installPush')+'\nthis.installPush=installPush;',context);
 await context.installPush(platform,native);assert(await context.window.LumiPush.enable());
 await new Promise(r=>setTimeout(r,10));const register=calls.find(c=>c[0]==='lumi_push_register');assert(register);assert.equal(register[1].p_installation,uuid);assert.equal(register[1].p_platform,platform==='ios'?'ios':undefined);assert.equal(calls.some(c=>c[0]==='channel'),platform==='android');
 await context.window.LumiPush.beforeSignOut();assert(calls.some(c=>c[0]==='lumi_push_unregister'));
 permission='denied';assert.equal(await context.window.LumiPush.enable(),false);
}
console.log('PASS: iOS APNs registration survives blocked browser storage with native installation ID; Android RPC/channel contract preserved; denied permission and sign-out unregister handled.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
