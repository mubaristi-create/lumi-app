#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != "Darwin" ]]; then echo "iOS compilation requires macOS + Xcode 26 or later." >&2; exit 1; fi
node scripts/prepare-ios.mjs
xcodebuild -project ios/App/App.xcodeproj -scheme App -resolvePackageDependencies -clonedSourcePackagesDirPath build/SourcePackages
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath build/ios-simulator -clonedSourcePackagesDirPath build/SourcePackages CODE_SIGNING_ALLOWED=NO build
mkdir -p build/artifacts
ditto -c -k --sequesterRsrc --keepParent build/ios-simulator/Build/Products/Debug-iphonesimulator/App.app build/artifacts/Lumi-iOS-2.0.8-simulator.zip
echo 'Simulator app: build/artifacts/Lumi-iOS-2.0.8-simulator.zip (not installable on an iPhone)'
