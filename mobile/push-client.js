import {PushNotifications} from '@capacitor/push-notifications';
import {LocalNotifications} from '@capacitor/local-notifications';

// Tokens stay in private server tables. Never place them in logs or URLs.
export async function installPush(platform='android',nativeStorage=null){
 if(platform==='android')PushNotifications.createChannel({id:'lumi_updates',name:'Lumi bildirişləri',description:'Oyun, bonus və sıralama yenilikləri',importance:4,visibility:0,sound:'default'}).catch(()=>{});
 let token=null,registeredUser=null,install=null;
 const storageKey='lumi-server-auth-v1-push-installation';
 try{install=platform==='ios'?(await nativeStorage.getItem({key:storageKey})).value:localStorage.getItem('lumi-push-installation')}catch{}
 if(!install){
  install=crypto.randomUUID();
  try{if(platform==='ios')await nativeStorage.setItem({key:storageKey,value:install});else localStorage.setItem('lumi-push-installation',install)}catch{window.dispatchEvent(new Event('lumi:push-unavailable'));return}
 }
 const rpc=async(name,args)=>{const r=await window.LumiServer.client.rpc(name,args);if(r.error)throw r.error;return r.data};
 const bind=async()=>{
  if(!token||!window.LumiServer)return;
  const {data}=await window.LumiServer.client.auth.getSession();if(!data.session)return;
  const prefs=await rpc('lumi_notification_settings');if(!prefs.push_enabled)return;
  await rpc('lumi_push_register',{p_token:token,p_installation:install,...(platform==='ios'?{p_platform:'ios'}:{})});registeredUser=data.session.user.id;
  await LocalNotifications.cancel({notifications:[{id:101},{id:102}]});
 };
 const safeBind=()=>bind().catch(()=>{});
 const pages=new Set(['index.html#home','daily-bonus.html','eyo.html']);
 PushNotifications.addListener('registration',r=>{token=r.value;safeBind()});
 PushNotifications.addListener('registrationError',()=>window.dispatchEvent(new Event('lumi:push-unavailable')));
 PushNotifications.addListener('pushNotificationReceived',r=>{
  window.dispatchEvent(new CustomEvent('lumi:notification-received',{detail:{id:r.data?.notification_id}}));
 });
 PushNotifications.addListener('pushNotificationActionPerformed',r=>{
  const route=r.notification.data?.route;location.href='./'+(pages.has(route)?route:'index.html#home');
 });
 window.LumiPush={
  async enable(){
   if(!window.LumiServer)return false;
   let p=await PushNotifications.checkPermissions();if(p.receive!=='granted')p=await PushNotifications.requestPermissions();if(p.receive!=='granted')return false;
   await rpc('lumi_notification_settings',{p_changes:{push_enabled:true}});await PushNotifications.register();return true;
  },
  async disable(){await rpc('lumi_push_unregister',{p_installation:install});await rpc('lumi_notification_settings',{p_changes:{push_enabled:false}});token=null;registeredUser=null},
  async beforeSignOut(){if(registeredUser)await rpc('lumi_push_unregister',{p_installation:install}).catch(()=>{});registeredUser=null},
  async active(){if(!window.LumiServer)return false;const p=await rpc('lumi_notification_settings');return p.push_enabled}
 };
 const ready=()=>{
  const client=window.LumiServer.client;
  client.auth.onAuthStateChange(()=>{setTimeout(async()=>{try{const p=await window.LumiPush.active();if(p&&(await PushNotifications.checkPermissions()).receive==='granted')await PushNotifications.register()}catch{}},0)});
  safeBind();
 };
 if(window.LumiServer)ready();else window.addEventListener('lumi:server-ready',ready,{once:true});
 window.addEventListener('lumi:native-active',safeBind);
}
