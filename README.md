# LUMI giriş və qeydiyyat

## Telefonda açmaq və ana ekrana əlavə etmək

LUMI mobil brauzer üçün responsive PWA kimi hazırlanıb. GitHub-a `main` branch-ə push edildikdən sonra GitHub Actions saytı avtomatik GitHub Pages-də yayımlayır. Repository Settings → Pages bölməsində source ilk dəfə **GitHub Actions** seçilməlidir. Actions-da “Publish LUMI to GitHub Pages” işi uğurla bitdikdən sonra repository-nin Pages URL-ni telefonda aç:

- **Android:** Chrome menyusu → **Install app** və ya **Add to Home screen**.
- **iPhone:** Safari paylaş düyməsi → **Add to Home Screen**.

Sessiya, oyun xalları və rekordlar bu cihazın brauzerində saxlanır; hesablar cihazlar arasında sinxronlaşmır.

Bu ilkin mobil prototipdə qeydiyyat və girişdən sonra Xoş gəldin ekranı açılır; **Davam et** düyməsi əsas səhifəyə aparır. Əsas səhifədə promo banneri, Olivia hədiyyə kartı CTA-sı, profil/bildiriş panelləri və sürüşdürülən oyun karuseli var. Bonus düyməsi və Fruit Ninja kartı 20 saniyəlik xal mini-oyunları açır. Space Runner və Flappy Bird öz oyun səhifələrində açılır. Xallar cihazda saxlanır. Təqdim etdiyiniz logo və maskot vizualları, salamlaşma yazısı və işıltılar animasiya alır. Geri düyməsinin oxu dairənin mərkəzindədir. Azərbaycan hərflərini dəstəkləyən cihaz şriftləri istifadə olunur. Ekran kiçik telefonlarda sürüşdürülə bilər və cihazın hərəkət animasiyasını azaltma seçiminə hörmət edir.

## İstifadə

- **Giriş et** e-poçt və şifrə formunu açır.
- **Qeydiyyatdan keç** ad, soyad, istifadəçi adı, e-poçt, telefon və təkrar şifrə daxil edilən ayrıca səhifəni açır.
- Forma sahələri yoxlanır; qeydiyyatdan sonra uğur ekranı göstərilir.
- Uğurlu giriş və ya qeydiyyatdan sonra sessiya bu cihazın brauzerində saxlanılır. Sonrakı açılışda giriş ekranında yalnız **Davam et** düyməsi görünür; profil menyusundan çıxış sessiyanı silir.
- Hesab məlumatları yalnız bu cihazın brauzerində saxlanılır. Prototip şifrəni xülasə kimi saxlayır; real tətbiq üçün serverdə güclü parol xülasəsi, e-poçt/telefon təsdiqi və real istifadəçi bazası lazımdır.

İnterfeys Azərbaycan hərflərini dəstəkləyən cihaz şriftlərindən istifadə edir. Oyun karuseli ox düymələri olmadan toxunma və mouse ilə sürüşdürülür. Flappy Bird kartı tətbiqin üslubunda oyun səhifəsini açır; LUMI sessiyası tanınır, keçilən maneə sayı ekranda göstərilir və hər 2 maneədə 1 xal ümumi LUMI xalına əlavə edilir. Hər 12-ci maneənin arasındakı yanıb-sönən günəşə toxunmaq əlavə 3 xal verir. Oyun pauza, davam et və çıxış idarələrini dəstəkləyir. Hər 10 maneədə quş və fon görünüşü dəyişir, animasiyalı alov izi yaranır, sürət başlanğıcdan 10% aşağıdır və level başına 2% artır. Qanad, maneə, xal, bonus günəşi, level və alov üçün sintez olunmuş səs effektləri var; səs düyməsi ilə söndürülə bilər. Level dəyişəndə 2 saniyəlik reklam fasiləsi göstərilir. Toqquşmadan sonra da 2 saniyəlik demo reklam görünür.

Tətbiqi yerli serverdə açmaq tövsiyə olunur. Android və iOS-da HTTPS üzərindən açıldıqda ana ekrana əlavə etmək mümkündür. `file://` rejimi yalnız ilkin nümayiş üçündür; brauzerin yerli yaddaş qaydalarından asılı olaraq hesab sessiyası cihazda saxlanmaya bilər.

