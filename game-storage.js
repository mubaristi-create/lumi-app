/* Non-auth game recovery only. Tokens continue to use LumiAuthStorage. */
(function(g){'use strict';
const valid=k=>/^(game-outbox|sudoku-action|tiles-outbox|tiles-resume|tiles-progress|tiles-prefs):[a-zA-Z0-9-]{1,64}$/.test(k);
let dbPromise;const memory=new Map();
function db(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{if(!g.indexedDB)return reject(Error('IndexedDB unavailable'));const r=g.indexedDB.open('lumi-game-recovery-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('records');r.onsuccess=()=>resolve(r.result);r.onerror=()=>{dbPromise=null;reject(r.error)};r.onblocked=()=>{dbPromise=null;reject(Error('Recovery database blocked'))}}))}
async function idb(key,value,write){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('records',write?'readwrite':'readonly'),store=tx.objectStore('records'),r=write?(value===null?store.delete(key):store.put(value,key)):store.get(key);let found;r.onsuccess=()=>found=r.result;tx.oncomplete=()=>resolve(found??null);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage aborted'))})}
async function get(key,legacyKey){if(!valid(key))throw Error('Invalid recovery key');let value=null;try{if(g.LumiNativeGameStorage)value=(await g.LumiNativeGameStorage.getItem({key})).value??null}catch{}if(value===null)try{value=await idb(key,null,false)}catch{}if(value===null)try{value=g.localStorage.getItem('lumi-game-v1:'+key)??(legacyKey?g.localStorage.getItem(legacyKey):null)}catch{}if(value===null)value=memory.get(key)??null;if(value==='__lumi_game_deleted_v1__')return null;if(value!==null)memory.set(key,value);return value}
async function set(key,value){if(!valid(key))throw Error('Invalid recovery key');if(value!==null&&typeof value!=='string')throw Error('Invalid recovery value');if(value!==null&&value.length>4194304)throw Error('Recovery snapshot too large');if(value===null)memory.delete(key);else memory.set(key,value);value=value===null?'__lumi_game_deleted_v1__':value;const failures=[];
 try{if(g.LumiNativeGameStorage){if(value===null)await g.LumiNativeGameStorage.removeItem({key});else await g.LumiNativeGameStorage.setItem({key,value});return{durable:true,backend:g.LumiNativePlatform==='ios'?'ios-private-file':'android-private-file'}}}catch(e){failures.push(e)}
 try{await idb(key,value,true);return{durable:true,backend:'indexeddb'}}catch(e){failures.push(e)}
 try{if(value===null)g.localStorage.removeItem('lumi-game-v1:'+key);else g.localStorage.setItem('lumi-game-v1:'+key,value);return{durable:true,backend:'localstorage'}}catch(e){failures.push(e)}
 g.dispatchEvent(new CustomEvent('lumi:storage-degraded',{detail:{scope:key.split(':')[0],code:'GAME_STORAGE_UNAVAILABLE'}}));return{durable:false,backend:'memory',code:'GAME_STORAGE_UNAVAILABLE'};
}
g.LumiGameStore={get,set,remove:key=>set(key,null)};
})(window);
