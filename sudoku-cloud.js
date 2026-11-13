/* Uses the same authenticated wallet and Google SSV receipts as the other Lumi games. */
(function(global){'use strict';
let owner=null,tail=Promise.resolve(),pending=null;
const ready=(async()=>{await global.LumiCloud.ready;owner=global.LumiCloud.state.account?.id||null})();
function key(){return 'lumi-sudoku-action:'+owner}
async function rpc(name,args={}){await ready;if(!owner||global.LumiCloud.state.status!=='signedIn'||global.LumiCloud.state.account?.id!==owner)throw Error('Əsas səhifədə Lumi hesabına daxil ol.');const {data,error}=await global.LumiServer.client.rpc(name,args);if(error){if(error.code==='P0001'&&!/rate|limit|çox.*sorğu|tez/i.test(error.message||''))remember(null);throw error}return data}
function remember(item){pending=item;try{if(item)localStorage.setItem(key(),JSON.stringify(item));else localStorage.removeItem(key())}catch{if(item)throw Error('Sorğunu təhlükəsiz saxlamaq üçün brauzer yaddaşını aktiv et.')}}
async function refresh(packet){if(packet?.won){await global.LumiCloud.refreshWallet();await global.LumiPlatform?.refresh?.(true)}return packet}
async function flush(){if(!pending)return null;const item=pending;const packet=await rpc(item.name,item.args);await refresh(packet);remember(null);return packet}
function enqueue(name,args){const task=tail.catch(()=>{}).then(async()=>{await ready;await flush();remember({name,args});return flush()});tail=task;return task}
global.LumiSudokuHost={ready,async load(){await ready;try{pending=JSON.parse(localStorage.getItem(key())||'null')}catch{}const packet=await flush();return packet||rpc('sudoku_resume')},start(level){return enqueue('sudoku_start',{p_level:level,p_request:crypto.randomUUID()})},act(id,kind,cell=null,value=null,receipt=null){return enqueue('sudoku_action',{p_id:id,p_request:crypto.randomUUID(),p_kind:kind,p_cell:cell,p_value:value,p_receipt:receipt})},
async revive(id){const options={placement:'sudoku_revive',context:id};let receipt=await global.LumiAds?.recoverReward?.(options);if(!receipt){const result=await global.LumiAds?.rewardedAsync(options);if(!result?.verified)throw Error(result?.pending?'Reklam server təsdiqini gözləyir. Bir az sonra yenidən yoxla.':'Reklam əlçatan deyil. Yeni oyun başlada bilərsən.');receipt=result.receipt}return this.act(id,'revive',null,null,receipt.id)},home(){location.href='./index.html#home'},async boundary(id,lost){try{await global.LumiAds?.[lost?'loss':'transition'](null,{sessionId:'sudoku:'+id})}catch{}},get owner(){return owner}};
global.LumiAds?.activate();global.addEventListener('pagehide',()=>global.LumiAds?.deactivate());
global.addEventListener('lumi:cloud',()=>{if(owner&&global.LumiCloud.state.account?.id!==owner)location.reload()});
})(window);
