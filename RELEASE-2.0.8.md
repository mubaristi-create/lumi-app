# Lumi 2.0.8 — Android sabitlik hesabatı

Versiya: **2.0.8**, Android **versionCode 25**. Mövcud hesablar, balanslar və açılmış səviyyələr sıfırlanmayıb. Bu buraxılış üçün verilənlər bazasında dəyişiklik və yeni migration tələb olunmadı.

## 1. Kök səbəblər və düzəlişlər

| Problem | Sübut edilən səbəb | Yeni davranış |
|---|---|---|
| Tiles yaddaş xəbərdarlığı | Oyun çərçivəsi əsas ekrana vəziyyəti ötürdükdən sonra özü də localStorage-ə yazırdı; çərçivədəki yazma xətası bütün saxlanmanı uğursuz göstərirdi. Köhnə körpü `null` mənbəli çərçivə mesajlarını qəbul etmirdi. | Çərçivədəki təkrar yazma çıxarıldı. Əsas ekran saxlanmanı təsdiqləyir. Yalnız həmin çərçivədən, doğru təsadüfi tokenlə gələn mesaj qəbul edilir; başqa mənbələr rədd olunur. Bərpa məlumatı çərçivəyə əsas ekrandan verilir. |
| Sudoku oyununun dayanması | `sudoku-cloud.js` sorğunu localStorage-ə yaza bilməyəndə server sorğusunu göndərmədən xəta atırdı. Alternativ davamlı yaddaş yox idi. | Android-də AtomicFile ilə tətbiqdaxili saxlanma; vebdə IndexedDB; əlavə localStorage ehtiyatı. Sorğu UUID-si saxlanır və bağlantı bərpa olunanda eyni UUID ilə təkrar yoxlanır. Auth tokenləri ayrıca Keystore/WebCrypto yaddaşında qalır. |
| Böyük Tiles səviyyələrində saxlanma və xal statusu | Tam lövhə tarixçəsi hər snapshot-a daxil edilirdi. Yerli Postgres sınağında 67-ci səviyyənin köhnə JSONB snapshot-u **197776 bayt** oldu və mövcud **100000 bayt** server həddi onu rədd etdi. Kompakt variant **9600 bayt** olub qəbul edildi. | Təkrar tarixçə əvəzinə yoxlanılan gedişlərdən `geri al` tarixçəsi bərpa edilir. Mətn JSON-u 109836 → 5026 bayt azaldı. Köhnə outbox tarixçələri də yüklənəndə kompakt formaya keçirilir; zədələnmiş köhnə qeyd yeni təsdiqi bloklamır və avtomatik silinmir. Server həddi və xal yoxlamaları zəiflədilmədi. Xal cavabı checkpoint sorğusunu gözləmir; gecikmə və təsdiqdən imtina ayrıca göstərilir. |
| Uyğunsuz daşlar | Birinci dünyada şəkil və fərqli SVG-lər qarışırdı; digər dünyalarda `.tile-symbol` sistem emojisi göstərirdi. Bəzi təsvirlər daş çərçivəsiz idi. | Bütün 10 dünya üçün 180 sabit SVG təsviri, eyni daş çərçivəsi və ölçü. Rəsm çərçivənin öz DOM-na daxil edilir; sistem şrifti və xarici SVG `use` yüklənməsi tələb olunmur. Tile ID, həll və cütləşdirmə qaydaları dəyişməyib. |
| Alt banner | Köhnə yerləşdirmə sistem naviqasiya inset-ini nəzərə almırdı. İlkin consent/SDK hazırlığı bağlantı səbəbindən alınmayanda yeni ilkinləşdirmə yolu yox idi. Konkret telefonda reklamın görünməməsinin tək səbəbini cihaz logu olmadan qəti müəyyən etmək olmaz. | Daimi native konteyner, navigation/cutout inset-i, anchored adaptive banner və ölçü sığmadıqda təhlükəsiz standart ölçü. Reklamın yüklənməsi/gizlənməsi WebView ölçüsünü dəyişmir. Bağlantı və ön plana qayıdışda uğursuz ilkin hazırlıq yenidən yoxlanır. Xəta kodu/domain/message və görünmə vəziyyəti diaqnostikaya daxil edilir. |

AdMob panelində production banner vahidi kodla uyğun gəldi. Panel tətbiq üçün **“İnceleme gerekli”** göstərdi; banner yayımı da qeydə alınmışdı. Buna görə bütün reklam çatışmazlığını kodla və ya yalnız no-fill ilə izah etmirik. Hesab baxışı və reklam mövcudluğu ayrıca amillərdir. Production ID-lər test ID-lərlə əvəz edilmədi; test build rejimi rəsmi Google test vahidlərini saxlayır.

## 2. Dəyişdirilmiş əsas fayllar

