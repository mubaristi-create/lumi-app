import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const mobile=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url),xcode=require('xcode'),plist=require('plist');
const app=path.join(mobile,'ios/App/App'),projectFile=path.join(mobile,'ios/App/App.xcodeproj/project.pbxproj');
const project=xcode.project(projectFile);project.parseSync();
const objects=project.hash.project.objects;
const group=project.findPBXGroupKey({path:'App'});
for(const name of ['LumiBridgeViewController.swift','LumiAuthStoragePlugin.swift','LumiGameStoragePlugin.swift','LumiAdsPlugin.swift','LumiAppleAuthPlugin.swift','LumiIOSSmoke.swift']){
 if(!project.hasFile(name))project.addSourceFile(name,{},group);
}
if(!project.hasFile('PrivacyInfo.xcprivacy')){const file=project.addFile('PrivacyInfo.xcprivacy',group,{lastKnownFileType:'text.xml'});file.uuid=project.generateUuid();project.addToPbxBuildFileSection(file);project.addToPbxResourcesBuildPhase(file);}
// Pin the native-only SDKs on the app target. Capacitor sync can regenerate its own package freely.
const target=project.getFirstTarget().firstTarget;
const root=project.getFirstProject().firstProject;
objects.XCRemoteSwiftPackageReference??={};objects.XCSwiftPackageProductDependency??={};
root.packageReferences??=[];target.packageProductDependencies??=[];
const sdkPackages=[
 ['https://github.com/googleads/swift-package-manager-google-mobile-ads.git','12.14.0','GoogleMobileAds'],
 ['https://github.com/googleads/swift-package-manager-google-user-messaging-platform.git','3.1.0','GoogleUserMessagingPlatform']
];
for(const [url,version,productName] of sdkPackages){
 let ref=Object.entries(objects.XCRemoteSwiftPackageReference).find(([k,v])=>!k.endsWith('_comment')&&v.repositoryURL===JSON.stringify(url))?.[0];
 if(!ref){ref=project.generateUuid();objects.XCRemoteSwiftPackageReference[ref]={isa:'XCRemoteSwiftPackageReference',repositoryURL:JSON.stringify(url),requirement:{kind:'exactVersion',version}};root.packageReferences.push({value:ref,comment:productName});}
 let dep=Object.entries(objects.XCSwiftPackageProductDependency).find(([k,v])=>!k.endsWith('_comment')&&v.package===ref)?.[0];
 if(!dep){dep=project.generateUuid();objects.XCSwiftPackageProductDependency[dep]={isa:'XCSwiftPackageProductDependency',package:ref,productName};target.packageProductDependencies.push({value:dep,comment:productName});
 const build=project.generateUuid();objects.PBXBuildFile[build]={isa:'PBXBuildFile',productRef:dep};
 const phase=Object.values(objects.PBXFrameworksBuildPhase).find(v=>v?.files);phase.files.push({value:build,comment:productName+' in Frameworks'});}
}
for(const [id,config] of Object.entries(objects.XCBuildConfiguration)){
 if(id.endsWith('_comment')||!config.buildSettings)continue;
 const settings=config.buildSettings;
 if(settings.IPHONEOS_DEPLOYMENT_TARGET)settings.IPHONEOS_DEPLOYMENT_TARGET='16.0';
 if(settings.PRODUCT_BUNDLE_IDENTIFIER){
  // Preserve the existing iOS identity until an Apple app registration exists.
  settings.PRODUCT_BUNDLE_IDENTIFIER='az.playlumio.app';
  settings.MARKETING_VERSION='2.0.8';settings.CURRENT_PROJECT_VERSION='1';
  settings.SWIFT_VERSION='5.0';settings.TARGETED_DEVICE_FAMILY='1';
  settings.OTHER_LDFLAGS='"$(inherited) -ObjC"';
 }
}
// xcode's addSourceFile may leave undefined optional fields; never serialize them into the project.
for(const section of Object.values(objects))if(section&&typeof section==='object')for(const obj of Object.values(section))if(obj&&typeof obj==='object')for(const [key,value] of Object.entries(obj))if(value===undefined||value==='undefined')delete obj[key];
fs.writeFileSync(projectFile,project.writeSync());
const file=path.join(app,'Info.plist'),info=plist.parse(fs.readFileSync(file,'utf8'));
info.CFBundleDisplayName='Lumi';
info.CFBundleURLTypes=[{CFBundleURLName:'Lumi Auth',CFBundleURLSchemes:['com.lumi.play']}];
info.GADApplicationIdentifier='ca-app-pub-3940256099942544~1458002511';
info.LumiTestAds=true;
info.LumiAppleSignInEnabled=false;
// Test-only initial integration. Production IDs + server allowlist need explicit setup.
info.SKAdNetworkItems=[{SKAdNetworkIdentifier:'cstr6suwn9.skadnetwork'}];
fs.writeFileSync(file,plist.build(info));
const configFile=path.join(app,'capacitor.config.json');
if(fs.existsSync(configFile)){
 const config=JSON.parse(fs.readFileSync(configFile,'utf8'));
 config.appId='az.playlumio.app';config.appName='Lumi';config.ios={...config.ios,contentInset:'never'};
 fs.writeFileSync(configFile,JSON.stringify(config,null,2)+'\n');
}
console.log('iOS-only configuration prepared (iOS 16+, existing bundle ID, official test ads). Android files untouched.');
