# Lumi 2.0.1 — reklam və Tiles düzəlişləri

12 noyabr 2026 · `com.lumi.play` · versionCode **18**.

- Banner üçün ayrılan hündürlük eyni olduqda WebView yenidən ölçülmür. Reklam yüklənmədikdə və avtomatik təkrar cəhddə ayrılmış yer saxlanılır. Platform balans yeniləməsi və görünürlük dəyişməsi banneri söndürüb-yandırmır. Tiles nəticə ekranına keçərkən də banner sahəsi bağlanmır.
- Bütün oyunların ortaq reklam qaydası: **ən azı 90 saniyə və 2 tamamlanmış təbii keçid**. Oyun sonu və level keçidi uyğun fürsətdir; sürətlə ardıcıl hər levelə reklam məcbur edilmir. Eyni uzun oyun daxilində level keçidləri ayrıca sayılır. Admin intervalı ilə native minimum uyğunlaşdırılıb.
- Reklam hazır deyilsə oyun saxlanılmır. Hazır interstitial başlamazdan əvvəl aktiv oyun pauzaya alınır. Flappy Bird reklamdan sonra **3 aktiv saniyə** hazırlıq göstərir, avtomatik eyni vəziyyətdən davam edir. Arxa planda sayğac işləmir.
- Tiles nəticəsinin serverdə yazılması ilə checkpoint saxlanması ayrılıb: checkpoint xətası təsdiqlənmiş xalı ekrandan gizlətmir, təkrar göndərmə növbəsi isə qorunur. Əlavə rewarded köməyinin replay-i düzəldilib. Əsas həftəlik balans ayrıca serverdən yenilənir. Xal miqdarı dəyişdirilməyib; təkrar ödənişə icazə verilmir.
- Serverdə son iki tamamlanmış Tiles səviyyəsinə 100+100 xalın ledger-ə yazıldığı yoxlandı. Heç bir hesaba əl ilə əlavə xal verilmədi.

## Testlər

- Reklam testləri: banner çağırışlarının təkrarlanmaması, background-da bannerin bağlanmaması, 90 saniyə və keçid limiti, no-fill/not-ready fallback, reklam öncəsi pauza və sonrası hazırlıq.
- Flappy testi: 3 saniyəlik geri sayım, background-da dayanma, sürətin qorunması və avtomatik davam.
- Tiles wallet testi: rewarded-help replay, checkpoint xətasına baxmayaraq server xalının göstərilməsi, növbənin saxlanması və retry-dən sonra təmizlənməsi.
- 200 Tiles səviyyəsinin server/həll testləri: **5711 yoxlama keçdi**. Həftəlik balans/migration **17**, admin balansları **19**, platform **29**, referral/revive **15** yoxlaması keçdi. CSP, EYO offline və parol bərpası testləri keçdi.

Migration: `20261112165403_ads_tiles_stability.sql` canlı Supabase layihəsinə tətbiq edilib. Email təsdiqi və mükafat məbləğləri dəyişdirilməyib.

## Yoxlama sərhədi

ADB-də qoşulu cihaz yoxdur; fiziki Android-də reklam göstərimi və ekran sabitliyi bu sessiyada ölçülməyib. Yeni testlər JavaScript axınını və server mexanikasını yoxlayır; native düzəliş Android release build ilə kompilyasiya edilir. Google no-fill/hesab məhdudiyyəti zamanı reklamın özü məcburi göstərilə bilməz. Uşaq auditoriyası üçün mövcud konservativ məxfilik ayarları saxlanılıb. Vebdə Android AdMob reklamı göstərilmir.

Google reklamları məzmunun təbii fasilələrində yerləşdirməyi və həddən artıq tez-tez göstərməməyi tələb edir: https://support.google.com/admob/answer/6201362

Veb: https://mubaristi-create.github.io/lumi-app/?v=101#home

AAB: `work/aab/Lumi-v2.0.1-play.aab`. Web paket: `work/releases/Lumi-v2.0.1-web.zip`.
Play Console-a bu sessiyada avtomatik yüklənmir; uyğun test kanalına yeni buraxılış kimi əlavə edilməlidir.
