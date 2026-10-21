const $ = id => document.getElementById(id);
const welcome = $('welcome');
const signupPage = $('signup-page');
const loginOverlay = $('login-overlay');
const successPage = $('success-page');
const homePage = $('home-page');
const homeModalRoot = $('home-modal-root');
let account = readAccount();
let signedIn = readSession();
let points = readPoints();

function readAccount() {
  try { return JSON.parse(localStorage.getItem('lumi-account-v2') || 'null'); }
  catch { return null; }
}
function saveAccount(value) {
  if(!value.promoCode)value.promoCode='LUMI-'+randomSalt().slice(0,10).toUpperCase();
  try { localStorage.setItem('lumi-account-v2', JSON.stringify(value)); }
  catch { /* Keep this session usable when storage is blocked. */ }
}
function readSession() {
  try {
    const session=JSON.parse(localStorage.getItem('lumi-session-v2') || 'null');
    return Boolean(account && session?.email===account.email);
  } catch { return false; }
}
function saveSession() {
  signedIn=true;
  try { localStorage.setItem('lumi-session-v2', JSON.stringify({email:account.email})); }
  catch { /* Keep this session usable when storage is blocked. */ }
  globalThis.LumiAds?.activate(true);
}
function clearSession() {
  globalThis.LumiAds?.deactivate();
  signedIn=false;
  try { localStorage.removeItem('lumi-session-v2'); } catch { /* Ignore blocked storage. */ }
}
function readPoints() {
  try { return LumiWallet.balance(); }
  catch { return 0; }
}
function savePoints(value) {
  points=value;
  try { LumiWallet.set(points); } catch { /* Keep points for this session. */ }
}
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function showWelcome() {
  const returning=Boolean(signedIn && account);
  welcome.hidden = false;
  signupPage.hidden = true;
  loginOverlay.hidden = true;
  successPage.hidden = true;
  homePage.hidden = true;
  $('guest-actions').hidden=returning;
  $('returning-actions').hidden=!returning;
  $('returning-greeting').textContent=returning ? `Xoş gəldin ${account.username || account.firstName || ''}!` : 'Xoş gəldin!';
}
function showSignup() {
  welcome.hidden = true;
  loginOverlay.hidden = true;
  successPage.hidden = true;
  homePage.hidden = true;
  signupPage.hidden = false;
  signupPage.scrollTop = 0;
  $('signup-form').elements.firstName.focus({ preventScroll:true });
}
function openLogin() {
  if (signedIn) { showSuccess('login'); return; }
  loginOverlay.hidden = false;
  $('login-error').textContent = '';
  $('login-form').reset();
  $('login-form').elements.email.focus({ preventScroll:true });
}
function showSuccess(kind) {
  globalThis.LumiAds?.activate();
  welcome.hidden = true;
  signupPage.hidden = true;
  loginOverlay.hidden = true;
  homePage.hidden = true;
  successPage.hidden = false;
  $('success-title').textContent = `Xoş gəldin ${account?.username || 'LUMI dostu'}!`;
  $('success-copy').textContent = kind === 'signup'
    ? 'Qeydiyyatın uğurla tamamlandı. Hesabın bu cihazda saxlanıldı.'
    : 'Giriş uğurludur. Hesabına daxil oldun.';
}
function showHome() {
  globalThis.LumiAds?.activate();
  refreshPoints();
  welcome.hidden = true;
  signupPage.hidden = true;
  loginOverlay.hidden = true;
  successPage.hidden = true;
  homePage.hidden = false;
  $('home-page').scrollTop=0;
  $('app').scrollTop=0;
}
function normalizeEmail(email) { return email.trim().toLocaleLowerCase('az'); }
function randomSalt() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i=0;i<bytes.length;i++) bytes[i]=Math.floor(Math.random()*256);
  return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');
}
async function passwordDigest(password, salt) {
  const source = `${salt}:${password}`;
  if (globalThis.crypto?.subtle && globalThis.TextEncoder) {
    const data = new TextEncoder().encode(source);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  // File preview fallback for this local prototype; production auth belongs on a server.
  let hash = 2166136261;
  for (let i=0;i<source.length;i++) { hash ^= source.charCodeAt(i); hash = Math.imul(hash,16777619); }
  return (hash>>>0).toString(16).padStart(8,'0');
}
async function makePasswordRecord(password) {
  const salt=randomSalt();
  const digest=await passwordDigest(password,salt);
  return { salt, digest };
}
async function verifyPassword(password, record) {
  if (!record?.salt || !record?.digest) return false;
  return (await passwordDigest(password,record.salt))===record.digest;
}
function openHomeModal(content) {
  homeModalRoot.innerHTML=`<div class="home-modal-backdrop"><section class="home-modal" role="dialog" aria-modal="true">${content}</section></div>`;
  const backdrop=homeModalRoot.querySelector('.home-modal-backdrop');
  homeModalRoot.querySelectorAll('[data-home-close]').forEach(button=>button.addEventListener('click',closeHomeModal));
  backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeHomeModal();});
  return homeModalRoot.querySelector('.home-modal');
}
function closeHomeModal() {
  if (homeModalRoot._timer) clearInterval(homeModalRoot._timer);
  homeModalRoot._timer=null;
  homeModalRoot.replaceChildren();
}
function showNotifications() {
  openHomeModal(`<button class="home-modal-close" data-home-close aria-label="Bağla">×</button><h2>Bildirişlər</h2><p>Hələlik yeni bildiriş yoxdur. Yeni oyunlar və bonuslar haqqında məlumat burada görünəcək.</p><button class="action action-primary" data-home-close>Bağla</button>`);
}
function showProfile(){location.href='./profile.html'}
function escapeHTML(value) { return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function showGiftDetails(){refreshPoints();const percent=Math.min(100,points/5000*100);openHomeModal(`<button class="home-modal-close" data-home-close aria-label="Bağla">×</button><span class="eyebrow">TEZLİKLƏ</span><h2>5000 LUMI · 10 AZN</h2><img class="prize-preview" src="assets-prize-10.png" alt="10 AZN LUMI kartı"><p>Kampaniya müddətində 5000 xala ilk çatan 5 nəfərin hər biri 10 AZN mükafat qazanacaq.</p><div class="profile-row">Balansın: <b>${points} / 5000 LUMI</b></div><progress max="100" value="${percent}"></progress><p>Kampaniya hələ başlamayıb. Tarixlər, iştirak şərtləri və təsdiqlənmiş qaliblər burada yayımlanacaq.</p><button class="action action-primary" data-home-close>Oynamağa davam et</button>`)}
function startHomeGame(kind) {
  if (kind==='soon') { showToast('Yeni oyunlar tezliklə əlavə olunacaq.'); return; }
  const details={
    bonus:{title:'Bonus günəşi ☀️',icon:'☀️',description:'20 saniyə ərzində günəşə toxun, xal topla.'},
    flappy:{title:'Flappy Bird 🐤',icon:'🐤',description:'20 saniyə ərzində quşa toxunaraq mümkün qədər çox xal topla.'},
    space:{title:'Space Runner 🚀',icon:'⭐',description:'Ulduzları topla və 20 saniyədə xalını artır.'},
    fruit:{title:'Fruit Ninja 🍉',icon:'🍉',description:'Meyvələrə toxunaraq 20 saniyə ərzində xal qazan.'}
  }[kind] || {title:'Bonus oyunu ☀️',icon:'☀️',description:'20 saniyə ərzində toxunaraq xal topla.'};
  const modal=openHomeModal(`<button class="home-modal-close" data-home-close aria-label="Bağla">×</button><h2>${details.title}</h2><p>${details.description}</p><div class="game-area"><span class="home-game-score">Xal: <b id="home-round-score">0</b> · Vaxt: <b id="home-round-time">20</b></span><button class="home-game-target" id="home-game-target" type="button" aria-label="Hədəfə toxun">${details.icon}</button></div><button class="action action-primary" id="home-game-start">Oyuna başla</button>`);
  const target=modal.querySelector('#home-game-target');
  const start=modal.querySelector('#home-game-start');
  const scoreLabel=modal.querySelector('#home-round-score');
  const timeLabel=modal.querySelector('#home-round-time');
  let roundScore=0,seconds=20,running=false;
  target.addEventListener('click',()=>{
    if(!running) return;
    roundScore++;
    scoreLabel.textContent=roundScore;
    target.style.left=`${8+Math.random()*78}%`;
    target.style.top=`${24+Math.random()*58}%`;
  });
  start.addEventListener('click',()=>{
    if(running) return;
    running=true;start.disabled=true;start.textContent='Vaxt gedir…';
    target.style.position='absolute';
    homeModalRoot._timer=setInterval(()=>{
      seconds--;timeLabel.textContent=seconds;
      if(seconds<=0){
        clearInterval(homeModalRoot._timer);homeModalRoot._timer=null;running=false;
        LumiWallet.add('bonus',roundScore);refreshPoints();closeHomeModal();showToast(`Oyuna görə +${roundScore} xal qazandın!`);
      }
    },1000);
  });
}

$('login-open').addEventListener('click', openLogin);
$('signup-open').addEventListener('click', showSignup);
$('signup-back').addEventListener('click', showWelcome);
$('signup-to-login').addEventListener('click', () => { showWelcome(); openLogin(); });
$('login-to-signup').addEventListener('click', showSignup);
$('login-close').addEventListener('click', () => { loginOverlay.hidden=true; });
$('dialog-backdrop').addEventListener('click', () => { loginOverlay.hidden=true; });
$('success-continue').addEventListener('click', showHome);
$('logout').addEventListener('click', () => { clearSession(); showWelcome(); showToast('Hesabdan çıxdınız.'); });
$('returning-continue').addEventListener('click', showHome);
$('notifications-open').addEventListener('click', showNotifications);
$('profile-open').addEventListener('click', showProfile);
$('gift-open').addEventListener('click', showGiftDetails);
$('play-bonus').addEventListener('click',()=>startHomeGame('bonus'));
$('game-carousel').querySelectorAll('[data-game]').forEach(card=>card.addEventListener('click',()=>{
  if(card.dataset.game==='flappy'){location.href='./flappy.html';return;}
  if(card.dataset.game==='space'){location.href='./space-runner.html';return;}
  if(card.dataset.game==='merge9'){location.href='./merge9.html';return;}
  if(card.dataset.game==='fruit'){location.href='./fruit-ninja.html';return;}
  if(card.dataset.game==='sillycat'){location.href='./silly-cat.html';return;}
  if(card.dataset.game==='blast'){location.href='./blast-puzzle.html';return;}
  startHomeGame(card.dataset.game);
}));
const gameCarousel=$('game-carousel');
let carouselDrag=null, carouselDragged=false;
gameCarousel.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='mouse' || event.button!==0) return;
  carouselDrag={id:event.pointerId,x:event.clientX,left:gameCarousel.scrollLeft};
  carouselDragged=false;
});
gameCarousel.addEventListener('pointermove',event=>{
  if(!carouselDrag || event.pointerId!==carouselDrag.id) return;
  const delta=event.clientX-carouselDrag.x;
  if(Math.abs(delta)>4 && !carouselDragged){carouselDragged=true;gameCarousel.classList.add('is-dragging');gameCarousel.setPointerCapture(event.pointerId);}
  if(carouselDragged){gameCarousel.scrollLeft=carouselDrag.left-delta;event.preventDefault();}
});
const endCarouselDrag=event=>{
  if(!carouselDrag || event.pointerId!==carouselDrag.id) return;
  carouselDrag=null;
  gameCarousel.classList.remove('is-dragging');
  if(carouselDragged) setTimeout(()=>{carouselDragged=false;},350);
};
gameCarousel.addEventListener('pointerup',endCarouselDrag);
gameCarousel.addEventListener('pointercancel',endCarouselDrag);
gameCarousel.addEventListener('click',event=>{
  if(!carouselDragged) return;
  event.preventDefault();event.stopPropagation();carouselDragged=false;
},true);
document.addEventListener('keydown', event => {
  if (event.key==='Escape' && !loginOverlay.hidden) loginOverlay.hidden=true;
  if (event.key==='Escape' && homeModalRoot.firstElementChild) closeHomeModal();
});

