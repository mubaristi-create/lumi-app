# Lumi iOS — icra nəticəsi

## Hazırlanan hissə
- Mövcud HTML/CSS/JavaScript + Capacitor 8.5.3 kod bazası saxlanılıb; React Native rewrite edilməyib.
- iOS 16+ üçün Swift Keychain auth store, private atomik game store, safe-area daxilində daimi 90pt reklam yeri və iOS AdMob/UMP adapteri hazırlanıb.
- iOS SDK-ları pinned: Google Mobile Ads 12.14.0, UMP 3.1.0. Yalnız rəsmi iOS test vahidləri ilkin rejimdədir. Android unit-ləri əvəz edilməyib.
- Apple girişinin native nonce/token axını var; Apple capability və Supabase Apple provider qurulanadək gizlidir.
- OAuth URL scheme, App/Scene lifecycle, yalnız iOS sync və ayrıca simulator/TestFlight workflow-ları hazırdır.
- Native reklam keşi və banner sorğusu foreground/online dönüşündə bərpa edilir; reklam yeri yüklənmə/no-fill ilə ölçü dəyişmir.

## Ayrılıq və məlumat qorunması
İş `ios-compat-208` branch-də və draft PR #1-dədir. Main/live veb yayıma merge edilməyib. İzlənən 57 Android faylı iOS prepare əməliyyatından əvvəl/sonra bayt səviyyəsində eyni qalıb. Canlı Supabase schema, Auth ayarları, hesablar və balanslar dəyişdirilməyib. Native smoke testi yalnız ayrıca lokal test açarları istifadə edir, real hesab və xal yaratmır.

## Yoxlamalar
- Windows-da iOS web build və Capacitor sync: keçdi.
- iOS project/Info.plist/plugin müqaviləsi, Android+iOS bridge qeydiyyatı: keçdi.
- Ortaq auth lifecycle/token refresh virtual fixture, Tiles storage/wallet, Sudoku UI/recovery, reklam regression yoxlamaları: keçdi.
- Xcode 26.0.1 ilə universal simulator compilation: keçdi.
- Native Keychain/private file process restart və WKWebView Tiles/Sudoku ekran renderi: keçdi. Real Keychain/private-file açarları proses restartından sonra oxundu və təmizləndi. Viewport 402×688: hər iki səhifədə scrollWidth=402. Tiles menyusu və Sudoku-nun hesab giriş qoruması yoxlanıldı; login edilmiş Sudoku gameplay testi kimi təqdim edilmir.
- Real iPhone, iOS 16 cihazı, bütün oyunlarda tam gameplay/60 dəqiqə, production reklam fill/SSV: icra edilməyib.

## Diaqnostikada düzəldilən problemlər
Debug smoke köməkçisində yeni Swift WebKit overlay kitabxanasının köhnə iOS simulatorunda olmaması müəyyən edildi. Uyğun completion API-ləri və Xcode runtime embedding istifadə edilir. Ayrı manual simulator imzası əvəzinə Xcode standart lokal simulator signing seçildi. Apple sertifikatı və Developer üzvlüyü bu simulator mərhələsi üçün tələb olunmur.

## Apple hesabı nə vaxt lazımdır?
İmzalanmış iPhone/TestFlight build-i mərhələsində. Simulator mərhələsi üçün almaq lazım deyil. Sonra bundle ID availability/registration (ilkin `az.playlumio.app`), Team, App Store Connect app record, distribution signing/profile və API key qurulur. Açarlar çata və repoya göndərilmir; GitHub `ios-release` protected environment istifadə edilir. PR-in main-ə keçirilməsi və manual TestFlight workflow-nun aktivləşdirilməsi həmin mərhələdə aparılır.

## Store buraxılışından əvvəl qalan işlər
- iOS AdMob app/ad unit-ləri, UMP və aktual SKAdNetwork konfiqurasiyası; server SSV allowlist-də iOS unit-lərinin ayrıca tanınması. Server təsdiqi olmadan coin/LUMI verilmir.
- Apple Sign In capability/provider aktivləşdirməsi; APNs/FCM iOS konfiqurasiyası. Hazırda remote iOS push aktiv deyil; local reminders ayrıdır.
- App Privacy/uşaq auditoriyası qərarı, məxfilik və hesab silmə axını, yarış qaydaları, export compliance və review metadata yoxlaması.
- Fiziki iPhone-da sessiya, offline/online, real reklam dönüşü, performans və bütün oyunların tam funksional sınağı.

Mənbələr: https://github.com/mubaristi-create/lumi-app/tree/ios-compat-208
Draft PR: https://github.com/mubaristi-create/lumi-app/pull/1
Cloud run: https://github.com/mubaristi-create/lumi-app/actions/runs/44012714230

Təsdiqlənmiş simulator artifact: https://github.com/mubaristi-create/lumi-app/actions/runs/44012714230/artifacts/14297859480
Artifact SHA256: e52b9e2594f0d3d43d722757fc4f30f4dfb865f3e106ec7efec81e60714ffddb
Native code revision: 3586a2cea80a718ce6ba054172470499cc814bd6. Yekun workflow həmin təsdiqlənmiş run ilə uyğunlaşdırılıb.
