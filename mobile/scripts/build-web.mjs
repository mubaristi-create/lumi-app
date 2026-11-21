import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const mobile=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),source=path.resolve(mobile,'..'),out=path.join(mobile,'www');
await fs.mkdir(out,{recursive:true});
// Explicit static files only: no SQL, admin panel, workspace files or secrets.
for(const name of await fs.readdir(source)){
 if(!/\.(html|css|js|jpg|png|svg|wav|webmanifest)$/.test(name)||/^(admin\.|sw\.js$)/.test(name))continue;
 let contents=await fs.readFile(path.join(source,name));
 if(name.endsWith('.html')){let html=contents.toString().replace(/<script src="https:\/\/cdn.jsdelivr.net\/npm\/@supabase\/supabase-js@2"><\/script>/g,'<script src="supabase-local.js"></script>');html=html.replace(/<head>/i,'<head><script src="native-bridge.js"></script>');contents=Buffer.from(html)}
 if(name==='app.js')contents=Buffer.from(contents.toString().replace("if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol))", "if (!window.Capacitor?.isNativePlatform() && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol))"));
 if(name==='profile.js')contents=Buffer.from(contents.toString().replace('admin.hidden=!state.admin','admin.hidden=true'));
 if(name==='game-settings.js')contents=Buffer.from(contents.toString().replace('global.LumiGameLayout?.refresh();return{open,close:()=>dismiss(true)};',"global.addEventListener('lumi:native-background',()=>{if(overlay.hidden&&options.isRunning()&&!global.LumiAds?.inspect().busy)open()});global.LumiGameLayout?.refresh();return{open,close:()=>dismiss(true)};"));
 await fs.writeFile(path.join(out,name),contents);
}
await build({stdin:{contents:'import * as sdk from "@supabase/supabase-js"; window.supabase=sdk;',resolveDir:mobile},bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,outfile:path.join(out,'supabase-local.js')});
await build({entryPoints:[path.join(mobile,'native-bridge.js')],bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,outfile:path.join(out,'native-bridge.js')});
console.log('LUMI mobile assets prepared: '+out);

await fs.cp(path.join(source,'tiles-assets'),path.join(out,'tiles-assets'),{recursive:true});
