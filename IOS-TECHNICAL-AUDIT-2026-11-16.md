# Lumi iOS texniki audit və keçid planı
Tarix: 16 noyabr 2026. Baza: yerli Lumi 2.0.8 / Android code 25.
Status: yalnız statik audit və sənədləşdirmə. Android, oyunlar və Supabase dəyişdirilməyib. iOS build, simulator və real WKWebView sınağı bu mərhələdə aparılmayıb. Canlı Supabase cədvəlləri və Apple hesabı yoxlanmayıb; server nəticələri yerli kod/migration əsasında qiymətləndirilir.

## 1. Faktiki texnologiyalar
React və React Native yoxdur. HTML5/CSS3/vanilla JavaScript, DOM/SVG/Canvas oyunları, esbuild ilə Supabase və native bridge bundling istifadə olunur. mobile/package-lock.json Capacitor core/iOS 8.5.3 kilidləyir. Android Java custom pluginləri ilə WebView; iOS Swift + Capacitor WKWebView + Swift Package Manager. Supabase JS Auth/PKCE, Postgres RPC/RLS, Edge Functions (AdMob SSV, push) ortaqdır.
Mövcud mobile/ios artıq var: yenidən cap add ios etməyə ehtiyac yoxdur. Skelet köhnədir: iOS 15 deployment, marketing 1.1/build 2, display LUMI; bundle az.playlumio.app. Ümumi capacitor.config.json isə com.lumi.play və Lumi istifadə edir. Bu uyğunsuzluq aradan qaldırılmadan sync/signing edilmir.

## 2. Prioritet tapıntılar
| Prioritet | Sübut/fayl | Nəticə və plan |
|---|---|---|
| Buraxılış blokeri | mobile/native-bridge.js yalnız android şərtində LumiNativeAuthStorage, LumiNativeGameStorage, LumiNativeAds qeyd edir | iOS native xidmətləri yoxdur; Java kodu iOS-da işləmir. Eyni JS müqaviləli Swift pluginləri əlavə edilməlidir. |
| Buraxılış blokeri | mobile/ios/App/App/Info.plist URL Types, GADApplicationIdentifier yoxdur | Google OAuth callback sxemi native-bridge və server-client-də com.lumi.play://auth/callback-dir, amma iOS qeydiyyatı yoxdur. URL Types əlavə olunmalı, Supabase allowlist read-only yoxlanmalı; mövcud Android callback saxlanmalıdır. |
| Yüksək | auth-storage.js native yoxdursa WebCrypto+IndexedDB tələb edir | capacitor://localhost origin-də crypto.subtle və davamlılıq təsdiqlənməyib. iOS Keychain plugin seçilir; cold launch və PKCE verifier saxlanması test olunur. Auth kind etiketi də platformaya uyğunlaşdırılmalıdır. |
| Yüksək | game-storage.js native plugin yoxdursa IndexedDB/localStorage istifadə edir | WKWebView process termination üçün Application Support-da atomik fayl yaddaşı plugin-i, mövcud key whitelist/limits və tombstone müqaviləsi saxlanmalıdır. |
| Yüksək | iOS CapApp-SPM/Package.swift yalnız App, Browser, StatusBar məhsullarını göstərir | package.json-dakı local/push notification paketləri iOS skeletinə sync edilməyib. Targeted sync ios; versiya və SPM nəticəsi review edilməlidir. |
| Yüksək | mobile/push-client.js Android createChannel və hazırda Android-only installPush | iOS APNs/FCM yolu yoxdur. Android FCM tokeni ilə APNs tokenini qarışdırmamaq; ayrıca iOS Firebase Messaging adapteri və ya APNs server yolu seçmək lazımdır. |
| Yüksək | build-web.mjs target es2022, CSS 100dvh/100svh və rotate xüsusiyyətləri | Deployment iOS15 ilə tam uyğunluq sübut edilməyib. Dəstəklənən minimuma görə JS target/CSS fallback, visualViewport yoxlaması tələb olunur. |
| Orta | capacitor.config ios.contentInset=automatic; oyun CSS-də env(safe-area-inset-*) | Native safe-area ilə CSS inset-in iki dəfə tətbiq olunması mümkündür. Tek ölçü sahibi və ölçülmüş banner slotu seçilməlidir. |
| Orta | .github/workflows/ios-simulator.yml yalnız unsigned simulator .app ZIP qurur | iPhone/TestFlight IPA deyil. Sertifikatlı Release archive/export/upload workflow yoxdur. |
| Orta | prepare-ios.mjs configure-native.mjs çağırır; həmin skript AndroidManifest də yaza bilir | iOS prepare-dan Android yazılmasını ayırmaq, platforma parametri əlavə etmək vacibdir. |

