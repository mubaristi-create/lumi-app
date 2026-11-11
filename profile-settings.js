(()=>{'use strict';const root=document.getElementById('profile-settings');if(!root)return;
 const dialog=document.getElementById('delete-account-dialog'),message=document.getElementById('delete-account-status'),submit=document.getElementById('delete-account-confirm'),confirmation=document.getElementById('delete-account-text');let busy=false;
 const reauth=document.createElement('label'),password=document.createElement('input'),google=document.createElement('button');reauth.hidden=true;reauth.textContent='Cari şifrən';password.type='password';password.autocomplete='current-password';reauth.append(password);google.type='button';google.className='button-soft';google.textContent='Google ilə yenidən daxil ol';google.hidden=true;google.onclick=()=>LumiServer.signInWithGoogle();message.before(reauth,google);
 document.getElementById('delete-account-open').onclick=()=>{confirmation.value='';password.value='';reauth.hidden=google.hidden=true;message.textContent='';dialog.showModal()};
 document.getElementById('delete-account-cancel').onclick=()=>{if(!busy)dialog.close()};
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
 const privacy=document.getElementById('ad-privacy-options');privacy.hidden=!window.LumiNativeAds;
 privacy.onclick=async()=>{privacy.disabled=true;try{const result=await window.LumiNativeAds.privacyOptions();document.getElementById('profile-settings-status').textContent=result.status==='updated'?'Məxfilik seçimin saxlanıldı.':'Bu regionda əlavə reklam seçimi hazırda tələb olunmur.'}catch{document.getElementById('profile-settings-status').textContent='Seçimləri açmaq mümkün olmadı. Yenidən cəhd et.'}finally{privacy.disabled=false}};
 submit.onclick=async()=>{if(busy)return;if(confirmation.value.trim()!=='HESABIMI SİL'){message.textContent='Təsdiq üçün HESABIMI SİL yaz.';return}busy=true;submit.disabled=true;message.textContent='Hesabın təhlükəsiz silinir. Səhifəni bağlama…';try{
 if(!reauth.hidden){if(!password.value){message.textContent='Cari şifrəni daxil et və ya Google ilə yenidən daxil ol.';return}const auth=await LumiServer.client.auth.signInWithPassword({email:LumiCloud.state.account.email,password:password.value});password.value='';if(auth.error)throw Error('Giriş təsdiqlənmədi. Cari şifrənə yenidən bax.');}
 const {data,error}=await LumiServer.client.functions.invoke('delete-account',{body:{confirmation:confirmation.value.trim()}});
 if(error){let body;try{body=await error.context?.json()}catch{}if(body?.code==='REAUTH_REQUIRED'){message.textContent='Təhlükəsizlik üçün cari şifrənlə və ya Google ilə yenidən daxil ol, sonra silinməni təsdiqlə.';reauth.hidden=google.hidden=false;password.focus();return}throw Error(body?.error||'Silinmə tamamlanmadı. Yenidən cəhd et.');}
 if(!data?.deleted)throw Error('Silinmə təsdiqlənmədi. Yenidən cəhd et.');
 const uid=LumiCloud.state.account?.id;await LumiCloud.signOut().catch(()=>{});
 for(const k of Object.keys(localStorage))if(k.startsWith('lumi-tiles2-')||k.startsWith('lumi-tiles-outbox:')||(uid&&k.includes(uid)))localStorage.removeItem(k);
 location.replace('./index.html');
 }catch(e){message.textContent=e.message||'Bağlantını yoxla və yenidən cəhd et.'}finally{busy=false;submit.disabled=false}};
})();
