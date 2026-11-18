#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[[ "$(uname -s)" == Darwin ]] || { echo 'macOS + Xcode required.' >&2; exit 1; }
: "${IOS_TEAM_ID:?Apple team ID required}"
: "${IOS_BUNDLE_ID:?Registered Apple bundle ID required}"
: "${IOS_BUILD_NUMBER:?Unique numeric build number required}"
: "${IOS_PROFILE_NAME:?App Store distribution profile name required}"
[[ "$IOS_TEAM_ID" =~ ^[A-Z0-9]{10}$ && "$IOS_BUILD_NUMBER" =~ ^[1-9][0-9]*$ ]] || exit 1
[[ "$IOS_BUNDLE_ID" =~ ^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$ ]] || exit 1
node scripts/prepare-ios.mjs
mkdir -p build/artifacts
# Keep at least one argument: macOS Bash 3.2 treats an empty array as unset under set -u.
entitlements=(CODE_SIGN_ENTITLEMENTS=)
if [[ "${IOS_APPLE_SIGN_IN:-false}" == true ]]; then
  /usr/libexec/PlistBuddy -c 'Set :LumiAppleSignInEnabled true' ios/App/App/Info.plist
  entitlements=(CODE_SIGN_ENTITLEMENTS=App/App.entitlements)
fi
if [[ "${IOS_AD_MODE:-test}" == production ]]; then
  : "${IOS_ADMOB_APP_ID:?iOS AdMob app ID required}"
  : "${IOS_BANNER_UNIT:?iOS banner unit required}"
  : "${IOS_INTERSTITIAL_UNIT:?iOS interstitial unit required}"
  : "${IOS_REWARDED_UNIT:?iOS rewarded unit required}"
  [[ "${IOS_PRIVACY_REVIEWED:-false}" == true && "${IOS_SSV_CONFIGURED:-false}" == true ]] || {
    echo 'Production privacy and iOS SSV configuration must be reviewed first.' >&2; exit 1;
  }
  /usr/libexec/PlistBuddy -c 'Set :LumiTestAds false' ios/App/App/Info.plist
  /usr/libexec/PlistBuddy -c "Set :GADApplicationIdentifier $IOS_ADMOB_APP_ID" ios/App/App/Info.plist
  for format in Banner Interstitial Rewarded; do
    case "$format" in Banner) value="$IOS_BANNER_UNIT";; Interstitial) value="$IOS_INTERSTITIAL_UNIT";; Rewarded) value="$IOS_REWARDED_UNIT";; esac
    [[ "$value" =~ ^ca-app-pub-[0-9]{16}/[0-9]{10}$ ]] || exit 1
    /usr/libexec/PlistBuddy -c "Add :Lumi${format}Unit string $value" ios/App/App/Info.plist
  done
fi
xcodebuild -project ios/App/App.xcodeproj -scheme App -resolvePackageDependencies -clonedSourcePackagesDirPath build/SourcePackages
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/Lumi.xcarchive \
  -clonedSourcePackagesDirPath build/SourcePackages \
  DEVELOPMENT_TEAM="$IOS_TEAM_ID" PRODUCT_BUNDLE_IDENTIFIER="$IOS_BUNDLE_ID" \
  CURRENT_PROJECT_VERSION="$IOS_BUILD_NUMBER" CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY='Apple Distribution' PROVISIONING_PROFILE_SPECIFIER="$IOS_PROFILE_NAME" "${entitlements[@]}" archive
export IOS_TEAM_ID IOS_BUNDLE_ID IOS_PROFILE_NAME
python3 - <<'PY'
import os, plistlib
options = {'method':'app-store-connect','teamID':os.environ['IOS_TEAM_ID'],
 'signingStyle':'manual','signingCertificate':'Apple Distribution',
 'provisioningProfiles':{os.environ['IOS_BUNDLE_ID']:os.environ['IOS_PROFILE_NAME']},
 'uploadSymbols':True,'manageAppVersionAndBuildNumber':False}
with open('build/ExportOptions.plist','wb') as out: plistlib.dump(options,out)
PY
xcodebuild -exportArchive -archivePath build/Lumi.xcarchive \
  -exportOptionsPlist build/ExportOptions.plist -exportPath build/artifacts
ditto -c -k --sequesterRsrc --keepParent build/Lumi.xcarchive/dSYMs build/artifacts/Lumi-dSYMs.zip
echo 'Signed IPA prepared. Test ads remain enabled unless explicitly configured otherwise.'