Space Runner “Kosmik Qüllə” yığma oyunudur. Kub qüllənin başında sağa-sola hərəkət edir; onu düymə və ya toxunuşla həmin hündürlükdə yerləşdir. Əvvəlki kubla üst-üstə düşən hissəsi qalır, tam boşluğa düşərsə raund bitir. Hər 5 kub üçün 1 oyun xalı verilir. Hər 10 kubdan sonra sürət 5% artır, level/fon/raket dekorasiyası dəyişir və 2 saniyəlik demo reklam fasiləsi göstərilir; bu mərhələdə hesaba 1 LUMI xalı da əlavə olunur. Raund bitəndə nəticədən əvvəl də 2 saniyəlik demo reklam göstərilir. Kamera qülləni yüksəldikcə izləyir, kublar tədricən kiçilir və birləşəndə rəngləri gradientə qarışır. Mərkəzə tam uyğun düşən kub qızılı parıltı, işıq zərrələri və xüsusi işıqlı nişan alır. Toxunma/klaviatura idarələri, pauza, səs seçimi, rekord və çıxış mövcuddur.

2048 mobil sürüşdürmə puzzle oyunudur. 4×4 lövhədə rəqəmlər barmaqla sürüşdürülən və ya klaviatura oxları ilə seçilən istiqamətə hərəkət edir; eyni dəyərli xanalar birləşib ikiqat olur. Hər gedişdən sonra boş xanaya əsasən 2, nadir hallarda 4 gəlir. 128 və yuxarı dəyərli hər birləşmə əlavə 5 xal verir; 64 dəyərli blok yarananda 2 saniyəlik demo reklam fasiləsi göstərilir. Yeni oyun 3 blokla başlayır. Xal, rekord və cari lövhə LocalStorage-da saxlanır. Lövhədə gediş qalmadıqda oyun dayanır. Oyun karuselindəki 2048 kartı ayrıca səhifəni açır.

Fruit Ninja üçün meyvələri barmaqla və ya mausla kəsmək, kombolar, bombalar, 3 can, xal/rekord, pauza və yenidən başlama funksiyaları var. Hər 10 kəsilən meyvəyə görə 1 LUMI xalı əlavə olunur; oyun xalı hər 1000-ə çatanda və raund bitəndə 2 saniyəlik demo reklam fasiləsi göstərilir. Meyvəni ötürmək və ya bombaya toxunmaq canı azaldır; rekord bu cihazda saxlanır. Ana səhifədəki Fruit Ninja kartı oyunu ayrıca açır.

SILLY CAT HTML Canvas üzərində işləyən 2D yolkeçmə oyunudur. Pişiyi yuxarı, aşağı, sağa və sola düymələrlə, WASD/ox klaviaturası ilə və ya səhnədə sürüşdürərək idarə et. Hər irəli addım xal, yolun o biri tərəfinə çatmaq bonus, balıq isə əlavə xal verir. Maşına dəydikdə raund bitir. Pauza, davam, yenidən başlama, rekord, ümumi balıq sayı, səs seçimi və pişik rənglərinin açılması cihazda saxlanır. Ana səhifənin oyun karuselində SILLY CAT kartına toxunaraq oyunu aç.

SILLY CAT level 1-də az maşın və aşağı sürətlə başlayır; hər təhlükəsiz keçiddə level artır, +3 xal verilir və sürət 20% yüksəlir. Level keçidlərində 2 saniyəlik demo reklam fasiləsi olur. Hər level-də yol, fon və maşın rəngləri növbə ilə dəyişir. Yolda çıxan günəş maşınları dağıdaraq 5 saniyəlik təhlükəsiz keçid verir. Maşın mühərriki, siqnal, pişik miyoldaması və toqquşma səsləri brauzerin Web Audio sintezatoru ilə yaradılır; səs düyməsindən söndürülür.