## 3. Oyunlar və WKWebView
Tiles: ortaq deterministik engine, 400 səviyyə, 180 inline SVG, kompakt event replay və parent bootstrap saxlanır. srcdoc iframe-də origin null, source+nonce yoxlaması WKWebView-də faktiki test edilməlidir. Şrift emojisi asılılığı çıxarılıb. Native plugin iframe-də deyil, parent-də qalmalıdır. Offline outbox, process kill, restore, undo və reklam dönüşü ayrıca sınaqdır.
Sudoku: server action UUID, pending action recovery, RPC validation saxlanır. iOS davamlı store ilə pending request təkrarı, notes, hint, rəqəmlərin tamamlanması, background timer və qələbə sınanır.
EYO: pointer capture/cancel, barmağın scroll-a çevrilməməsi, sürətli shuffle, fixed panel, crossword ölçüsü, SVG line clipping və Azərbaycan hərfləri yoxlanır.
Flappy/Space/Fruit/Cat/Block/2048: requestAnimationFrame delta clamp, foreground-da timer sıçrayışı, audio user gesture, reklamdan sonra resume/countdown, WebGL/Canvas varsa context loss yoxlanır. Mövcud Android backButton handler-i iOS-da yoxdur; görünən geri/bağla düymələri əsas idarəetmədir.
Bütün oyunlar: iPhone SE 375x667, 390x844, 393x852, 430x932 və geniş ekran; display zoom, böyük mətn, home indicator, notch, keyboard, offline/online. Pointer Events və touch-action müasir WKWebView-də mövcuddur, lakin kod uyğunluğu real sınaq əvəzi deyil. 60 FPS hədəfdir, ölçülmüş zəmanət deyil.

## 4. Auth, balans və mükafatlar
Eyni Supabase layihəsi və eyni user UUID/wallet istifadə edilir. Yeni hesab bazası və balans miqrasiyası tələb olunmur. Yeni iOS login mövcud hesabla server sessiyası yaradır; Android tokenini iOS-a kopyalamaq nəzərdə tutulmur.
Keychain generic-password: auth key whitelist, yalnız tətbiqə aid service, ThisDeviceOnly və after-first-unlock siyasətinin təhlükəsizlik review-u; tokenləri UserDefaults/log/artifact-a yazmamaq. İlk launch-da bridge auth-dan əvvəl hazır olmalıdır. Əvvəlki web-store sessiyasının varsa birdəfəlik təhlükəsiz miqrasiyası.
App state refresh mexanizmi ortaq qalır; Keychain reload, refresh rotation, explicit logout, revoked session, account switch və recovery link cold/warm launch test edilir. Parol sıfırlama hazırda web redirect istifadə edir; iOS callback recovery axınını ayrıca layihələndirmək lazımdır.
LumiCloud.applyWalletSnapshot, tiles_sync, Sudoku action RPC, server replay, gündəlik limit və idempotency saxlanır. Sikkə ilə LUMI ayrılığı dəyişmir. Client reklam playback callback-i balans vermir.
SSV Edge Function ad_unit/user_id/custom_data/transaction_id yoxlayır. lumi_admob_units allowlist-də məlum migration Android unit-lərini daxil edir. iOS rewarded unit ayrıca allowlist və callback konfiqurasiyası tələb edə bilər: bunu DB-də dəyişmədən tam production rewarded reklam mümkün sayılmır. Hazırkı mərhələdə yalnız plan; sonrakı additive konfiqurasiya ayrıca təsdiqlənəcək. SSV/RLS bypass etmək olmaz.

