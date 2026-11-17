# Lumi iOS 2.0.8 — hazırlıq və build

Bu paket Android release-i və canlı Supabase məlumatlarını dəyişdirmir. İş `ios-compat-208` branch-dədir. iPhone üçün minimum iOS 16.0; Xcode 26.0 və Node 22 istifadə edilir. Bundle ID ilkin olaraq mövcud `az.playlumio.app` saxlanılıb, Apple qeydiyyatında mövcudluğu hələ yoxlanmayıb. Ümumi Android identifikatoru `com.lumi.play` dəyişmir.

## Hazırlanan kod
- Eyni HTML/CSS/JS oyunları və Supabase backend; React Native rewrite yoxdur.
- Keychain auth plugin: device-only, after-first-unlock; auth key whitelist, update/add/remove; token loglanmır.
- Application Support game store: scoped key, SHA256 filename, atomik yazma, backup-dan xaric; auth key qəbul edilmir.
- Native Swift reklam körpüsü: Google Mobile Ads 12.14.0 + UMP 3.1.0 (exact pins), rəsmi iOS test vahidləri. Production Android ID-ləri iOS-da istifadə edilmir.
- 90pt sabit banner konteyneri safe area daxilində; reklam statusu viewport-u dəyişmir.
- PKCE callback `com.lumi.play://auth/callback` URL Types qeydiyyatı; SceneDelegate cold/warm URL relay saxlanır.
- Local notification paketi sync edilir. Uzaqdan push Apple hesabı/APNs qeydiyyatı olmadığı üçün bu paketdə aktiv deyil. Android FCM tokeni iOS tokeni kimi göndərilmir.
- Yalnız iOS prepare/sync; Android manifest yazılması ayrılıb.
- App privacy manifest required-reason UserDefaults deklarasiyası. Bu fayl App Store Connect App Privacy cavablarını və SDK-ların manifestlərini əvəz etmir.

## Windows-dan
mobile qovluğunda Node 22+ və paket meneceri ilə `npm ci`, sonra `npm run ios:prepare`.
Bu əmr web assets və iOS layihəsini hazırlayır, IPA yaratmır. Generated `www`/`ios/App/App/public` əl ilə redaktə edilmir. Ortaq kod əsas mənbədir.

## macOS cloud — Apple hesabı tələb olunmur
`.github/workflows/ios-simulator.yml`: npm ci → iOS prepare → exact Xcode 26.0 → simulator build → boot/install/launch → screenshot + simulator ZIP artifact.
`ios-compat-208` branch-ə push zamanı avtomatik işləyir. Workflow-dan da əl ilə başlatmaq olar. Simulator `.app` ZIP iPhone-a quraşdırılmır.

## Apple Developer hesabını nə vaxt almaq lazımdır?
İmzasız simulator build və kod yoxlamaları üçün lazım deyil. İmzalanmış iPhone/TestFlight build-i hazırlayacağımız vaxt üzvlük lazımdır. İndi ödəniş etməyə ehtiyac yoxdur.
Həmin mərhələdə: Team ID; bundle qeydiyyatı; App Store Connect tətbiqi; Apple Distribution sertifikatı və App Store provisioning profile; TestFlight üçün App Store Connect API açarı hazırlanır. Şifrə və açarlar çata və ya repoya göndərilmir.
GitHub `ios-release` environment-də review/approval qoruması qurulur. Environment variables: IOS_TEAM_ID, IOS_BUNDLE_ID. Secrets: IOS_DISTRIBUTION_P12_BASE64, IOS_DISTRIBUTION_P12_PASSWORD, IOS_PROFILE_BASE64; upload üçün ASC_KEY_ID, ASC_ISSUER_ID, ASC_P8_BASE64.
`.github/workflows/ios-testflight.yml` unikal build_number ilə dispatch olunur; əvvəlcə upload=false. Sertifikat runner-in müvəqqəti keychain-indədir və always cleanup edilir. `upload=true` TestFlight-a göndərir. Hazırkı workflow test reklamları saxlayır.

