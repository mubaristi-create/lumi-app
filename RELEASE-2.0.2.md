# Lumi 2.0.2 — telefon bildirişləri

Android versionCode 19. Eyni Google Play upload sertifikatı istifadə edilir.

- Android üçün Firebase Cloud Messaging və telefon icazəsi əlavə edildi.
- Hər istifadəçiyə saatda bir dəfə, saat daxilində təsadüfi dəqiqədə 6 mətndən biri seçilir.
- Liderlikdə real keçilmə hadisəsi dərhal göndərmə növbəsini oyadır. Gündəlik maskotun yenilənməsi 30 saniyəlik server yoxlamasında müəyyən edilir.
- Telefon və hesab bildirişi eyni mətnə və eyni hadisə identifikatoruna bağlıdır.
- Telefon, saatlıq, maskot və sıralama bildirişləri ayrıca söndürülə bilir.
- Cihaz tokenləri özəl server cədvəlindədir. Göndərici açarı Supabase Vault-da şifrəlidir; AAB, veb ZIP və GitHub-a daxil edilmir.
- Müvəqqəti göndərmə xətaları gecikmə ilə təkrarlanır; etibarsız token deaktiv edilir; köhnəlmiş növbə yeni cihazı mesaj selinə tutmur.
- Məxfilik səhifəsinə Azərbaycan və İngilis dillərində FCM məlumat emalı əlavə edildi.

Yoxlama: bildiriş SQL testləri (13), native müştəri testləri, reklam sabitliyi, Tiles balans bərpası və Flappy reklamsonrası 3 saniyə testləri. Canlı worker HTTP 200 qaytarır. Google OAuth 200; real telefona göndərmədən FCM validate_only sınağında qeyri-real token gözlənilən INVALID_ARGUMENT cavabını verir.

Məhdudiyyət: fiziki telefon qoşulu deyil; faktiki telefon çatdırılması hələ təsdiqlənməyib. Yeni Android versiyası quraşdırılmalı, hesabla daxil olunmalı və bildiriş icazəsi verilməlidir. Köhnə paketlərdə uzaqdan push avtomatik yaranmır. Webdə hesab bildirişləri işləyir; brauzer Web Push və iOS/APNs bu buraxılışda qoşulmayıb. OS, şəbəkə və istifadəçi ayarları çatdırılma vaxtına təsir edir.

Əməliyyat qeydi: FCM açıq sertifikatı 12 noyabr 2027-də bitir; həmin tarixdən əvvəl rotasiya edilməlidir. Supabase advisor-da özəl cədvəllər üçün deny-by-default RLS və icazəli RPC security-definer xəbərdarlıqları var. Bu buraxılış tam təhlükəsizlik auditi deyil; əvvəlki Auth leaked-password-protection xəbərdarlığı dəyişdirilməyib.
