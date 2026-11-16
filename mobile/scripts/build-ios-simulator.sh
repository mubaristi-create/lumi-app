#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != "Darwin" ]]; then echo "iOS compilation requires macOS + Xcode 26 or later." >&2; exit 1; fi
node scripts/prepare-ios.mjs
xcodebuild -project ios/App/App.xcodeproj -scheme App -resolvePackageDependencies -clonedSourcePackagesDirPath build/SourcePackages
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath build/ios-simulator -clonedSourcePackagesDirPath build/SourcePackages CODE_SIGNING_ALLOWED=NO build
sim_app=build/ios-simulator/Build/Products/Debug-iphonesimulator/App.app
# A local ad-hoc simulator identity is needed for real Keychain tests. No Apple account/profile is used.
cat > build/simulator-entitlements.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>application-identifier</key><string>LUMISIMULATOR.az.playlumio.app</string>
<key>keychain-access-groups</key><array><string>LUMISIMULATOR.az.playlumio.app</string></array>
<key>get-task-allow</key><true/>
</dict></plist>
PLIST
codesign --force --sign - --entitlements build/simulator-entitlements.plist "$sim_app"
codesign --verify "$sim_app"
mkdir -p build/artifacts
ditto -c -k --sequesterRsrc --keepParent build/ios-simulator/Build/Products/Debug-iphonesimulator/App.app build/artifacts/Lumi-iOS-2.0.8-simulator.zip
echo 'Simulator app: build/artifacts/Lumi-iOS-2.0.8-simulator.zip (not installable on an iPhone)'
