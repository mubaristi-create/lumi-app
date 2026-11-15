const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const xcode=require('../mobile/node_modules/xcode'),plist=require('../mobile/node_modules/plist');
const base=process.cwd();const read=p=>fs.readFileSync(p,'utf8');
const info=plist.parse(read('mobile/ios/App/App/Info.plist'));assert.equal(info.CFBundleDisplayName,'Lumi');assert.equal(info.LumiTestAds,true);assert.equal(info.CFBundleURLTypes[0].CFBundleURLSchemes[0],'com.lumi.play');assert.equal(info.GADApplicationIdentifier,'ca-app-pub-3940256099942544~1458002511');assert(!info.NSAppTransportSecurity);
const proj=xcode.project('mobile/ios/App/App.xcodeproj/project.pbxproj');proj.parseSync();for(const name of ['LumiAuthStoragePlugin.swift','LumiGameStoragePlugin.swift','LumiAdsPlugin.swift','LumiBridgeViewController.swift','PrivacyInfo.xcprivacy'])assert(proj.hasFile(name),name);
let bridge=read('mobile/native-bridge.js').replace(/^import .*;\r?\n/gm,'');
for(const platform of ['android','ios']){
 const names=[],events={};const element={addEventListener(){},};const plugin={initialize:()=>Promise.resolve({}),diagnostics:()=>Promise.resolve({initialized:true}),addListener:()=>Promise.resolve({}),hideBanner:()=>Promise.resolve({})};
 const context={Capacitor:{isNativePlatform:()=>true,getPlatform:()=>platform},registerPlugin:n=>{names.push(n);return plugin},installPush:()=>{},LocalNotifications:{addListener:()=>Promise.resolve({})},App:{addListener:()=>Promise.resolve({}),getLaunchUrl:()=>Promise.resolve(null)},Browser:{},StatusBar:{setStyle:()=>Promise.resolve(),setBackgroundColor:()=>Promise.resolve()},Style:{Dark:'dark'},window:{addEventListener(n,fn){events[n]=fn}},document:{readyState:'loading',addEventListener(){}},location:{pathname:'/index.html',href:'https://localhost/index.html'},console,URL,Event,CustomEvent:class{}};
 vm.runInNewContext(bridge,context);assert.deepEqual(names,['LumiAuthStorage','LumiGameStorage','LumiNativeAds']);assert.equal(context.window.LumiNativePlatform,platform);assert(context.window.LumiNativeOAuth);
}
const native=read('mobile/ios/App/App/LumiAuthStoragePlugin.swift');assert(native.includes('kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly'));assert(native.includes('SecItemUpdate'));assert(!native.includes('UserDefaults.standard'));
const game=read('mobile/ios/App/App/LumiGameStoragePlugin.swift');assert(game.includes('SHA256.hash'));assert(game.includes('.atomic'));assert(game.includes('isExcludedFromBackup = true'));assert(!game.includes('lumi-server-auth'));
const ads=read('mobile/ios/App/App/LumiAdsPlugin.swift');assert(ads.includes('ServerSideVerificationOptions'));assert(ads.includes('"verified": false'));assert(ads.includes('config.setPublisherFirstPartyIDEnabled(false)'));
console.log('PASS: iOS project/Info.plist, scoped native storage, server-only reward contract, Android+iOS bridge registration. Native compile remains a macOS check.');
