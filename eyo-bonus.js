(()=>{'use strict';
let busy=false,deadline=0,pendingClaim=null;
const P=window.LumiPlatform,S=window.LumiServer;
const coins=()=>P?.rule('ad_bonus_coins',100)??100;
function paint(){
 const data=P?.state;
 document.querySelectorAll('[data-eyo-ad-bonus]').forEach(root=>{
  const b=root.querySelector('button'),note=root.querySelector('small');
  const remaining=Math.max(0,Math.ceil((deadline-performance.now())/1000));
  b.textContent=busy?'Yoxlanılır…':remaining?Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0')+' sonra':'Reklam izlə · +'+coins()+' sikkə';
  b.disabled=busy||remaining>0||!data||!window.LumiNativeAds||EyoCloud.mode!=='server'||data.rules?.ads_enabled===false||data.rules?.ad_ssv_enabled!==true;
  note.textContent=!window.LumiNativeAds?'Mükafatlı reklam Android tətbiqində açılır.':remaining?'Bonus yenilənəndə yenidən toplaya bilərsən.':'Reklamı tamamla, ipucları üçün '+coins()+' sikkə qazan. LUMI balansı dəyişmir.';
 });
}
function sync(){const d=P?.state;if(d)deadline=performance.now()+Math.max(0,Date.parse(d.ad_next_at)-Date.parse(d.server_now)||0);paint();}
async function rpc(action,id=null){const r=await S.client.rpc('lumi_ad_bonus',{p_action:action,p_request:id});if(r.error)throw r.error;return r.data;}
window.EyoCoinBonus={
 markup:()=>'<article class="eyo-ad-card" data-eyo-ad-bonus><span class="eyebrow">İPUCUN ÜÇÜN KİÇİK FASİLƏ</span><h3>Sikkə topla, sözü kəşf et</h3><p>İstəyə bağlı reklamın mükafatı yalnız EYO oyun sikkəsidir.</p><button type="button" class="primary gold" data-action="ad-coins">Bonus hazırlanır…</button><small></small></article>',
 paint,
 async claim(){
  if(busy)return;
  if(EyoCloud.mode!=='server')throw Error('Sikkə toplamaq üçün Lumi hesabına daxil ol.');
  if(!window.LumiNativeAds)throw Error('Mükafatlı reklamı Android tətbiqində aça bilərsən.');
  busy=true;paint();
  try{
   const ad=await LumiAds.rewardedAsync({placement:'eyo_coins'});if(!ad.verified)return {rewarded:false,pending:!!ad.pending};const result=ad.receipt;pendingClaim=null;
   await P.refresh(true);await EyoCloud.refresh();LumiAds.ackReward({placement:'eyo_coins'},result.id);sync();
   return {rewarded:true,coins:result.coins};
  }finally{busy=false;paint();}
 }
};
window.addEventListener('lumi:platform',sync);window.addEventListener('lumi:reward-verified',async e=>{if(e.detail.placement==='eyo_coins'){await P.refresh(true);await EyoCloud.refresh();LumiAds.ackReward({placement:'eyo_coins'},e.detail.receipt.id);sync()}});
window.addEventListener('eyo:cloud',paint);
P?.ready?.then(sync);setInterval(paint,1000);
})();
