import fs from 'node:fs';
const android='android/app/src/main/AndroidManifest.xml',ios='ios/App/App/Info.plist';
const target=process.argv[2]||'all';
if(target!=='ios'&&fs.existsSync(android)){let s=fs.readFileSync(android,'utf8').replace('android:allowBackup="true"','android:allowBackup="false"');if(!s.includes('android:screenOrientation'))s=s.replace('android:name=".MainActivity"','android:name=".MainActivity"\n            android:screenOrientation="portrait"');fs.writeFileSync(android,s)}
if(target!=='android'&&fs.existsSync(ios)){let s=fs.readFileSync(ios,'utf8').replace(/\s*<string>UIInterfaceOrientationLandscape(?:Left|Right)<\/string>/g,'').replace(/\s*<string>UIInterfaceOrientationPortraitUpsideDown<\/string>/g,'');fs.writeFileSync(ios,s)}
