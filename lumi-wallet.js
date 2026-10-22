(function(global){'use strict';
let memory=0;
function demoKey(){try{const s=JSON.parse(localStorage.getItem('lumi-session-v2')||'null');return s?.provider==='supabase'?'lumi-demo-points:'+s.userId:'lumi-points'}catch{return 'lumi-points'}}
function balance(){try{const value=Number(localStorage.getItem(demoKey()));if(Number.isFinite(value))memory=Math.max(0,Math.floor(value))}catch{}return memory}
function notify(){if(typeof global.CustomEvent==='function')global.dispatchEvent(new CustomEvent('lumi:balance',{detail:{balance:memory}}))}
function set(value){if(!Number.isSafeInteger(value)||value<0)return balance();memory=value;try{localStorage.setItem(demoKey(),String(value))}catch{}notify();return memory}
function add(game,amount){if(!Number.isSafeInteger(amount)||amount<=0)return balance();return set(balance()+amount)}
global.LumiWallet={balance,set,add};
})(globalThis);
