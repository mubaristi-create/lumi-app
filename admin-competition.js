(()=>{'use strict';
const $=id=>document.getElementById(id),panel=document.querySelector('[data-panel="competition"]');
if(!panel||!window.LumiControlAdmin)return;
document.querySelector('[data-tab="competition"]').textContent='Həftənin yarışı';
document.querySelector('[data-tab="overview"]').after(document.querySelector('[data-tab="competition"]'));
const legacy=$('control-round').closest('.card');legacy.querySelector('h2').textContent='Yarış tarixçəsi və qaliblər';
legacy.querySelectorAll('label,#control-round-start,#control-round-close,#control-round').forEach(e=>e.hidden=true);
legacy.querySelectorAll(':scope>p').forEach(e=>e.hidden=true);
const card=document.createElement('section');card.className='card competition-editor';
card.innerHTML=`<h2>Həftənin yarışı</h2><p id="competition-status" role="status">Yüklənir…</p>
<button type="button" id="competition-toggle">Yüklənir…</button>
<form id="competition-form"><label>Yarışın adı<input name="title" maxlength="100" required></label>
<div class="competition-dates"><label>Başlanğıc · Bakı vaxtı<input type="datetime-local" name="starts_at" required></label>
<label>Bitmə · Bakı vaxtı<input type="datetime-local" name="ends_at" required></label></div>
<div class="competition-dates"><label>Müddət · gün<input type="number" name="duration" min="1" max="60" step="1" value="7"></label>
<label>Kampaniyalararası fasilə · gün<input type="number" name="gap_days" min="1" max="30" step="1" required value="2"></label></div>
<label class="check"><input type="checkbox" name="auto_repeat">Bitdikdən sonra seçilmiş fasilə ilə avtomatik yeni yarış başlasın</label>
<label class="check"><input type="checkbox" name="enabled">Yarış sistemi aktiv olsun</label>
<p>Fasilədə və söndürülmüş vaxtda yarış xalı hesablanmır. Oyun və hesab balansı işləməyə davam edir. Qazanılmış yarış xalları və əvvəlki qaliblər saxlanılır. Hər yeni kampaniya sıfır yarış xalı ilə başlayır.</p>
<p>Başlanğıc və bitmə tarixlərini əl ilə seçə və ya gün sayını dəyişə bilərsən. Xal yığılmış yarışın başlanğıcı dəyişdirilmir.</p>
<button class="primary" type="submit">Tarixləri və fasiləni saxla</button>
<button type="button" id="competition-new">Növbəti kampaniyanı planlaşdır</button>
<button type="button" id="competition-reload">Yenidən yüklə</button></form><p id="competition-feedback" role="status"></p>`;
panel.prepend(card);
let state=null,roundId=null,busy=false;
const form=$('competition-form'),feedback=$('competition-feedback');
const date=v=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Baku',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(v)).replace(' ','T');
const iso=v=>{const d=new Date(v+'+04:00');if(!Number.isFinite(d.getTime()))throw Error('Tarixi düzgün seç.');return d.toISOString()};
async function rpc(action,data={}){const{data:result,error}=await LumiServer.client.rpc('lumi_admin_competition',{p_action:action,p_data:data,p_request:action==='overview'?null:crypto.randomUUID()});if(error)throw error;return result}
function fill(s,newCampaign=false){
state=s;const schedule=s.schedule,round=s.round;
const editing=round&&round.starts_at===schedule.starts_at&&round.ends_at===schedule.ends_at&&!newCampaign;
roundId=editing?round.id:null;
let start=schedule.starts_at,end=schedule.ends_at;
if(newCampaign){start=new Date(Math.max(Date.now()+60000,round?new Date(round.ends_at).getTime()+schedule.gap_days*86400000:Date.now()+schedule.gap_days*86400000)).toISOString();end=new Date(new Date(start).getTime()+7*86400000).toISOString()}
form.elements.title.value=schedule.title;form.elements.starts_at.value=date(start);form.elements.ends_at.value=date(end);
form.elements.duration.value=Math.max(1,Math.round((new Date(end)-new Date(start))/86400000));form.elements.gap_days.value=schedule.gap_days;
form.elements.auto_repeat.checked=schedule.auto_repeat;form.elements.enabled.checked=s.enabled;
$('competition-toggle').textContent=s.enabled?'Yarışı söndür':'Yarışı aktiv et';
$('competition-status').textContent=!s.enabled?'Söndürülüb. Yarış xalı hesablanmır.':round?'Aktiv kampaniya · '+date(round.starts_at).replace('T',' ')+' — '+date(round.ends_at).replace('T',' '):new Date(schedule.starts_at)>new Date()?'Fasilə / planlaşdırılıb · növbəti başlanğıc: '+date(schedule.starts_at).replace('T',' '):'Kampaniya bitib. Yeni tarix seç və ya avtomatik təkrarı aktiv et.';
}
async function load(){fill(await rpc('overview'))}
async function run(fn){if(busy)return;busy=true;card.querySelectorAll('button').forEach(b=>b.disabled=true);feedback.textContent='Saxlanılır…';try{await fn();await original();feedback.textContent='Serverdə saxlanıldı. Qayda tətbiqdə dərhal qüvvəyə minir.'}catch(e){feedback.textContent=({'Schedule changed; reload':'Ayarlar dəyişib. Yenidən yüklə və təkrar saxla.','Cannot move start after points were earned':'Xal toplanmış yarışın başlanğıc vaxtını dəyişmək olmaz.','Allow the configured break after the current campaign':'Əvvəlki kampaniyadan sonra seçilmiş fasilə günlərini saxla.','Invalid campaign dates':'Başlanğıc və gələcək bitmə vaxtını düzgün seç. Müddət 1 saat–60 gün olmalıdır.','Campaign dates overlap':'Bu tarixlər başqa kampaniya ilə üst-üstə düşür.','Campaign already finished':'Yarış artıq bitib. Növbəti kampaniyanı planlaşdır.','New campaign must start in the future':'Yeni kampaniya üçün gələcək başlanğıc vaxtı seç.','Admin access required':'Admin girişi təsdiqlənmədi. Yenidən daxil ol.'})[e.message]||'Saxlanılmadı. Bağlantını yoxla və yenidən cəhd et.'}finally{busy=false;card.querySelectorAll('button').forEach(b=>b.disabled=false)}}
form.onsubmit=e=>{e.preventDefault();if(!state||!form.reportValidity())return;run(async()=>fill(await rpc('save',{version:state.schedule.version,round_id:roundId,title:form.elements.title.value.trim(),starts_at:iso(form.elements.starts_at.value),ends_at:iso(form.elements.ends_at.value),gap_days:Number(form.elements.gap_days.value),auto_repeat:form.elements.auto_repeat.checked,enabled:form.elements.enabled.checked,reason:'Admin: kampaniya tarixləri və fasilə'})))};
$('competition-toggle').onclick=()=>state&&run(async()=>fill(await rpc('toggle',{enabled:!state.enabled,reason:'Admin: həftənin yarışı aç/söndür'})));
$('competition-reload').onclick=()=>run(load);
$('competition-new').onclick=()=>{if(state){fill(state,true);feedback.textContent='Yeni kampaniyanın tarixlərini yoxla və Saxla düyməsinə bas.'}};
const duration=()=>{if(form.elements.starts_at.value&&form.elements.duration.reportValidity())form.elements.ends_at.value=date(new Date(new Date(iso(form.elements.starts_at.value)).getTime()+Number(form.elements.duration.value)*86400000))};
form.elements.duration.onchange=duration;form.elements.starts_at.onchange=duration;
const original=window.LumiControlAdmin.load;window.LumiControlAdmin.load=async()=>{await original();await load()};
window.LumiCompetitionAdmin={load};
})();
