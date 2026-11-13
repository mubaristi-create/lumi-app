# Lumi 2.0.3 — sabit banner və həftəlik ilk 3-lük

Android versionCode 20. Mövcud upload sertifikatı saxlanılıb.

Android WebView üçün ilk layout-dan əvvəl sabit 90dp alt yer ayrılır. Reklamın gec yüklənməsi, no-fill, təkrar cəhd, gizlətmə və səhifə keçidi bu yeri dəyişmir. Banner bütün 9 oyun səhifəsində istənilir. Uğursuz banner yüklənəndə AdView dağıdılmır, gecikməli təkrar sorğu verilir. Razılıq və uşaq məxfiliyi ayarları saxlanılıb. Google reklam vermədikdə slot boş qala bilər; bütün cihazlarda real reklam doluluğuna təminat verilmir.

Tiles: cavab serverdə xal yazıldıqdan sonra itərsə, təkrar sorğudakı balans da əsas hesaba gətirilir. Saxlanmış göndərilməmiş nəticələr fokus, internetin bərpası və 15 saniyəlik təkrar yoxlama ilə göndərilir. Köhnə run-un cavabı yeni run-un qələbə göstəricisini dəyişmir. Daha əvvəl alınmış mükafat və gündəlik limit ayrıca izah edilir; təkrar xal yaradılmır.

Həftəlik kampaniya: xal həddi yoxdur. Bakı vaxtı bazar ertəsi 00:00 sərhədində bitən yarışın serverdə təsdiqlənmiş ən yüksək 3 nəticəsi seçilir. Bərabər nəticədə əvvəl çatan öndədir. Bloklanmış, silinmə gözləyən və sıralamasını gizlədən hesablar seçilmir. Müsbət xallı iştirakçı sayı 3-dən azdırsa yalnız mövcud uyğun iştirakçılar qalib olur. Cron ən gec növbəti dəqiqədə finalizasiya edir; eyni istifadəçi üçün bildiriş bir dəfə yaradılır və FCM növbəsinə yazılır. Əvvəlki qaliblik tarixçəsi saxlanılıb. Avtomatik pul ödənişi edilmir.

Admin: hədəf və ilk-5 parametrləri çıxarılıb; həftəlik yarışı aktivləşdirmək/dayandırmaq və mükafat məbləğini dəyişmək qalır. Yarışı aktivləşdirmək həmin təqvim həftəsinin mövcud nəticələrini saxlayır. Aktiv qaldıqca həftələr avtomatik davam edir. Əsas banner və həftə göstəricisi ilk 3-lük və yarış vaxtı ilə yenilənib.

Yoxlama: 22 həftəlik yarış/admin yoxlaması; 5711 Tiles solver/server yoxlaması; 17 balans/miqrasiya və 13 bildiriş yoxlaması; Tiles itmiş-cavab/fokus/stale-run, banner-initialization və Flappy reklamsonrası sayğac testləri. İmzalı AAB yığımı keçib. Fiziki cihaz bağlı olmadığından real cihazda AdMob görüntüsü və doluluğu bu buraxılışda təsdiqlənməyib.
