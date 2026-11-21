import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {readFileSync, writeFileSync} from 'node:fs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const args of [['scripts/build-web.mjs'],['node_modules/@capacitor/cli/bin/capacitor','sync','ios'],['scripts/configure-native.mjs','ios'],['scripts/configure-ios.mjs']]){const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}
console.log('iOS assets prepared. Native compilation/signing still require macOS and Xcode.');

// Decode the lossless, opaque 1024px App Store icon after Capacitor sync.
writeFileSync(path.join(root,'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'), Buffer.from(readFileSync(path.join(root,'assets/app-icon-1024.png.base64'),'utf8').trim(),'base64'));
