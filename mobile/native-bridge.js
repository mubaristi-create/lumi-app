import {Capacitor,registerPlugin} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
import {App} from '@capacitor/app';
import {Browser} from '@capacitor/browser';
import {StatusBar,Style} from '@capacitor/status-bar';
import {installPush} from './push-client.js';
if(Capacitor.isNativePlatform()){
 const root=document.documentElement;root.dataset.lumiPlatform=Capacitor.getPlatform();
 const gamePage=/\/(flappy|space-runner|merge9|fruit-ninja|silly-cat|blast-puzzle|eyo|tiles|daily-bonus|sudoku)\.html$/.test(location.pathname);
 root.dataset.lumiGame=String(gamePage);if(Capacitor.getPlatform()==='ios'&&gamePage)root.style.setProperty('--lumi-banner-reserved','90px');
 const nativeStyle=document.createElement('link');nativeStyle.rel='stylesheet';nativeStyle.href='lumi-mobile.css';document.head.append(nativeStyle);
 const lifecycle=active=>root.classList.toggle('lumi-backgrounded',!active);
 window.addEventListener('lumi:native-active',()=>lifecycle(true));window.addEventListener('lumi:native-background',()=>lifecycle(false));
 document.addEventListener('visibilitychange',()=>lifecycle(!document.hidden));
 // Delay until the native storage bridge is installed. iOS uses APNs device tokens.
 queueMicrotask(()=>installPush(Capacitor.getPlatform(),window.LumiNativeAuthStorage).catch(()=>window.dispatchEvent(new Event('lumi:push-unavailable'))));
 if(['android','ios'].includes(Capacitor.getPlatform())){window.LumiNativePlatform=Capacitor.getPlatform();window.LumiNativeAuthStorage=registerPlugin('LumiAuthStorage');window.LumiNativeGameStorage=registerPlugin('LumiGameStorage');window.LumiNativeAds=registerPlugin('LumiNativeAds');window.LumiNativeAdsReady=window.LumiNativeAds.initialize().catch(()=>null);const retryAds=()=>window.LumiNativeAds.diagnostics().then(d=>{if(!d.initialized)return window.LumiNativeAds.initialize();if(Capacitor.getPlatform()==='ios')return window.LumiNativeAds.preload()}).catch(()=>null);window.addEventListener('online',retryAds);window.addEventListener('lumi:native-active',retryAds);window.LumiNativeAds.addListener('adDiagnostic',e=>window.dispatchEvent(new CustomEvent('lumi:ad-diagnostic',{detail:e}))).catch(()=>{});document.addEventListener('DOMContentLoaded',()=>{if(!/\/(flappy|space-runner|merge9|fruit-ninja|silly-cat|blast-puzzle|eyo|tiles|daily-bonus|sudoku)\.html$/.test(location.pathname))window.LumiNativeAds.hideBanner().catch(()=>{});window.LumiNativeAds.diagnostics().then(d=>{if(!d.debug)return;const slot=document.querySelector('#settings-dialog form');if(slot){const debug=document.createElement('button');debug.type='button';debug.textContent='Reklam diaqnostikası';debug.onclick=()=>window.LumiAds?.openDiagnostics();slot.append(debug)}}).catch(()=>{})});}
 if(Capacitor.getPlatform()==='ios'){
  const layout=registerPlugin('LumiNativeLayout');
  const updateInsets=()=>layout.getInsets().then(insets=>{for(const side of ['top','bottom','left','right']){const value=Number(insets[side]);if(Number.isFinite(value)&&value>=0)root.style.setProperty('--lumi-safe-'+side,value+'px')}window.dispatchEvent(new Event('lumi:layout-ready'))}).catch(()=>{});
  updateInsets();document.addEventListener('DOMContentLoaded',updateInsets,{once:true});window.addEventListener('resize',updateInsets);window.addEventListener('lumi:native-active',updateInsets);
  const apple=registerPlugin('LumiAppleAuth');
  window.LumiNativeAppleAuth={async signIn(){const S=window.LumiServer;if(!S)throw Error('Server hazır deyil');S.client.auth.startAutoRefresh();window.LumiAuthStorage.blockWrites(false);const result=await apple.signIn();const {error}=await S.client.auth.signInWithIdToken({provider:'apple',token:result.token,nonce:result.nonce});if(error)throw error;location.replace('./index.html#home')}};
  const addApple=async()=>{const enabled=await apple.isAvailable().catch(()=>({available:false}));if(!enabled.available)return;const S=window.LumiServer;if(!S)return;const settings=await fetch(S.config.url+'/auth/v1/settings',{headers:{apikey:S.config.publishableKey}}).then(r=>r.ok?r.json():null).catch(()=>null);if(!settings?.external?.apple)return;for(const selector of ['#login-form','#signup-form','#server-login','#server-signup']){const form=document.querySelector(selector);if(!form||form.querySelector('.apple-auth'))continue;const button=document.createElement('button');button.type='button';button.className='google-auth apple-auth';button.textContent='Apple ilə davam et';button.style.cssText='background:#fff;color:#000;border:1px solid #777;min-height:44px';button.onclick=async()=>{button.disabled=true;try{await window.LumiNativeAppleAuth.signIn()}catch{button.disabled=false;const message=document.querySelector('#server-message,#toast');if(message){message.textContent='Apple girişi tamamlanmadı. Yenidən yoxla.';message.classList.add('show')}}};form.append(button)}};
  document.addEventListener('DOMContentLoaded',addApple,{once:true});
 }
 window.LumiDeviceReminders={async enable(){if(window.LumiPush)return window.LumiPush.enable();let permission=await LocalNotifications.checkPermissions();if(permission.display!=='granted')permission=await LocalNotifications.requestPermissions();return permission.display==='granted'},async schedule({dailyAt,adAt,coins=100}={}){if(window.LumiPush&&await window.LumiPush.active().catch(()=>false))return;const permission=await LocalNotifications.checkPermissions();if(permission.display!=='granted')return;await LocalNotifications.cancel({notifications:[{id:101},{id:102}]});const notifications=[];if(dailyAt&&new Date(dailyAt).getTime()>Date.now())notifications.push({id:101,title:'Gündəlik bonusun hazırdır ☀️',body:'Maskot səni gözləyir. Gəl, oyna və LUMI topla.',schedule:{at:new Date(dailyAt)},extra:{page:'daily-bonus.html'}});if(adAt&&new Date(adAt).getTime()>Date.now())notifications.push({id:102,title:coins+' oyun sikkən hazırdır ✨',body:'İstəsən reklam izlə, oyun sikkələrini topla və ipuclarını artır.',schedule:{at:new Date(adAt)},extra:{page:'index.html#home'}});if(notifications.length)await LocalNotifications.schedule({notifications})}};
 LocalNotifications.addListener('localNotificationActionPerformed',event=>{const page=event.notification.extra?.page;if(['daily-bonus.html','index.html#home'].includes(page))location.href='./'+page}).catch(()=>{});
 window.LumiNativeOAuth={open:url=>Browser.open({url})};
 let pendingAuthUrl=null,exchanging=false;async function handleAuth(raw){let url;try{url=new URL(raw)}catch{return}if(url.protocol!=='com.lumi.play:'||url.hostname!=='auth'||url.pathname!=='/callback')return;if(!window.LumiServer){pendingAuthUrl=raw;return}if(exchanging)return;const code=url.searchParams.get('code');if(!code)return;exchanging=true;try{const {error}=await window.LumiServer.client.auth.exchangeCodeForSession(code);if(error)throw error;await Browser.close();location.replace('./index.html#home')}catch{window.dispatchEvent(new Event('lumi:oauth-error'))}finally{exchanging=false}}
 App.addListener('appUrlOpen',({url})=>handleAuth(url)).catch(()=>{});App.getLaunchUrl().then(r=>{if(r?.url)handleAuth(r.url)}).catch(()=>{});window.addEventListener('lumi:server-ready',()=>{if(pendingAuthUrl){const url=pendingAuthUrl;pendingAuthUrl=null;handleAuth(url)}});
 const report=e=>console.warn('Native bridge:',e?.message||e);
 const external=raw=>{let url;try{url=new URL(raw,location.href)}catch{return false}if(url.protocol!=='https:')return false;Browser.open({url:url.href}).catch(report);return true};
 window.open=(url)=>{external(url);return null};
 document.addEventListener('click',event=>{const link=event.target.closest?.('a[href]');if(!link)return;const url=new URL(link.href,location.href);if(url.origin!==location.origin&&url.protocol==='https:'){event.preventDefault();external(url.href)}});
 App.addListener('appStateChange',({isActive})=>{window.dispatchEvent(new Event(isActive?'lumi:native-active':'lumi:native-background'))}).catch(report);
 if(Capacitor.getPlatform()==='android')App.addListener('backButton',()=>{
  const modal=document.querySelector('dialog[open]');if(modal){modal.close();return}
  const close=document.querySelector('.home-modal:not([hidden]) [data-home-close],.lgs:not([hidden]) .lgs-close');if(close){close.click();return}
  if(!/\/(index\.html)?$/.test(location.pathname)){location.href='./index.html#home';return}
  App.minimizeApp().catch(report);
 }).catch(report);
 const start=()=>{StatusBar.setStyle({style:Style.Dark}).catch(report);if(Capacitor.getPlatform()==='android')StatusBar.setBackgroundColor({color:'#100609'}).catch(report)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
