import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'dist');
if(out!==path.join(root,'dist'))throw Error('Invalid artifact path');
await fs.rm(out,{recursive:true,force:true});
await fs.mkdir(out,{recursive:true});
// Only application assets at repository root. Never SQL, work/, native sources or audit evidence.
for(const name of await fs.readdir(root)){
 if(!/\.(html|css|js|jpg|png|svg|wav|webmanifest)$/.test(name)&&name!=='.nojekyll')continue;
 let data=await fs.readFile(path.join(root,name));
 if(name.endsWith('.html')){
  let html=data.toString().replace(/\r\n?/g,"\n"),handlers=[];
  html=html.replace(/\s(on[a-z]+)="([^"]*)"/gi,(_,attr,body)=>{const id='lumi-handler-'+handlers.length;handlers.push({id,event:attr.slice(2),body:body.replace(/&quot;/g,'"').replace(/&amp;/g,'&')});return ' data-'+id+'=""'});
  if(handlers.length)html=html.replace('</body>','<script>'+handlers.map(h=>'document.querySelector("[data-'+h.id+']").addEventListener('+JSON.stringify(h.event)+',function(event){'+h.body+'});').join('\n')+'</script></body>');
  const hashes=[...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>"'sha256-"+createHash('sha256').update(m[1]).digest('base64')+"'");
  if(name==='tiles.html')hashes.push(...JSON.parse(await fs.readFile(path.join(root,'tiles-csp.json'),'utf8')));
  const policy="default-src 'self'; script-src 'self' "+hashes.join(' ')+"; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://ubmcyzuhqrqdcpvebrzm.supabase.co; connect-src 'self' https://ubmcyzuhqrqdcpvebrzm.supabase.co wss://ubmcyzuhqrqdcpvebrzm.supabase.co; font-src 'self' data:; media-src 'self' blob: data:; object-src 'none'; base-uri 'self'; form-action 'self'";
  html=html.replace(/<head>/i,'<head><meta http-equiv="Content-Security-Policy" content="'+policy+'"><meta name="referrer" content="strict-origin-when-cross-origin">');
  data=Buffer.from(html);
 }
 await fs.writeFile(path.join(out,name),data);
}
console.log('Static site prepared in dist; script CSP hashes generated.');

await fs.cp(path.join(root,'tiles-assets'),path.join(out,'tiles-assets'),{recursive:true});
