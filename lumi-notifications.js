(()=>{'use strict';
 const client=()=>window.LumiServer?.client;
 async function settings(changes){const r=await client().rpc('lumi_notification_settings',{p_changes:changes||null});if(r.error)throw r.error;return r.data}
 async function open(){
  if(!client())return;let prefs;try{prefs=await settings()}catch{return}
  const dialog=document.createElement('dialog');dialog.style.cssText='width:min(92vw,420px);padding:24px;border:1px solid #916341;border-radius:24px;background:#251016;color:#fff4df;box-sizing:border-box';
  dialog.innerHTML='<h2 style="margin:0 0 12px">Bildiriş ayarları</h2><p>İstədiyin xatırlatmaları seç. Telefon bildirişləri üçün Lumi tətbiqində icazə ver.</p>';
  for(const [key,label]of Object.entries({push_enabled:'Telefon bildirişləri',hourly:'Saatlıq oyun xatırlatması',daily:'Gündəlik maskot bonusu',ranking:'Liderlik sıralamam dəyişəndə'})){
   const line=document.createElement('label');line.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid #ffffff20';const text=document.createElement('span');text.textContent=label;const box=document.createElement('input');box.type='checkbox';box.checked=!!prefs[key];box.style.cssText='width:22px;height:22px;accent-color:#ffbc65;flex-shrink:0';
   if(key==='push_enabled'&&!window.LumiPush){box.disabled=true;text.textContent+=' · Android tətbiqində'}
   box.onchange=async()=>{box.disabled=true;try{if(key==='push_enabled'){if(box.checked){box.checked=await window.LumiPush.enable()}else await window.LumiPush.disable()}else await settings({[key]:box.checked})}catch{box.checked=!box.checked;status.textContent='Saxlanmadı. Bağlantını yoxla.'}finally{box.disabled=false}};line.append(text,box);dialog.append(line);
  }
  const status=document.createElement('p');status.role='status';dialog.append(status);const close=document.createElement('button');close.className='button-soft';close.textContent='Hazırdır';close.style.cssText='width:100%;margin-top:16px';close.onclick=()=>dialog.close();dialog.append(close);dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
 }
 function mount(){const place=document.querySelector('.profile-page .profile-hero,#home-page .bonus-hub');if(!place||document.getElementById('push-preferences'))return;const b=document.createElement('button');b.id='push-preferences';b.className='button-soft';b.textContent='🔔 Bildiriş ayarları';b.onclick=open;place.append(b)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.addEventListener('lumi:notification-received',()=>window.dispatchEvent(new Event('lumi:native-active')));
 window.LumiNotificationSettings={open};
})();