## 5. AdMob və Apple məxfiliyi
Google Mobile Ads iOS SDK və UMP Swift Package Manager ilə, kilidlənmiş versiyalarla əlavə edilir. Android App ID/ad units iOS üçün istifadə edilmir. iOS app/banner/interstitial/rewarded vahidləri, test cihazları və SSV callback lazımdır. Info.plist GADApplicationIdentifier və aktual SKAdNetworkItems tələb edir.
LumiAdsPlugin.swift Android müqaviləsini saxlamalıdır: initialize, showBanner, hideBanner, interstitial/rewarded metodları, diagnostics, privacyOptions və event payload-ları. Safe area daxilində anchored adaptive banner üçün sabit native slot; loading/no-fill/hide/refresh slot hündürlüyünü dəyişməməlidir. Interstitial yalnız təhlükəsiz keçiddə; SDK close və reward hadisələri düzgün ayrılır, Flappy countdown saxlanır.
ATT bütün reklamlar üçün avtomatik tələb deyil: tracking/IDFA istifadə olunarsa Apple şərtlərinə uyğun icazə və usage description lazımdır; icazədən imtina gameplay-i bağlamamalıdır. İstifadəçi auditoriyasında uşaqlar var: Android-in konservativ siyasəti minimum baza olaraq saxlanmalı, yaş/razılıq/Kids Category qərarı ayrıca verilməlidir. Kids Category üçün üçüncü tərəf reklam və məlumat ötürülməsi ciddi məhduddur; sadəcə non-personalized bayrağı App Store uyğunluğuna zəmanət deyil.
PrivacyInfo.xcprivacy: tətbiqin və SDK-ların həqiqi data collection/tracking/required reason API istifadəsi əsasında; səbəb kodu uydurulmur. App Store Connect App Privacy cavabları profil, email/telefon, şəkil, ID, skor, push tokeni və reklam SDK davranışına uyğun olmalıdır. Account deletion başlanğıcı app daxilində işlək olmalıdır; mövcud backend axını ayrıca yoxlanacaq. Google social login təqdim olunursa Apple guideline 4.8 üzrə uyğun alternativ login tələbini qiymətləndirmək, lazım gələrsə Sign in with Apple əlavə etmək lazımdır.
Mükafatlı həftəlik yarış üçün qaydalar, developer sponsorluğu və Apple-ın sponsor olmadığı açıqlaması tətbiqdə olmalıdır; store acceptance texniki build ilə zəmanət verilmir.

## 6. Dəyişəcək fayllər (hələ dəyişdirilməyib)
Yeni: mobile/ios/App/App/LumiBridgeViewController.swift; LumiAuthStoragePlugin.swift; LumiGameStoragePlugin.swift; LumiAdsPlugin.swift; PrivacyInfo.xcprivacy; ehtiyac olduqda App.entitlements və iOS push adapteri; mobile/scripts/build-ios-release.sh; mobile/ios/ExportOptions.plist; .github/workflows/ios-testflight.yml.
Redaktə: mobile/native-bridge.js (platform adapterləri); auth-storage.js (platform etiketi/migration); mobile/push-client.js və ya bölünmüş adapter; mobile/scripts/prepare-ios.mjs, configure-native.mjs, build-web.mjs; capacitor.config.json yalnız iOS-ə məxsus seçimlər; iOS Info.plist, SceneDelegate.swift, AppDelegate.swift, project.pbxproj; SPM Package.swift (CLI generated), package-lock.json yalnız ehtiyac olduqda; ios-simulator.yml.
CSS/JS yalnız sınaqda sübut olunan problem üçün: tiles.html/tiles-runtime.js, sudoku.css/sudoku-app.js, eyo.css/eyo-app.js və ümumi game-layout/game-settings modulları. Platforma sinfi ilə iOS düzəlişi, Android davranışı qorunur.
Android Java, AndroidManifest, Gradle/signing və production Supabase bu auditdə toxunulmur. Generated mobile/www və iOS public assets build zamanı yaranır; əl ilə fərqli oyun nüsxələri saxlanmır.

