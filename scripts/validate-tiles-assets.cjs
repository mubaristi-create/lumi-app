const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const r=fs.readFileSync('tiles-runtime.js','utf8'),doc=JSON.parse(r.match(/const GAME_DOCUMENT=("(?:[^"\\]|\\.)*");/)[1]);
const manifest=JSON.parse(fs.readFileSync('tiles-icon-manifest.json','utf8')),box={structuredClone};vm.createContext(box);
vm.runInContext(r.slice(r.indexOf('const symbols='),r.indexOf('if(window.LumiTilesBridge)'))+';globalThis.cfg=sakuraConfig;globalThis.symbols=symbols;globalThis.Game=SakuraGame;',box);
assert.equal(manifest.length,180);assert.equal(new Set(manifest.map(m=>m.id)).size,180);
for(const m of manifest){assert.equal(m.render,'raster-3d');assert.equal(m.column,m.index%6);assert.equal(m.row,Math.floor(m.index/6));assert.equal(m.atlas,`tiles-assets/twin-match/world-${m.world}.jpg`);assert(fs.statSync(m.atlas).size>10000);assert.equal(fs.readFileSync(m.atlas).readUInt16BE(0),0xffd8)}
const used=new Set();
for(let level=1;level<=400;level++){
 const config=box.cfg(level),game=new box.Game(level,'test-'+level);
 for(const t of config.board){const index=box.symbols.indexOf(t.symbol),id='w'+Math.ceil(level/40)+'-'+index;assert(index>=0);assert(manifest.some(m=>m.id===id));used.add(id)}
 for(const pair of config.solution)game.match(...pair);
 assert.equal(game.pairs,0,'Solvable level '+level);assert.equal(game.phase,'victory');
}
assert.equal(used.size,180);assert(!doc.includes('<symbol'));assert(doc.includes('tile-raster'));assert(!doc.includes('source=document.getElementById(art)'));
assert(!r.includes('assets-tiles-986113f491a7933f.png'));assert(!r.includes('assets-tiles-d1f2c4f3c3a6fe89.png'));assert(fs.existsSync('twin-match-cover.png'));
console.log('PASS: all 400 levels solvable; all 180 IDs map to bundled 3D raster cells; no SVG card fallback or bird artwork.');