- `game-storage.js` — yalnız oyun məlumatları üçün davamlı yaddaş və ehtiyat yollar.
- `tiles-runtime.js`, `tiles-cloud.js`, `tiles-csp.json`, `tiles.html` — mesaj körpüsü, bərpa, kompakt snapshot, aydın təsdiq statusu, uyğun skript versiyaları.
- `tiles-worlds.js`, `tiles-icons.svg`, `tiles-icon-manifest.json`, `tiles-icon-paths.json`, `tiles-icon-license.html` — şriftdən asılı olmayan bütün dünya ikonları və lisenziya.
- `sudoku-cloud.js`, `sudoku-app.js`, `sudoku.html` — davamlı sorğu növbəsi, təhlükəsiz retry, fərqli xəta mətnləri və bloklanmış yaddaşda ayarların işləməsi.
- `mobile/native-bridge.js`, `mobile/android/app/src/main/java/az/playlumio/app/LumiGameStoragePlugin.java` — Android-in tətbiqdaxili fayl yaddaşı və yeni plugin qeydiyyatı.
- `mobile/android/app/src/main/java/az/playlumio/app/MainActivity.java`, `LumiAdsPlugin.java` — DOM storage, sabit banner konteyneri, inset və SDK diaqnostikası.
- `mobile/android/app/build.gradle`, `sw.js` — versionCode 25 / v108.
- `scripts/build-tiles-symbols.cjs`, `scripts/validate-tiles-assets.cjs`, `scripts/test-stability-208.cjs`, `scripts/test-tiles-storage.cjs`, `scripts/test-auth-lifecycle-208.cjs`, `scripts/test-server-stability-208.cjs` — təkrar icra edilən yoxlamalar. Mövcud Sudoku və banner regression sınaqları uyğunlaşdırılıb.

## 3. Test nəticələri

| Ssenari | Nəticə / sərhəd |
|---|---|
| Tiles 20 ardıcıl səviyyə | Yerli Postgres-də keçdi: atomik balans, eyni sorğuya ikinci dəfə 0 xal, compact checkpoint və bərpa. 104 yoxlama. |
| 67-ci səviyyədə böyük snapshot | Köhnə snapshot server həddində rədd edildi; kompakt snapshot qəbul edildi. |
| Bütün Tiles asset-ləri | 400 səviyyə / 180 SVG; uyğunluq, unikal ID, fallback və lövhə bərpası yoxlanır. |
| Bloklanmış localStorage və ayrıca mənbəli iframe | 360×640 brauzer sınağı: oyun işləyir, yanlış xəbərdarlıq yoxdur. Səhifə bağlanıb açıldıqda 20 oyun xalı və 13 qalan cüt IndexedDB-dən bərpa olundu. |
| Kiçik mobil ekran | 320×550: document ölçüsü 320×550, 26 qalan daşın rəsmi var; əlavə document scroll-u yaranmadı. |
| Sudoku / şəbəkə / təkrar sorğu | UI, səhv giriş, fasilə/davam, ipucu, qələbə, itmiş cavab və eyni UUID ilə retry regression sınaqları keçdi. |
| Sessiya və token refresh | DOM storage bağlı olan native-storage mock-da səhifə yenilənməsi, 61 dəqiqəlik **virtual saat** üzrə token dəyişməsi, background/active refresh və hesab/balansın qalması yoxlandı. |
| Reklam və balans regression-ları | Banner bütün 10 oyun yolunda tələb edilir; no-fill/gizlənmə layout-u dəyişmir; gecikmiş SSV, wallet retry, checkpoint-dən əvvəl təsdiq və puzzle reklam fasiləsi sınaqları keçdi. |
| Real cihazda 60 dəqiqə | **İcra edilməyib.** Fiziki Android cihazı bağlı deyildi. Virtual saat testi real cihazda 60 dəqiqəlik fasiləsiz oyun kimi təqdim edilmir. |
| Müxtəlif real WebView versiyaları / real AdMob açılıb-bağlanması | **İcra edilməyib.** Native kod yığımı və məntiq sınaqları real cihaz/reklam fill yoxlamasını əvəz etmir. |

Yerli yaddaş/RPC vaxtları production internet gecikməsi üçün 1 saniyə zəmanəti deyil. Server cavabı gələn kimi təsdiqlənmiş balans göstərilir; server təsdiqi olmayan xal qəti balans kimi yazılmır.

## 4. Təhlükəsizlik və qalan yoxlama

RLS, server-side replay yoxlaması, gündəlik limit və idempotency qorunub. Native oyun yaddaşı auth açarlarını qəbul etmir. Oyun bərpası private tətbiq fayllarında saxlanır; mövcud auth Keystore açarı dəyişdirilmir. İstifadəçi cədvəli silinməyib, balans sıfırlanmayıb və production-da sınaq xalı yaradılmayıb.

Qapalı testdə yeni versionCode **25** yükləndikdən sonra fiziki telefonda ən azı 60 dəqiqə oyun, reklam dönüşü, offline/online, tətbiqi tam bağlayıb açma və müxtəlif naviqasiya rejimləri ayrıca təsdiqlənməlidir. AdMob baxış/no-fill vəziyyəti native diaqnostika ilə birlikdə qiymətləndirilməlidir.

Texniki istinadlar: [Google anchored adaptive banner](https://developers.google.com/admob/android/banner), [Pictogrammers Material Design Icons](https://github.com/Templarian/MaterialDesign).