## 7. Windows → macOS cloud workflow layihəsi
1. Ayrı ios-compat branch, Android release tag sabit qalır. Ortaq kod və native iOS mənbələri repoda olmalıdır; hazırkı public statik Pages repo yalnız veb faylları ilə məhduddursa private native build repo istifadə edilir.
2. PR mərhələsi: npm ci; ortaq oyun/storage/auth testləri; build:web; cap sync ios (yalnız iOS); platforma-scope konfiqurasiya; xcodebuild resolvePackageDependencies və unsigned simulator build. lockfiles, Xcode versiyası və runner image audit olunur; latest-stable əvəzinə dəqiq təsdiqlənmiş Xcode pin seçilir.
3. Apple-a təqdimat üçün hazırkı minimum Xcode26/iOS26 SDK; deployment target ayrıca anlayışdır, Capacitor baza iOS15+ olsa da CSS/SDK seçimindən asılı son minimum simulator testləri ilə qərarlaşdırılır.
4. workflow_dispatch + protected ios-release environment ilə signed Release archive: generic/platform=iOS; exportArchive App Store Connect distributon; IPA + dSYM artifacts. Simulator ZIP telefona yüklənmir.
5. Secrets: Apple Distribution P12 + parol, uyğun provisioning profile, Team ID; App Store Connect API key p8/issuer/key ID. Müvəqqəti keychain-də import; always cleanup; secrets loglanmır və artifact-a düşmür. Upload addımı release approvalidən sonra Apple dəstəklədiyi uploader ilə.
6. Mövcud Android CI ayrıca qalır; iOS workflow Android build/signing əmrlərini çağırmır. Windows yalnız source/test/dispatch/download üçündür; Apple signing Windows-da edilmir.
Bu sənəd workflow spesifikasiyasıdır; workflow aktivləşdirilməyib və ödənişli cloud xidmət açılmayıb.

## 8. TestFlight və mərhələ qapıları
A: Bundle ID seçimi Apple Developer portalında mövcud qeydiyyata görə təsdiqlənir. az.playlumio.app artıq App Store Connect-də varsa onu saxlamaq olar; ümumi com.lumi.play ilə ziddiyyət platforma konfiqurasiyasında həll olunur. Mövcud identifikatoru sübutsuz dəyişmək olmaz.
B: Apple Developer üzvlüyü, Team, App Store Connect app record/SKU, düzgün bundle profile; iOS versiyası/build nömrəsi ayrıca, hər upload-da artırılır. Android code25 iOS signing əvəzi deyil.
C: iOS AdMob vahidləri, UMP/age siyasəti, privacy manifest/labels, APNs/Firebase konfiqurasiyası və hesab silmə yoxlanır. Firebase lazım olduqda eyni layihəyə ayrıca iOS app qeydiyyatı və GoogleService-Info.plist; Android google-services.json əvəz edilmir.
D: Simulator və sonra TestFlight fiziki iPhone sınağı: login/recovery/logout, 60 dəqiqə foreground/background, 20 Tiles level, uzun Sudoku, 3 reklam formatı, no-fill, gecikmiş SSV, offline retry, process kill/restore, balansın digər platformada eyni görünməsi. Production-da süni xal yaradılmır.
E: Internal TestFlight; external tester üçün lazım olan Beta App Review; screenshots, support/privacy URL, age rating, export compliance və review credentials. Düzgün entitlement/signing və store review tamamlanmadan hazır IPA və ya işlək iOS elan edilmir.

## 9. Mənbələr
- Capacitor iOS/WKWebView və Xcode: https://capacitorjs.com/docs/ios
- Privacy manifest: https://capacitorjs.com/docs/ios/privacy-manifest
- Google iOS SDK: https://developers.google.com/admob/ios/quick-start
- ATT/SKAdNetwork: https://developers.google.com/admob/ios/privacy/strategies
- Supabase deep links: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- Apple aktual upload tələbləri: https://developer.apple.com/news/upcoming-requirements/
- Apple review (1.3, 4.8, 5.1, 5.3): https://developer.apple.com/app-store/review/guidelines/
- GitHub macOS signing/secrets: https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications
