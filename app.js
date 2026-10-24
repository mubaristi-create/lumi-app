const $ = id => document.getElementById(id);
const welcome = $('welcome');
const signupPage = $('signup-page');
const loginOverlay = $('login-overlay');
const successPage = $('success-page');
const homePage = $('home-page');
const homeModalRoot = $('home-modal-root');
let account=null,signedIn=false,points=0,cloudBooted=false;
function readPoints(){return LumiCloud.state.status==='signedIn'?LumiCloud.state.balance:null}
async function clearSession(){await LumiCloud.signOut();globalThis.LumiAds?.deactivate();account=null;signedIn=false}
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
    ? 'Qeydiyyatın uğurla tamamlandı. Server hesabın hazırdır.'
    : 'Giriş uğurludur. Hesabına daxil oldun.';
}
function showHome() {
  if(!signedIn){showWelcome();showToast('Hesabına daxil ol.');return;}

  globalThis.LumiAds?.activate();
  refreshPoints();
  welcome.hidden = true;
  signupPage.hidden = true;
  loginOverlay.hidden = true;
  successPage.hidden = true;
  homePage.hidden = false;
  if(location.hash!=='#home')history.replaceState(null,'','#home');
  $('home-page').scrollTop=0;
  $('app').scrollTop=0;
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
  if(globalThis.LumiRewardNotifications){LumiRewardNotifications();return;}

  openHomeModal(`<button class="home-modal-close" data-home-close aria-label="Bağla">×</button><h2>Bildirişlər</h2><p>Hələlik yeni bildiriş yoxdur. Yeni oyunlar və bonuslar haqqında məlumat burada görünəcək.</p><button class="action action-primary" data-home-close>Bağla</button>`);
}
function showProfile(){location.href='./profile.html'}
function escapeHTML(value) { return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function showGiftDetails(){refreshPoints();const percent=Math.min(100,points/10000*100);openHomeModal(`<button class="home-modal-close" data-home-close aria-label="Bağla">×</button><span class="eyebrow">TEZLİKLƏ</span><h2>10000 LUMI · 5 AZN</h2><img class="prize-preview" src="assets-prize-5.svg" alt="5 AZN LUMI kartı"><p>Kampaniya müddətində 10000 xala ilk çatan 5 nəfərin hər biri 5 AZN mükafat qazanacaq.</p><div class="profile-row">Balansın: <b>${points} / 10000 LUMI</b></div><progress max="100" value="${percent}"></progress><p>Kampaniya hələ başlamayıb. Tarixlər, iştirak şərtləri və təsdiqlənmiş qaliblər burada yayımlanacaq.</p><button class="action action-primary" data-home-close>Oynamağa davam et</button>`)}
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
$('logout').addEventListener('click', async () => {try{await clearSession();showWelcome();showToast('Hesabdan çıxdınız.')}catch(e){showToast(LumiCloud.friendly(e))}});
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
  if (data.username.trim().length<3||data.username.trim().length>30) { error.textContent='İstifadəçi adı 3–30 simvol olmalıdır.'; form.elements.username.focus(); return; }
  if (data.phone.replace(/\D/g,'').length<7) { error.textContent='Düzgün telefon nömrəsi daxil edin.'; form.elements.phone.focus(); return; }
  if (data.password.length<8) { error.textContent='Şifrə ən azı 8 simvol olmalıdır.'; form.elements.password.focus(); return; }
  if (data.password!==data.confirmPassword) { error.textContent='Şifrələr eyni deyil.'; form.elements.confirmPassword.focus(); return; }
  const submit=form.querySelector('[type=submit]');
  submit.disabled=true; submit.textContent='Hesab yaradılır…';
  try {
    const result=await LumiServer.signUp(data);
    form.elements.password.value='';form.elements.confirmPassword.value='';
    if(result.session){await LumiCloud.refresh();if(LumiCloud.state.status!=='signedIn')throw Error('Profile load failed');showSuccess('signup')}
    else{showWelcome();openLogin();$('login-form').elements.email.value=data.email;$('login-error').textContent='E-poçtuna göndərilən linklə hesabını təsdiqlə, sonra daxil ol.';showToast('E-poçtunu yoxla — təsdiq məktubu göndərildi.');}
  } catch (err) {
    error.textContent=LumiCloud.friendly(err);
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
  const button=form.querySelector('[type=submit]');button.disabled=true;
  try{await LumiCloud.signIn(data.email,data.password);form.elements.password.value='';showSuccess('login')}
  catch(e){error.textContent=LumiCloud.friendly(e)}finally{button.disabled=false}

});

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;location.reload()}});window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{}));
}

function refreshPoints(){points=readPoints();const balance=$('home-balance');if(balance)balance.textContent=points===null?'Balans yüklənir…':'⭐ '+points+' LUMI';document.querySelectorAll('[data-wallet-balance]').forEach(el=>el.textContent=points===null?'—':points)}
function applyCloud(){const state=LumiCloud.state;account=state.account;signedIn=state.status==='signedIn';refreshPoints();const buttons=[$('login-open'),$('signup-open'),$('returning-continue')];buttons.forEach(b=>b.disabled=state.status==='loading');const avatar=$('profile-open').querySelector('img');if(account&&window.LumiCommunity){avatar.src=account.avatarUrl||LumiCommunity.avatar(account.avatarIndex);avatar.style.transform='none'}if(!cloudBooted&&state.status!=='loading'){cloudBooted=true;if(signedIn)showHome();else showWelcome();if(state.error)showToast(LumiCloud.friendly(state.error))}else if(signedIn&&location.hash==='#home'&&homePage.hidden){showHome()}else if(!signedIn&&!homePage.hidden){closeHomeModal();showWelcome()}}
addEventListener('lumi:cloud',applyCloud);addEventListener('lumi:balance',refreshPoints);LumiCloud.ready.then(applyCloud);applyCloud();
$('main-password-reset').onclick=async()=>{const email=$('login-form').elements.email;if(!email.value.trim()||!email.reportValidity()){$('login-error').textContent='Əvvəlcə e-poçt ünvanını yaz.';return}const button=$('main-password-reset');button.disabled=true;try{await LumiServer.resetPassword(email.value);$('login-error').textContent='Bu ünvanda hesab varsa, şifrə bərpası məktubu göndəriləcək.'}catch(e){$('login-error').textContent=LumiCloud.friendly(e)}finally{button.disabled=false}};
$('main-resend').onclick=async()=>{const email=$('login-form').elements.email;if(!email.value.trim()||!email.reportValidity())return;const button=$('main-resend');button.disabled=true;try{await LumiServer.resendConfirmation(email.value);$('login-error').textContent='Təsdiq məktubu üçün sorğu göndərildi. E-poçtunu yoxla.'}catch(e){$('login-error').textContent=LumiCloud.friendly(e)}finally{button.disabled=false}};

addEventListener('hashchange',()=>{if(location.hash==='#home'&&signedIn)showHome()});addEventListener('pageshow',()=>LumiCloud.ready.then(()=>{if(LumiCloud.state.status==='signedIn'&&location.hash==='#home'){account=LumiCloud.state.account;signedIn=true;showHome()}}));
