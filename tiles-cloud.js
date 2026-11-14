/* Same Lumi auth and audited wallet. Never writes a client balance. */
(function(global){'use strict';
global.LumiTilesBridge={async create(Game){
 await global.LumiCloud.ready;
 const uid=global.LumiCloud.state.account?.id||'guest',key='lumi-tiles-outbox:'+uid;
 let state=null,queue={},tail=Promise.resolve(),draining=false;
 try{queue=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
 function actor(){return uid!=='guest'&&global.LumiCloud.state.status==='signedIn'&&global.LumiCloud.state.account?.id===uid}
 function persist(){try{localStorage.setItem(key,JSON.stringify(queue))}catch{}}
 async function rpc(name,args={}){if(!actor())throw Error('Lumi hesabına daxil ol');const r=await global.LumiServer.client.rpc(name,args);if(r.error)throw r.error;return r.data}
 async function refresh(){state=await rpc('tiles_state');return state}
 function events(g){const replay=new Game(g.level,g.runId,g.initialHelps);return g.events.map(e=>{let ok=e.type==='match'?replay.match(...e.ids):e.type==='hint'?replay.hint():e.type==='undo'?replay.undo():e.type==='shuffle'?replay.shuffle(e.seed):e.type==='rewarded_help'?replay.grantHelp(e):false;if(!ok)throw Error('Invalid replay');return e.type==='shuffle'?{...e,board:structuredClone(replay.board)}:e})}
 async function drain(){
  if(!actor()||draining)return;draining=true;let failure=null;
  try{for(const [run,json] of Object.entries(queue)){try{
   const g=Game.restore(json),result=await rpc('tiles_sync',{p_run:run,p_level:g.level,p_events:events(g)});state=result.state;
   let checkpointSaved=false;try{await rpc('tiles_checkpoint',{p_run:run,p_checkpoint:JSON.parse(json)});checkpointSaved=true}catch(error){failure=error;global.dispatchEvent(new CustomEvent('lumi:tiles-checkpoint-error',{detail:{runId:run,message:error.message}}))}
   global.dispatchEvent(new CustomEvent('lumi:tiles-reward',{detail:{...result,runId:run}}));
   // A response may have been lost after the server committed. A replay credits zero,
   // but its authoritative balance still has to reach the main Lumi wallet.
   if(result.credited>0||Number(result.state?.balance)!==Number(global.LumiCloud.state.balance)){
    await global.LumiCloud.refreshWallet();await global.LumiPlatform?.refresh?.(true);
   }
   if(checkpointSaved)for(const e of g.events.filter(e=>e.type==='rewarded_help'))global.LumiAds?.ackReward?.({placement:'tiles_'+e.help,context:run},e.receiptId);
   if(checkpointSaved&&result.reward_status!=='daily_limit'&&queue[run]===json){delete queue[run];persist()}
  }catch(error){failure=error;global.dispatchEvent(new CustomEvent('lumi:tiles-sync-pending',{detail:{runId:run}}))}}if(failure)throw failure}finally{draining=false}
 }
 function flush(){tail=tail.catch(()=>{}).then(drain);return tail}
 const opportunities=new Map();const rewardedAds=global.LumiNativeAds?{async prepareRewardedHelp({runId,level,help}){if(!['hint','shuffle','undo'].includes(help))return null;await flush();const id=crypto.randomUUID();opportunities.set(id,{runId,level,help});return{opportunityId:id}},async showRewardedAd({opportunityId}){const o=opportunities.get(opportunityId);if(!o)return{completed:false};o.result=await global.LumiAds.rewardedAsync({placement:'tiles_'+o.help,context:o.runId});return{completed:!!o.result.verified}},async claimRewardedHelp({opportunityId}){const o=opportunities.get(opportunityId);return o?.result?.verified?{receiptId:o.result.receipt.id}:null},async verifyRewardedHelp({receiptId}){for(const o of opportunities.values())if(o.result?.receipt?.id===receiptId)return{confirmed:o.result.verified,receiptId,runId:o.runId,level:o.level,help:o.help,quantity:1};return{confirmed:false}}}:null;
const host={scope:uid,rewardedAds,progress(){return state?{levels:state.levels,resume:state.resume?JSON.stringify(state.resume):null}:null},async getBalance(){if(!actor())return null;try{await flush()}catch{}await global.LumiCloud.refreshWallet();return{points:Number(global.LumiCloud.state.balance),receipt:'lumi-wallet:'+uid}},async bonusState(){return rpc('tiles_bonus_state')},async claimBonus(kind){const r=await rpc('tiles_bonus_claim',{p_kind:kind});await global.LumiCloud.refreshWallet();await global.LumiPlatform?.refresh?.(true);return r},async returnToLumi(){location.href='./index.html#home'},async prepare(){try{await refresh();return{hint:state.rules.initial_helps+state.inventory.hints,shuffle:state.rules.initial_helps+state.inventory.shuffles,undo:state.rules.initial_helps+state.inventory.undos}}catch{return null}},syncRun(json){if(!actor())return Promise.resolve({status:'guest'});const g=Game.restore(json);queue[g.runId]=json;persist();return flush().then(()=>({status:'confirmed'})).catch(()=>({status:'pending'}))},rules(){return state?.rules||null}};
 const retry=()=>{if(!draining&&Object.keys(queue).length&&actor())flush().catch(()=>{})};
 global.addEventListener('online',retry);global.addEventListener('focus',retry);global.document?.addEventListener('visibilitychange',()=>{if(!global.document.hidden)retry()});
 const retryTimer=global.setInterval?.(()=>{if(!global.document?.hidden)retry()},15000);global.addEventListener('pagehide',()=>{if(retryTimer)global.clearInterval(retryTimer);persist()});
 global.addEventListener('lumi:cloud',()=>{if(global.LumiCloud.state.account?.id&&global.LumiCloud.state.account.id!==uid){location.reload();return}if(actor())retry();else global.dispatchEvent(new Event('lumi:tiles-auth-expired'))});
 if(actor())try{await refresh();await flush()}catch{}
 return host;
}};
})(window);