Block Blast 8×8 lövhəyə üç fiquru sürüşdürüb yerləşdirmə oyunudur. Dolu sətir və sütunlar təmizlənir. Hər hesab ilk dəfə level 1-dən başlayır; cari lövhə, level, rekord və reklam vaxtı giriş hesabına görə bu brauzerdə saxlanır. Uduzanda eyni level yenidən oynanılır. İlk level 2 asan xətt tələb edir; daha sonrakı level-lərdə xətt hədəfi, maneə sıxlığı və mürəkkəb fiqur ehtimalı artır. Mükafat 1–2-ci level-lərdə 1, 3–5-də 2, 6–8-də 3 LUMI xalıdır və bu qayda davam edir. Hər cüt leveldə yerləşdirilə bilən boş xanada 3 saniyəlik günəş bonusu çıxır; üzərinə fiqur yerləşdirmək əlavə 1 LUMI xalı verir. Günəş bonusu eyni leveldə təkrar yığılmır. Hər 90 saniyə aktiv oyundan sonra 2 saniyəlik demo reklam açılır; reklam, fasilə və arxa planda oyun taymerləri saxlanır. Rəngli səhnələr, level girişləri, qələbə musiqisi və konfetti, motivasiya mesajları, kombo, ipucu və geri alma var. Dəyişikliklər yalnız lokal nüsxədədir.



Bütün oyunların LUMI mükafatları lumi-wallet.js vasitəsilə lumi-points əsas balansına dərhal əlavə olunur. 2048-də 128+ birləşməsinin +5 mükafatı, Silly Cat-də levelin +3 mükafatı və qüllədə hər 5 kubun +1 mükafatı da balansa yazılır. Əsas səhifə, profil və hədiyyə paneli açılarkən balans yenilənir. Block Blast-də hesab üzrə bu oyunda qazanılmış LUMI xalı ayrıca saxlanır və əsas balansla birlikdə ekranda göstərilir.

Bütün altı oyunda sağ üst ayarlar menyusu game-settings.js vasitəsilə ortaqdır. Menyu açılarkən oyun fasiləyə düşür; davam, səs keçidi, yenidən başlama və əsas səhifəyə qayıtma buradan idarə edilir. 2048 qaydaları da menyuya köçürülüb. Səs seçimi hər oyun üzrə saxlanır. Reklam və keçid zamanı menyu oyunun axışını pozmur. Köhnə səs/fasilə düymələri ekrandan gizlədilib; oyun idarələri saxlanılıb.

Flappy Bird level keçidində panel əvəzinə atəşfəşanlıq və sintez edilmiş alqış səsi göstərilir. Təbrikdən sonra demo reklam gəlir; reklam bitəndə quş və maneələr toxunuş gözləyir. İlk toxunuş və ya yeni Space/ArrowUp basışı uçuşu təzə vaxt hesabı və qanad çalması ilə davam etdirir. Fasilədən qayıdışda da toxunuş tələb olunur. Toqquşma reklamından sonra nəticə ekranı sabit qalır və təkrar oyun yalnız istifadəçinin hərəkəti ilə başlayır.

Mobil düzülüş game-ui.css və game-layout.js ilə bütün oyunlarda ortaqdır. Dinamik brauzer hündürlüyü və safe-area nəzərə alınır; kvadrat lövhə qalan yerə uyğun ölçülənir. Kiçik portret ekranlarda göstəricilər və idarələr yığcamlaşır, üfüqi telefonlarda iki sütunlu görünüş açılır. Çox alçaq ekranlarda səhifə və dialoqlar sürüşdürülür. Ekran ölçüsü ciddi dəyişəndə hərəkətli oyunlar ayarlar menyusunda fasiləyə düşür; quş, kublar, meyvələr və maşınların koordinatları yeni səhnəyə uyğunlaşdırılır. Ölçü hesablamaları 320×568, 360×640, 375×667, 390×844, 430×932, 768×1024, 844×390 və 667×375 üçün yoxlanıb; real cihazda vizual yoxlama ayrıca tələb olunur.

Kosmik Qüllə örtüyü assets-game-tower.svg ilə əvəz olunub; hər uğurla yerləşən kub dərhal 1 LUMI xalı əsas balansa yazır. lumi-ads.js tətbiqə girişdən sonra bütün səhifələr arasında saxlanan ortaq 60 saniyəlik aktiv istifadə taymerini idarə edir. Demo reklam 2 saniyədir, periodik reklamdan sonra oyun istifadəçi Davam et seçənədək saxlanır. Bütün oyunların uduzma axınlarında reklam var; yeni əlavə edilən Block Blast, 2048 və Silly Cat uduzma reklamları ortaq moduldan istifadə edir. Mövcud oyun reklamları ortaq taymeri sıfırlayır, eyni nəticə üçün iki reklam göstərilmir. Reklam qaydaları və dəyişikliklər hazırda lokal nüsxədədir.
