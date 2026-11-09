/* Native AdMob at intentional game boundaries; never blocks normal browser play. */
(function(global){'use strict';let leaving=null;const finished=new Set();
global.LumiTilesAds={start(){global.LumiAds?.activate()},stop(){global.LumiAds?.deactivate()},async leave(runId,phase){if(typeof runId!=='string'||!runId||finished.has(runId))return leaving||Promise.resolve();if(leaving)return leaving;finished.add(runId);while(finished.size>100)finished.delete(finished.values().next().value);global.LumiAds?.deactivate();leaving=(async()=>{try{const method=['lost','no_moves'].includes(phase)?'loss':'transition';if(global.LumiAds)await global.LumiAds[method](null,{sessionId:'tiles:'+runId})}catch{}finally{leaving=null}})();return leaving}};
global.addEventListener('pagehide',()=>global.LumiTilesAds.stop());
})(window);