## Production-a keçməzdən əvvəl
- iOS AdMob app/banner/interstitial/rewarded ID-ləri və UMP mesajları. Tam aktual SKAdNetwork siyahısı rəsmi SDK sənədindən əlavə olunmalıdır; hazırda Google test inteqrasiyası üçün əsas identifikator var.
- iOS rewarded vahidi backend allowlist-də ayrıca qeydiyyatdan keçməlidir. Mövcud Supabase cədvəllərinə dəyişiklik edilməyib; bu səbəbdən iOS rewarded düyməsinin end-to-end mükafatı hələ hazır sayılmır. Google SDK callback-i balans/sikkə vermir; SSV yoxlaması qorunur.
- App Privacy etiketləri, real data collection, uşaqlar daxil olan auditoriya və Kids Category qərarı, məxfilik siyasəti, hesab silmə axını; Google login varsa guideline 4.8 qiymətləndirilməsi və lazım olduqda Sign in with Apple.
- APNs/FCM iOS tətbiqi, entitlements və server routing ayrıca konfiqurasiya ediləcək. Local reminders uzaqdan push kimi təqdim edilmir.
- Real iPhone-da login/recovery/logout, token refresh, bütün oyunlar, safe area/home indicator, audio/touch, reklam dönüşü, offline retry/process kill, 60 dəqiqə sınağı.
- Production build script iOS unit-lər, IOS_PRIVACY_REVIEWED=true və IOS_SSV_CONFIGURED=true olmadan production reklam rejimini qəbul etmir. Bu flag-lar faktiki yoxlamanı əvəz etmir.

Build planı Apple təsdiqi və ya cihaz testi zəmanəti deyil. Android və Supabase üçün destructive əməliyyat nəzərdə tutulmur.
Apple girişi üçün native AuthenticationServices + SHA256 nonce adapteri də hazırlanıb. Apple hesabı və Supabase Apple provider aktivləşdirilməyənədək düymə göstərilmir. Hesab açıldıqdan sonra Sign in with Apple capability + profile, Supabase Apple provider konfiqurasiyası, sonra ios-release variable IOS_APPLE_SIGN_IN=true seçilir. App.entitlements yalnız bu signed build rejimində qoşulur; Android dəyişmir.

## Simulator yoxlaması haqqında
Cloud yoxlamaları Xcode 26.0 seriyası (runner-də 26.0.1) ilə aparılır. Simulator paketi Apple sertifikatı olmadan yığılır, Keychain-i həqiqətən sınamaq üçün Xcode-un standart lokal simulator signing axını ilə imzalanır. Bu imza iPhone/TestFlight üçün keçərli deyil və Apple hesabı tələb etmir.
`--lumi-smoke` / `--lumi-smoke-resume` yalnız DEBUG test köməkçisini başladır. Test ayrı sınaq açarlarında Keychain/private file yazıb oxuyur, tətbiq prosesi yenidən açıldıqda bərpanı yoxlayır və sonda həmin açarları silir. Real hesab və ya Lumi xalı yaradılmır. Release build-də bu test kodu daxil edilmir.
Xcode 26 + iOS 18.5 simulatorunda yeni WebKit async overlay kitabxanasının olmaması diaqnostika ilə aşkarlandı; test köməkçisində uyğun callback API-lərinə keçildi. Minimum deployment target iOS 16.0 olaraq qalır.

Native smoke yoxlaması keçdi: Xcode 26.0.1 + iOS 18.5 simulator, Keychain/private store bərpası və təmizləmə; Tiles menyusu/Sudoku auth qoruması 402×688 viewport-da üfüqi daşmasız. Hesaba daxil edilmiş gameplay və fiziki iPhone testləri hələ ayrıca qalır. Sübut: https://github.com/mubaristi-create/lumi-app/actions/runs/44012714230
