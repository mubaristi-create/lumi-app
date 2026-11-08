/* Supabase async storage: Android Keystore; WebCrypto/IndexedDB on HTTPS web. */
(()=>{'use strict';
const PREFIX='lumi-server-auth-v1',legacy={getItem(k){try{return window.localStorage.getItem(k)}catch{return null}},setItem(k,v){try{window.localStorage.setItem(k,v)}catch{}},removeItem(k){try{window.localStorage.removeItem(k)}catch{}}};let blocked=legacy.getItem('lumi-auth-explicit-logout-v1')==='1',dbPromise=null;
const allowed=k=>typeof k==='string'&&k.startsWith(PREFIX)&&/^[a-z0-9-]{1,128}$/.test(k);
const native=()=>window.LumiNativeAuthStorage;
function database(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{if(!window.indexedDB||!window.crypto?.subtle){reject(Error('Secure storage unavailable'));return}const r=indexedDB.open('lumi-auth-secure-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('records');r.result.createObjectStore('keys')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}))}
async function read(store,key){const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function write(store,key,value,remove=false){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');remove?tx.objectStore(store).delete(key):tx.objectStore(store).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage aborted'))})}
let keyPromise;async function key(){return keyPromise||(keyPromise=(async()=>{let value=await read('keys','aes');if(value)return value;const generated=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('keys','readwrite'),store=tx.objectStore('keys'),r=store.get('aes');let chosen;r.onsuccess=()=>{chosen=r.result||generated;if(!r.result)store.put(chosen,'aes')};tx.oncomplete=()=>resolve(chosen);tx.onerror=()=>reject(tx.error)})})())}
async function secureGet(k){if(native())return(await native().getItem({key:k})).value??null;const record=await read('records',k);if(!record)return null;return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv,additionalData:new TextEncoder().encode(k)},await key(),record.data))}
async function secureSet(k,value){if(native()){await native().setItem({key:k,value});return}const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(k)},await key(),new TextEncoder().encode(value));await write('records',k,{iv,data})}
const storage=window.LumiAuthStorage={
 async getItem(k){if(!allowed(k))return null;if(blocked)return null;let value=await secureGet(k);if(value===null){const old=legacy.getItem(k);if(old!==null){await secureSet(k,old);legacy.removeItem(k);value=old}}return value},
 async setItem(k,value){if(!allowed(k))throw Error('Invalid auth storage key');if(blocked)return;await secureSet(k,String(value));legacy.removeItem(k)},
 async removeItem(k){if(!allowed(k))return;if(native())await native().removeItem({key:k});else await write('records',k,null,true);legacy.removeItem(k)},
 blockWrites(value){blocked=!!value;if(blocked)legacy.setItem('lumi-auth-explicit-logout-v1','1');else legacy.removeItem('lumi-auth-explicit-logout-v1')},
 async snapshot(){try{const raw=await this.getItem(PREFIX);const s=raw?JSON.parse(raw):null;return s?.refresh_token&&s?.user?.id?s:null}catch{return null}},
 async clear(){this.blockWrites(true);await Promise.all([PREFIX,PREFIX+'-code-verifier',PREFIX+'-user'].map(k=>this.removeItem(k)))},
 kind:()=>native()?'android-keystore':'webcrypto-indexeddb'
};
})();