showWelcome();

$('signup-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form=event.currentTarget;
  const data=Object.fromEntries(new FormData(form).entries());
  const error=$('signup-error');
  error.textContent='';
  for (const [name,label] of [['firstName','Ad'],['lastName','Soyad'],['username','İstifadəçi adı'],['email','E-poçt'],['phone','Telefon nömrəsi'],['password','Şifrə'],['confirmPassword','Şifrənin təkrarı']]) {
    if (!String(data[name]||'').trim()) { error.textContent=`${label} sahəsini doldurun.`; form.elements[name].focus(); return; }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) { error.textContent='Düzgün e-poçt ünvanı daxil edin.'; form.elements.email.focus(); return; }
  if (data.username.trim().length<3) { error.textContent='İstifadəçi adı ən azı 3 simvol olmalıdır.'; form.elements.username.focus(); return; }
  if (data.phone.replace(/\D/g,'').length<7) { error.textContent='Düzgün telefon nömrəsi daxil edin.'; form.elements.phone.focus(); return; }
  if (data.password.length<8) { error.textContent='Şifrə ən azı 8 simvol olmalıdır.'; form.elements.password.focus(); return; }
  if (data.password!==data.confirmPassword) { error.textContent='Şifrələr eyni deyil.'; form.elements.confirmPassword.focus(); return; }
  const submit=form.querySelector('[type=submit]');
  submit.disabled=true; submit.textContent='Hesab yaradılır…';
  try {
    const password=await makePasswordRecord(data.password);
    account={ firstName:data.firstName.trim(), lastName:data.lastName.trim(), username:data.username.trim(), email:normalizeEmail(data.email), phone:data.phone.trim(), password };
    saveAccount(account);
    saveSession();
    showSuccess('signup');
  } catch (err) {
    error.textContent='Qeydiyyat zamanı xəta oldu. Yenidən cəhd edin.';
    console.error('LUMI sign-up error:',err);
  } finally {
    submit.disabled=false; submit.textContent='Qeydiyyatdan keç';
  }
});

$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form=event.currentTarget;
  const data=Object.fromEntries(new FormData(form).entries());
  const error=$('login-error');
  error.textContent='';
  if (!data.email.trim() || !data.password) { error.textContent='E-poçt və şifrəni daxil edin.'; return; }
  if (!account || normalizeEmail(data.email)!==account.email || !(await verifyPassword(data.password,account.password))) {
    error.textContent='E-poçt və ya şifrə yanlışdır. Hesabın yoxdursa, qeydiyyatdan keç.';
    return;
  }
  saveSession();
  showSuccess('login');
});

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;location.reload()}});window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{}));
}

function refreshPoints(){points=readPoints();const balance=document.getElementById("home-balance");if(balance)balance.textContent="⭐ "+points+" LUMI";document.querySelectorAll("[data-wallet-balance]").forEach(el=>el.textContent=points);}
addEventListener("lumi:balance",refreshPoints);addEventListener("storage",refreshPoints);addEventListener("pageshow",refreshPoints);addEventListener("focus",refreshPoints);document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshPoints()});refreshPoints();
