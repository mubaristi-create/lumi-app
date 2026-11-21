/* Public support contact; never authentication credentials. */
window.LumiContact=Object.freeze({email:'playlumi00@gmail.com'});
document.querySelectorAll('[data-lumi-contact]').forEach(el=>{el.textContent=window.LumiContact.email;if(el.tagName==='A')el.href='mailto:'+window.LumiContact.email});
