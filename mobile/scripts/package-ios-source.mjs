import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const mobile=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=path.dirname(mobile),stage=path.join(root,'work/ios-package/Lumi-iOS-2.0.8-source');
await fs.mkdir(stage,{recursive:true});
for(const name of await fs.readdir(root)){
 if(/\.(html|css|js|jpg|png|svg|wav|webmanifest)$/.test(name)&&!/^admin\.|^sw\.js$/.test(name))await fs.copyFile(path.join(root,name),path.join(stage,name));
}
await fs.cp(path.join(root,'tiles-assets'),path.join(stage,'tiles-assets'),{recursive:true});
const dest=path.join(stage,'mobile');await fs.mkdir(dest,{recursive:true});
for(const name of ['package.json','package-lock.json','capacitor.config.json','native-bridge.js','push-client.js','IOS-HAZIRLIQ.md'])await fs.copyFile(path.join(mobile,name),path.join(dest,name));
await fs.cp(path.join(mobile,'ios'),path.join(dest,'ios'),{recursive:true,filter:src=>!/(?:^|[\\/])(?:public|Pods|build|DerivedData|xcuserdata|output)(?:[\\/]|$)/.test(src)});
await fs.mkdir(path.join(dest,'scripts'),{recursive:true});
for(const name of ['build-web.mjs','configure-native.mjs','configure-ios.mjs','prepare-ios.mjs','build-ios-simulator.sh','build-ios-release.sh'])await fs.copyFile(path.join(mobile,'scripts',name),path.join(dest,'scripts',name));
await fs.mkdir(path.join(stage,'.github/workflows'),{recursive:true});
for(const name of ['ios-simulator.yml','ios-testflight.yml'])await fs.copyFile(path.join(root,'.github/workflows',name),path.join(stage,'.github/workflows',name));
await fs.copyFile(path.join(mobile,'IOS-HAZIRLIQ.md'),path.join(stage,'OXU-MENI.md'));
console.log(stage);
