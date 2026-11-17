#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != "Darwin" ]]; then echo "iOS compilation requires macOS + Xcode 26 or later." >&2; exit 1; fi
node scripts/prepare-ios.mjs
xcodebuild -project ios/App/App.xcodeproj -scheme App -resolvePackageDependencies -clonedSourcePackagesDirPath build/SourcePackages
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath build/ios-simulator -clonedSourcePackagesDirPath build/SourcePackages CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Automatic DEVELOPMENT_TEAM= ENABLE_DEBUG_DYLIB=NO ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES=YES build
# Xcode performs local simulator signing; no distribution certificate or Apple account is used.
mkdir -p build/artifacts
ditto -c -k --sequesterRsrc --keepParent build/ios-simulator/Build/Products/Debug-iphonesimulator/App.app build/artifacts/Lumi-iOS-2.0.8-simulator.zip
echo 'Simulator app: build/artifacts/Lumi-iOS-2.0.8-simulator.zip (not installable on an iPhone)'
