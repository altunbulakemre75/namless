/**
 * LGS Tüm Dersler — Konu İçerikleri Seed Script
 * Çalıştır: node prisma/seed-content.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const KONULAR = [
  // ==================== TÜRKÇE ====================
  {
    id: "792ade8f-f86b-4a3e-872a-a37ee932f5c3",
    dersIcerigi: `Türkçe dersi; okuma, yazma, dinleme ve konuşma becerilerini geliştirmeyi hedefler. LGS'de Türkçe soruları paragraf anlama, sözcük bilgisi, dil bilgisi ve yazım kuralları konularını kapsar. Başarılı olmak için günlük okuma alışkanlığı kazanmak, farklı metin türlerini tanımak ve dil kurallarını içselleştirmek gereklidir.`,
    kazanimlar: ["Metinleri anlayarak okur", "Sözcük ve sözcük gruplarını doğru kullanır", "Yazım ve noktalama kurallarını uygular", "Paragraf yapısını kavrar"],
  },
  {
    id: "977167a4-9bc1-4bd8-8315-67aa8d49b6d8",
    dersIcerigi: `Cümle, en az bir yüklem içeren, anlam bütünlüğü olan dil birimidir. Cümleler yapılarına göre basit, birleşik ve sıralı; yüklemin türüne göre isim ve fiil cümlesi; anlamlarına göre olumlu, olumsuz, soru ve ünlem cümlesi olarak sınıflandırılır.

**Cümle Öğeleri:**
- **Yüklem:** Cümlenin temel öğesidir, eylem veya durum bildirir. Cümlenin sonunda yer alır.
- **Özne:** Yüklemi gerçekleştiren kişi veya varlıktır. "Kim? Ne?" sorularıyla bulunur.
- **Nesne:** Eylemin üzerine yöneldiği varlıktır. Belirtili nesne "-i" hâlinde, belirtisiz nesne yalın hâlde bulunur.
- **Dolaylı Tümleç:** Eylemin yöneldiği yeri veya kişiyi gösterir. "-e, -de, -den" hâl ekleriyle bulunur.
- **Zarf Tümleci:** Eylemin nasıl, ne zaman, nerede yapıldığını bildirir.

**LGS'de Dikkat Edilecekler:**
- Cümle öğelerini doğru tespit etme
- Devrik ve eksiltili cümleleri tanıma
- Öğelerin sırasına göre anlam değişikliklerini fark etme
- Cümle çeşitlerini bağlamdan anlama`,
    kazanimlar: [
      "Cümle öğelerini tespit eder",
      "Cümle çeşitlerini sınıflandırır",
      "Devrik ve eksiltili cümleleri tanır",
      "Yüklem türlerine göre cümleleri ayırt eder",
      "Cümlelerde anlam ilişkilerini kurar",
    ],
  },
  {
    id: "50ec0f87-b900-474a-bd00-fd0825389fa8",
    dersIcerigi: `Metin türleri; anlatım amacına, yapısına ve kullanım alanına göre farklılık gösterir. LGS'de öğrencilerden farklı metin türlerini tanımaları ve özelliklerini bilmeleri beklenir.

**Anlatım Türleri:**
- **Hikâye (Öykü):** Gerçek ya da gerçekmiş gibi anlatılan olaylar zinciridir. Olay, kişi, zaman ve mekân öğeleri bulunur.
- **Roman:** Uzun soluklu anlatı türüdür. Kişiler, olaylar ve mekânlar ayrıntılı işlenir.
- **Masal:** Olağanüstü olaylar ve kişiler içeren anonim anlatılardır. "Bir varmış bir yokmuş" ile başlar.
- **Fabl:** Hayvanları kişileştirerek ders veren kısa hikâyelerdir.
- **Efsane:** Bir olayı ya da varlığı açıklamaya çalışan olağanüstü anlatılardır.

**Bilgilendirici Metinler:**
- **Makale:** Bir konuyu kanıtlayarak anlatan bilimsel metindir.
- **Deneme:** Yazarın kişisel görüşlerini samimi bir dille aktardığı metindir.
- **Fıkra:** Güncel olayları ele alan kısa gazete yazısıdır.
- **Röportaj:** Soru-cevap biçiminde gerçekleştirilen söyleşidir.

**Şiir Türleri:** Lirik, epik, didaktik, pastoral şiir türleri.`,
    kazanimlar: [
      "Farklı metin türlerini tanır ve ayırt eder",
      "Her metin türünün yapısal özelliklerini bilir",
      "Metin türüne uygun okuma stratejileri uygular",
      "Metinlerde amaç ve hedef kitleyi belirler",
    ],
  },
  {
    id: "f6b9e554-d9e1-4ba8-b50c-26dd198486bf",
    dersIcerigi: `Noktalama işaretleri, yazılı iletişimde anlam belirsizliğini ortadan kaldırmak ve cümlelerin doğru anlaşılmasını sağlamak için kullanılır.

**Temel Noktalama İşaretleri:**

**Nokta (.):** Tam cümlelerin sonuna, kısaltmaların sonuna, sıra sayılarından sonra konur.
*Örnek:* Dr. Ahmet saat 09.30'da geldi.

**Virgül (,):** Sıralama yaparken, açıklama eklerken, uzun cümlelerde anlam gruplarını ayırırken kullanılır.
*Örnek:* Kalem, defter ve kitabı aldı.

**Noktalı Virgül (;):** Virgülden güçlü, noktadan zayıf bir duraklamadır. Bağımsız cümleleri ayırır.

**İki Nokta (:):** Açıklama, örnek veya alıntı öncesinde kullanılır.

**Üç Nokta (...):** Sözün yarıda kesildiğini, anlatımın sürdüğünü gösterir.

**Soru İşareti (?):** Soru cümlelerinin sonuna konur.

**Ünlem İşareti (!):** Sevinç, korku, emir, seslenme ifade eden cümlelerin sonuna konur.

**Tırnak İşareti (" "):** Başkasından alınan sözleri belirtmek için kullanılır.

**Kısa Çizgi (-):** Sözcükleri hecelere ayırmada, diyaloglarda kullanılır.`,
    kazanimlar: [
      "Noktalama işaretlerini yerinde ve doğru kullanır",
      "Noktalama işareti eksikliğinden kaynaklanan anlam farklılıklarını fark eder",
      "Metindeki noktalama hatalarını düzeltir",
      "Kısaltmalarda nokta kullanımını bilir",
    ],
  },
  {
    id: "7c7a0dde-c4b4-4ac0-a0a5-13209f8507f0",
    dersIcerigi: `Paragraf; birbirine bağlı cümlelerden oluşan, tek bir düşünceyi işleyen anlam birimidir. LGS'nin en önemli konularından biridir.

**Paragraf Yapısı:**
- **Konu:** Paragrafın genel olarak neyi anlattığıdır.
- **Ana Düşünce (Ana Fikir):** Yazarın okuyucuya vermek istediği temel mesajdır. Genellikle giriş ya da sonuç cümlesinde yer alır.
- **Yardımcı Düşünceler:** Ana düşünceyi destekleyen, açıklayan, örnekleyen cümlelerdir.

**Paragraf Türleri:**
- **Giriş Paragrafı:** Konuyu tanıtır, okuyucunun ilgisini çeker.
- **Gelişme Paragrafı:** Konuyu ayrıntılarıyla açıklar, örnekler verir.
- **Sonuç Paragrafı:** Düşünceleri özetler, yargıya varır.

**Paragraf Soruları için Stratejiler:**
1. Önce tüm paragrafı oku, genel anlamı kavra
2. "Bu paragrafın konusu nedir?" diye sor
3. Her cümlenin diğerleriyle bağlantısını kur
4. "Yazar ne demek istiyor?" sorusunu sor
5. Seçenekleri paragrafa göre eleyerek doğruyu bul

**LGS'de Sık Sorulan Paragraf Soruları:**
- Ana düşünce bulma
- Başlık seçme
- Boş bırakılan yere uygun cümle getirme
- Anlam ilişkilerini tespit etme`,
    kazanimlar: [
      "Paragrafın konusunu ve ana düşüncesini belirler",
      "Yardımcı düşünceleri ana düşünceden ayırt eder",
      "Paragraf türlerini tanır",
      "Paragraflar arasındaki anlam bağlantısını kurar",
      "Boşluğa uygun cümle seçer",
    ],
  },
  {
    id: "f9cb9e18-e22d-4e55-96de-76028708da5a",
    dersIcerigi: `Söz varlığı; bir dilde mevcut olan tüm sözcükleri, deyimleri, atasözlerini ve kalıp ifadeleri kapsar.

**Atasözleri:** Uzun gözlem ve deneyimler sonucu ortaya çıkan, toplumun ortak görüşünü yansıtan, kalıplaşmış kısa sözlerdir.
*Örnek:* "Damlaya damlaya göl olur." → Birikimlerin büyük sonuçlar doğurduğunu anlatır.

**Deyimler:** En az bir sözcüğün gerçek anlamı dışında kullanıldığı, kalıplaşmış ifadelerdir.
*Örnek:* "Kulak vermek" → Dikkatle dinlemek anlamına gelir.

**İkilemeler:** Aynı ya da yakın anlamlı, ya da zıt sözcüklerin bir arada kullanımıdır.
*Örnek:* ufak tefek, ağır başlı, er geç

**Kalıp Sözler:** Belirli durumlarda söylenen, toplumca benimsenmiş ifadelerdir.
*Örnek:* "Geçmiş olsun", "Kolay gelsin"

**Eş Anlamlı (Anlamdaş) Sözcükler:** Yazılışları farklı, anlamları aynı veya yakın olan sözcüklerdir.
*Örnek:* güzel / hoş / latif

**Zıt Anlamlı Sözcükler:** Birbirine karşıt anlam taşıyan sözcüklerdir.
*Örnek:* iyi ↔ kötü, sıcak ↔ soğuk

**LGS'de Dikkat:** Deyim ve atasözü sorularında bağlama dikkat et; aynı deyim farklı cümlelerde farklı anlam çağrıştırabilir.`,
    kazanimlar: [
      "Atasözlerini ve deyimleri doğru anlamıyla kullanır",
      "Eş ve zıt anlamlı sözcükleri ayırt eder",
      "İkilemelerin anlam özelliklerini kavrar",
      "Kalıp sözleri uygun bağlamda kullanır",
      "Söz varlığını metinleri anlamlandırmada kullanır",
    ],
  },
  {
    id: "24440b56-595d-448e-bb43-7f795caf1a65",
    dersIcerigi: `Sözcükler, farklı bağlamlarda birden fazla anlam taşıyabilir. LGS'de sözcük anlam soruları oldukça yaygındır.

**Gerçek Anlam:** Sözcüğün sözlükte ilk sırada verilen, temel anlamıdır.
*Örnek:* "Göz" → Görme organı

**Mecaz Anlam:** Sözcüğün benzetme yoluyla kazandığı anlam aktarmasıdır.
*Örnek:* "Masanın gözü" → Çekmece

**Yan Anlam:** Gerçek anlamla ilişkili olan, ancak onu tam karşılamayan anlamdır.
*Örnek:* "Ağız" → Kavanozun ağzı

**Terim Anlam:** Bir bilim, sanat veya meslek alanında özel kullanılan anlamdır.
*Örnek:* "Kök" → Bitkilerde toprak altında kalan kısım (biyoloji terimi)

**Sözcükte Anlam İlişkileri:**
- **Eş sesli (Sesteş) Sözcükler:** Yazılış ve okunuşları aynı, anlamları farklı sözcüklerdir.
  *Örnek:* "yüz" (sayı) / "yüz" (surat) / "yüz" (yüzmek)
- **Çok anlamlılık:** Bir sözcüğün birden fazla anlam taşımasıdır.
- **Ad aktarması (Mecaz-ı Mürsel):** Bir sözün benzetme amacı gütmeksizin başka bir anlama kullanılmasıdır.
- **Deyim aktarması:** Benzetme yoluyla anlam taşımasıdır.`,
    kazanimlar: [
      "Gerçek, mecaz ve yan anlamı ayırt eder",
      "Sesteş ve çok anlamlı sözcükleri tanır",
      "Sözcüklerin bağlamdaki anlamını tespit eder",
      "Terim anlamını diğer anlamlardan ayırt eder",
    ],
  },
  {
    id: "e35af688-7d36-4cd0-a10f-4816022ad350",
    dersIcerigi: `Yazım kuralları, Türk Dil Kurumu'nun belirlediği kurallara göre sözcüklerin doğru yazılmasını sağlar.

**Büyük Harf Kullanımı:**
- Cümle başlarında
- Özel isimler (kişi, yer, kurum adları)
- Kitap, dergi, gazete adları
- Unvanlar (isimden önce: Atatürk, isimden sonra küçük: ahmet bey)

**Birleşik Sözcüklerin Yazımı:**
- Bitişik yazılanlar: "gecekondu, başöğretmen, ilkokul"
- Ayrı yazılanlar: "göz ardı, baş ağrısı"
- Kural: Anlam kaymasına uğramış olanlar bitişik yazılır.

**Ses Olayları:**
- **Ünlü Düşmesi:** "oğul → oğlum, burun → burnum"
- **Ünsüz Benzeşmesi:** "git + ti → gitti"
- **Ünsüz Yumuşaması:** "kitap → kitabı, çocuk → çocuğu"
- **Kaynaşma:** "ne + için → niçin"

**Ek Yazımı:**
- Ünlü uyumuna dikkat: "geldi / koştu" (büyük ünlü uyumu)
- "-de/-da" ve "-ki" bağlaç olduğunda ayrı, ek olduğunda bitişik yazılır.

**Sık Yapılan Hatalar:**
- "Saat 14:00'da" değil "saat 14.00'da"
- "Türkçe" büyük, "türkçe konuş" deyiminde küçük yazılır
- "de/da" bağlacı her zaman ayrı yazılır`,
    kazanimlar: [
      "Büyük harf kullanım kurallarını uygular",
      "Birleşik sözcükleri doğru yazar",
      "Ses olaylarını tanır ve yazıma yansıtır",
      "Eklerin yazımında ünlü uyumunu uygular",
      "Yazım yanlışlarını tespit eder ve düzeltir",
    ],
  },

  // ==================== MATEMATİK ====================
  {
    id: "38b61310-f4ea-45de-ac74-9313af6996fc",
    dersIcerigi: `Matematik dersi; sayılar, cebir, geometri ve veri analizi konularını kapsar. LGS matematiği soyut düşünme, problem çözme ve mantıksal akıl yürütme becerilerini ölçer. Her konuyu önce kavramsal olarak anlamak, ardından çok soru çözerek pekiştirmek başarının anahtarıdır.`,
    kazanimlar: ["Sayı sistemleri ve işlemleri yapar", "Cebirsel ifadeler oluşturur ve düzenler", "Geometrik şekilleri inceler", "Veri toplar ve analiz eder"],
  },
  {
    id: "b10cdc36-18a4-4215-8a17-dd670be41653",
    dersIcerigi: `Sayılar ve İşlemler konusu, tüm matematik öğreniminin temelini oluşturur.

**Tam Sayılar ve Rasyonel Sayılar:**
- Tam sayılar: ...-3, -2, -1, 0, 1, 2, 3...
- Rasyonel sayılar: a/b biçiminde yazılabilen sayılar (b≠0)
- İrrasyonel sayılar: √2, π gibi kesire dönüştürülemeyen sayılar
- Gerçek sayılar = Rasyonel ∪ İrrasyonel

**Dört İşlem Özellikleri:**
- Toplama ve çarpma değişme özelliğine sahiptir
- Çıkarma ve bölme değişme özelliğine sahip değildir
- Dağılma özelliği: a × (b + c) = a×b + a×c

**BÖÇD - OBÇK:**
- **BÖÇD:** Birden fazla sayının ortak bölenleri içinde en büyüğü
- **OBÇK:** Birden fazla sayının ortak katları içinde en küçüğü
- Uygulama: Kesir işlemleri, problem çözme

**Mutlak Değer:** |a| = a (a≥0) veya |a| = -a (a<0)
*Örnek:* |-5| = 5, |3| = 3

**Ondalık Sayılar:** Kesirli miktarları gösteren sayılardır.
*Dönüşüm:* 3/4 = 0.75; 0.6 = 6/10 = 3/5`,
    kazanimlar: [
      "Tam sayı ve rasyonel sayı işlemleri yapar",
      "BÖÇD ve OBÇK hesaplar",
      "Mutlak değer problemlerini çözer",
      "Ondalık sayılarla dört işlem yapar",
      "Sayı doğrusunda sayıları yerleştirir",
    ],
  },
  {
    id: "1dc015b1-8a45-42d1-8aba-8e33ceeedbe2",
    dersIcerigi: `Çarpanlar ve katlar konusu, sayıların bölünebilirlik özelliklerini inceler.

**Bölünebilirlik Kuralları:**
- **2'ye bölünme:** Son rakam çift ise (0, 2, 4, 6, 8)
- **3'e bölünme:** Rakamlar toplamı 3'e bölünüyorsa
- **4'e bölünme:** Son iki rakam 4'e bölünüyorsa
- **5'e bölünme:** Son rakam 0 veya 5 ise
- **6'ya bölünme:** 2 ve 3'e bölünüyorsa
- **9'a bölünme:** Rakamlar toplamı 9'a bölünüyorsa
- **10'a bölünme:** Son rakam 0 ise

**Asal Sayılar:** Yalnızca 1 ve kendisine bölünebilen sayılardır (2, 3, 5, 7, 11, 13...)
- 1 asal sayı değildir
- 2, tek asal sayıdır

**Asal Çarpanlara Ayırma:**
360 = 2³ × 3² × 5

**BÖÇD Bulma:**
- Ortak asal çarpanların en küçük kuvvetleri çarpılır
- BÖÇD(12, 18) = 6

**OBÇK Bulma:**
- Tüm asal çarpanların en büyük kuvvetleri çarpılır
- OBÇK(12, 18) = 36

**İlişki:** BÖÇD(a,b) × OBÇK(a,b) = a × b`,
    kazanimlar: [
      "Bölünebilirlik kurallarını uygular",
      "Asal sayıları listeler",
      "Bir sayıyı asal çarpanlarına ayırır",
      "BÖÇD ve OBÇK hesaplar",
      "BÖÇD ve OBÇK ile problem çözer",
    ],
  },
  {
    id: "f174bdc8-ec05-42f5-9859-d9fea58c8ab1",
    dersIcerigi: `Üslü ifadeler, bir sayının tekrar eden çarpmalarını kısa yoldan gösterir.

**Temel Kavramlar:**
- aⁿ = a × a × a × ... × a (n tane)
- a: taban, n: üs
- 2⁵ = 32; 3³ = 27; 10⁴ = 10000

**Üslü Sayı Özellikleri:**
- aᵐ × aⁿ = aᵐ⁺ⁿ → aynı taban, üsler toplanır
- aᵐ ÷ aⁿ = aᵐ⁻ⁿ → aynı taban, üsler çıkarılır
- (aᵐ)ⁿ = aᵐˣⁿ → üs üstü, üsler çarpılır
- (a × b)ⁿ = aⁿ × bⁿ → çarpımın üssü
- a⁰ = 1 (a ≠ 0)
- a⁻ⁿ = 1/aⁿ

**Bilimsel Gösterim:**
- Çok büyük veya küçük sayıları 10'un kuvvetiyle gösterir
- 3.000.000 = 3 × 10⁶
- 0.000045 = 4.5 × 10⁻⁵

**Sık Kullanılan Değerler:**
- 2¹⁰ = 1024 ≈ 10³
- Negatif tabanlı: (-2)³ = -8; (-2)⁴ = 16`,
    kazanimlar: [
      "Üslü ifadelerin anlamını kavrar",
      "Üslü sayılarla dört işlem yapar",
      "Üslü ifadeleri sadeleştirir",
      "Bilimsel gösterim kullanır",
      "Negatif üslü ifadeleri hesaplar",
    ],
  },
  {
    id: "420cdc9c-f7f5-48ff-9de4-9db2928a4ecc",
    dersIcerigi: `Kareköklü ifadeler, üslü ifadelerin tersine işlemini yapar.

**Temel Kavramlar:**
- √a: a'nın karekökü (a ≥ 0)
- (√a)² = a
- √(a²) = |a|

**Tam Kare Sayılar:** 1, 4, 9, 16, 25, 36, 49, 64, 81, 100...

**Kareköklü İfadelerle İşlemler:**
- √a × √b = √(ab) → *Örnek:* √3 × √12 = √36 = 6
- √a / √b = √(a/b) → *Örnek:* √50 / √2 = √25 = 5
- Toplama/Çıkarma: Benzer kareköklü terimler birleştirilir
  *Örnek:* 3√2 + 5√2 = 8√2

**Karekök Basitleştirme:**
- √72 = √(36×2) = 6√2
- √(a²b) = a√b (a ≥ 0, b ≥ 0)

**Köklü İfadeyi Sadeleştirme:**
- 1/√2 = √2/2 (paydaki kök atılır)

**Karışık Problemlerde Dikkat:**
- Negatif sayının karekökü gerçek sayılarda yoktur
- √a + √b ≠ √(a+b)`,
    kazanimlar: [
      "Kareköklü ifadelerin anlamını kavrar",
      "Kareköklü ifadelerle dört işlem yapar",
      "Kareköklü ifadeleri sadeleştirir",
      "Tam kareleri tanır",
      "Karekök içeren denklemleri çözer",
    ],
  },
  {
    id: "c0ab8a23-45eb-4af7-8328-071f2bf84239",
    dersIcerigi: `Cebirsel ifadeler; sayıları, değişkenleri ve işlem sembollerini içeren matematiksel ifadelerdir.

**Temel Kavramlar:**
- **Terim:** Cebirsel ifadedeki her bir parça (3x², -5y, 7)
- **Katsayı:** Değişkenin önündeki sayı (3x'te katsayı 3)
- **Benzer Terimler:** Aynı değişken ve üssü taşıyan terimler
  *Örnek:* 3x² ve -5x² benzer terimdir

**İşlemler:**
- Toplama/Çıkarma: Yalnızca benzer terimler birleştirilebilir
  3x + 5x = 8x; 3x + 5y birleştirilemez
- Çarpma: Her terimi çarp
  3x(2x - 5) = 6x² - 15x
- Bölme: Ortak çarpanları sadeleştir

**Cebirsel Özdeşlikler:**
- (a + b)² = a² + 2ab + b²
- (a - b)² = a² - 2ab + b²
- (a + b)(a - b) = a² - b²
- (a + b)³ = a³ + 3a²b + 3ab² + b³

**Çarpanlara Ayırma:**
- Ortak çarpan paranteze alma: 6x² + 4x = 2x(3x + 2)
- Özdeşlik kullanma: x² - 9 = (x+3)(x-3)`,
    kazanimlar: [
      "Cebirsel ifadelerdeki terimleri tanır",
      "Benzer terimleri toplar ve çıkarır",
      "Cebirsel ifadelerle çarpma yapar",
      "Özdeşlikleri tanır ve uygular",
      "Çarpanlara ayırma yöntemlerini kullanır",
    ],
  },
  {
    id: "dcced510-bc7e-40ec-9822-f545f4c0617b",
    dersIcerigi: `Özdeşlikler, her sayı değeri için doğru olan cebirsel eşitliklerdir.

**Temel Özdeşlikler (LGS'de Sık Çıkanlar):**

**(a + b)² = a² + 2ab + b²**
*Örnek:* (x + 3)² = x² + 6x + 9

**(a - b)² = a² - 2ab + b²**
*Örnek:* (x - 4)² = x² - 8x + 16

**(a + b)(a - b) = a² - b²**
*Örnek:* (x + 5)(x - 5) = x² - 25

**Özdeşliklerin Tersten Kullanımı (Çarpanlara Ayırma):**
- x² + 6x + 9 = (x + 3)²
- x² - 25 = (x + 5)(x - 5)
- 4x² - 12x + 9 = (2x - 3)²

**Özel Değer Hesaplama:**
- a + b = 5 ve ab = 6 ise a² + b² = ?
- a² + b² = (a+b)² - 2ab = 25 - 12 = 13

**Dikkat Edilecek Noktalar:**
- (a + b)² ≠ a² + b² (sık yapılan hata!)
- Özdeşlik kullanmadan önce ifadeyi düzenle`,
    kazanimlar: [
      "Temel cebirsel özdeşlikleri bilir",
      "Özdeşlikleri açar ve hesaplar",
      "Özdeşlikleri çarpanlara ayırmada kullanır",
      "Özdeşliklerle özel değer problemlerini çözer",
    ],
  },
  {
    id: "a3d3d888-6a07-4a97-ae70-60574d70fce5",
    dersIcerigi: `Çarpanlara ayırma; bir cebirsel ifadeyi çarpanlar biçiminde yazmaktır.

**Yöntem 1 — Ortak Çarpan Paranteze Alma:**
6x³ + 4x² - 2x = 2x(3x² + 2x - 1)

**Yöntem 2 — Gruplandırma:**
ax + ay + bx + by = a(x+y) + b(x+y) = (a+b)(x+y)

**Yöntem 3 — Özdeşlik Kullanma:**
- Fark kareleri: a² - b² = (a+b)(a-b)
  *Örnek:* 9x² - 16 = (3x+4)(3x-4)
- Tam kare üçlü: a² ± 2ab + b² = (a±b)²
  *Örnek:* x² + 10x + 25 = (x+5)²

**Yöntem 4 — İkinci Dereceden Üçlü Çarpanlara Ayırma:**
x² + 5x + 6 = (x + 2)(x + 3)
→ Çarpımı 6, toplamı 5 olan sayılar: 2 ve 3

**Pratik Strateji:**
1. Önce ortak çarpan var mı kontrol et
2. İkili gruplandırma dene
3. Özdeşlik formüllerini tanımaya çalış
4. Sıfır çarpım özelliğiyle kök bul`,
    kazanimlar: [
      "Ortak çarpanı paranteze alır",
      "Gruplandırma yöntemini kullanır",
      "Özdeşlikleri çarpanlara ayırmada kullanır",
      "İkinci dereceden üçlüleri çarpanlarına ayırır",
      "Çarpanlara ayırarak denklem çözer",
    ],
  },
  {
    id: "b8340bc5-ee64-451c-b6ed-d7643350453e",
    dersIcerigi: `Doğrusal denklemler, en yüksek derecesi 1 olan denklemlerdir.

**Birinci Dereceden Bir Bilinmeyenli Denklemler:**
- Genel form: ax + b = 0 (a ≠ 0)
- Çözüm: x = -b/a
*Örnek:* 3x - 9 = 0 → x = 3

**Denklem Çözme Adımları:**
1. Parantezleri aç
2. Sabit terimleri bir tarafa, değişkenleri diğer tarafa topla
3. Her iki tarafı katsayıya böl

**Doğrusal Denklemlerin Grafiği:**
- y = mx + b biçimindeki denklemler
- m: eğim, b: y-ekseni kesim noktası
- Grafik daima bir doğru çizer

**İki Bilinmeyenli Denklem Sistemleri:**
- Yerine koyma yöntemi
- Eşitleme yöntemi
- Grafik yöntemi

**Problem Kurma:**
- Bilinmeyen belirleme (x, y)
- Koşulları denklem olarak yazma
- Sistemi çözme
*Örnek:* İki sayının toplamı 20, farkı 4 ise büyük sayı?`,
    kazanimlar: [
      "Birinci dereceden denklemi çözer",
      "Denklem kurarak problem çözer",
      "İki bilinmeyenli sistemi çözer",
      "Doğrusal denklemin grafiğini çizer",
      "Eğim ve y-kesim noktasını yorumlar",
    ],
  },
  {
    id: "c4ac3a20-9ade-40e7-a061-cecd2b28ff2b",
    dersIcerigi: `Denklemler ve eşitsizlikler, matematiksel ilişkileri modellemek için kullanılır.

**Eşitsizlikler:**
- a > b; a < b; a ≥ b; a ≤ b; a ≠ b
- Sayı doğrusunda çözüm kümesi gösterilir

**Eşitsizlik Özellikleri:**
- Eşitsizliğin her iki tarafına aynı sayı eklenebilir/çıkarılabilir
- Her iki taraf pozitif sayıyla çarpılır/bölünürse yön değişmez
- **Her iki taraf negatif sayıyla çarpılır/bölünürse YÖN DEĞİŞİR!**
  *Örnek:* -2x > 6 → x < -3

**Birleşik Eşitsizlikler:**
- a < x < b biçimindeki ikili eşitsizlikler
*Örnek:* -3 < 2x - 1 < 7 → -1 < x < 4

**Denklem ve Eşitsizlik Sistemleri:**
- Her iki koşul aynı anda sağlanmalıdır
- Sayı doğrusunda kesişim kümesi bulunur

**Mutlak Değerli Eşitsizlikler:**
- |x| < a → -a < x < a
- |x| > a → x < -a veya x > a`,
    kazanimlar: [
      "Eşitsizlikleri çözer ve sayı doğrusunda gösterir",
      "Eşitsizlik özelliklerini doğru uygular",
      "Negatif çarpanda yön değişikliğini bilir",
      "Birleşik eşitsizlikleri çözer",
      "Eşitsizliklerle problem kurar ve çözer",
    ],
  },
  {
    id: "b3af56ab-3709-45dd-930c-001c8f62204f",
    dersIcerigi: `Eşitsizlikler, iki ifade arasındaki büyük-küçük ilişkisini gösterir ve gerçek hayat problemlerinde sık kullanılır.

**Eşitsizlik Sembolleri:** >, <, ≥, ≤, ≠

**Çözüm Kümesi:** Eşitsizliği sağlayan sayıların kümesidir.

**Sayı Doğrusunda Gösterim:**
- x > 3: 3'ten büyük, 3 dahil değil (açık daire)
- x ≥ 3: 3'ten büyük veya eşit, 3 dahil (kapalı daire)

**Eşitsizlik Sistemleri:**
- "VE" (kesişim): Her ikisi de sağlanmalı → ∩
- "VEYA" (birleşim): En az biri sağlanmalı → ∪

**Gerçek Hayat Uygulamaları:**
- "En az" → ≥ (büyük eşit)
- "En fazla" → ≤ (küçük eşit)
- "Daha fazla" → > (büyük)
- "Daha az" → < (küçük)

**Tam Sayı Çözümleri:**
x > 2.3 ise tam sayı çözümler: 3, 4, 5... (2.3'ten büyük ilk tam sayı 3)`,
    kazanimlar: [
      "Eşitsizlikleri çözer",
      "Çözüm kümesini sayı doğrusunda gösterir",
      "Eşitsizlik sistemlerini çözer",
      "Gerçek hayat problemlerini eşitsizlikle çözer",
    ],
  },
  {
    id: "5c1ea1ca-0d54-4f65-ad5f-de76aec21ed8",
    dersIcerigi: `Üçgenler geometrinin temel konularından biridir ve LGS'de çok soru çıkar.

**Üçgen Özellikleri:**
- İç açılar toplamı: 180°
- Dış açı = İçteki diğer iki açı toplamı
- Her kenar, diğer iki kenarın toplamından küçük, farkından büyük olmalı

**Üçgen Türleri (Kenar):**
- **Eşkenar:** 3 kenar eşit, 3 açı 60°
- **İkizkenar:** 2 kenar eşit, taban açıları eşit
- **Çeşitkenar:** Tüm kenarlar farklı

**Üçgen Türleri (Açı):**
- **Dik:** Bir açı 90°, diğerleri toplam 90°
- **Dar:** Tüm açılar 90°'den küçük
- **Geniş:** Bir açı 90°'den büyük

**Pisagor Teoremi (Dik Üçgen):**
a² + b² = c² (c hipotenüs)
- 3-4-5; 5-12-13; 8-15-17 Pisagor üçlüleri

**Özel Üçgenler:**
- 30°-60°-90°: Kenarlar oranı 1 : √3 : 2
- 45°-45°-90°: Kenarlar oranı 1 : 1 : √2

**Alan Formülleri:**
- A = (taban × yükseklik) / 2
- Herona formülü: A = √(s(s-a)(s-b)(s-c)); s=(a+b+c)/2`,
    kazanimlar: [
      "Üçgen çeşitlerini tanır ve özelliklerini bilir",
      "Pisagor teoremini uygular",
      "Üçgenlerde açı hesaplamalarını yapar",
      "Üçgen alan formüllerini kullanır",
      "Özel üçgenlerdeki oran ilişkilerini bilir",
    ],
  },
  {
    id: "2d4289c5-0372-416b-8864-bf0c63adcde9",
    dersIcerigi: `Dönüşüm geometrisi; şekillerin yansıma, dönme ve öteleme gibi işlemlerle nasıl dönüştüğünü inceler.

**Öteleme (Öteleme — Translation):**
- Şekil, boyutu ve şekli değişmeden bir yönde kaydırılır
- Her nokta aynı vektör kadar hareket eder

**Yansıma (Simetri — Reflection):**
- Şekil, bir doğraya (eksen) göre aynalama yapılır
- x-ekseni yansıma: (x, y) → (x, -y)
- y-ekseni yansıma: (x, y) → (-x, y)
- y=x doğrusuna yansıma: (x, y) → (y, x)

**Dönme (Rotation):**
- Şekil, bir merkez noktası etrafında döndürülür
- 90° döndürme: (x, y) → (-y, x) [saat yönü tersine]
- 180° döndürme: (x, y) → (-x, -y)

**Nokta Simetrisi:**
- Bir noktanın başka bir nokta etrafındaki simetrisi
- A(x, y) ve merkez O(a, b) ise simetrik nokta A'(2a-x, 2b-y)

**Büyütme ve Küçültme (Homothety):**
- Şekil, bir merkeze göre ölçeklendirilir
- Benzerlik oranı k ise alanlar k² oranında değişir`,
    kazanimlar: [
      "Öteleme, yansıma ve dönme dönüşümlerini uygular",
      "Dönüşüm sonrası noktanın yeni koordinatlarını bulur",
      "Eksen simetrisini belirler",
      "Nokta simetrisini hesaplar",
      "Dönüşümlerin alanı koruduğunu bilir",
    ],
  },
  {
    id: "4464269f-ac5b-4fdd-8ef6-d75a88969ce3",
    dersIcerigi: `Piramit, koni ve küre, uzay geometrinin temel cisimlerindedir.

**Piramit:**
- Tabanı çokgen, yanal yüzleri üçgenlerden oluşur
- **Hacim:** V = (1/3) × taban alanı × yükseklik
- **Yanal Alan:** Yanal üçgenlerin alanları toplamı
- Kare tabanlı piramit: A_taban = a²; A_yanal = 4 × (a × l)/2

**Koni:**
- Tabanı daire, tepesi bir nokta
- r: taban yarıçapı; h: yükseklik; l: ayna yüksekliği (l² = r² + h²)
- **Hacim:** V = (1/3) × πr² × h
- **Taban Alanı:** A = πr²
- **Yanal Alan:** A_yanal = πrl
- **Toplam Alan:** A = πr² + πrl = πr(r + l)

**Küre:**
- Tüm noktaları merkezden eşit uzaklıkta olan cisim
- **Hacim:** V = (4/3)πr³
- **Yüzey Alanı:** A = 4πr²

**Dikkat:** Koni hacmi = Silindirin 1/3'ü (aynı taban ve yükseklik için)`,
    kazanimlar: [
      "Piramit, koni ve kürenin temel elemanlarını tanır",
      "Hacim ve yüzey alanı formüllerini uygular",
      "Ayna yüksekliğini hesaplar",
      "Gerçek hayat uygulamalarını çözer",
    ],
  },
  {
    id: "3bdd7fe0-ee33-4ef6-a44b-02ee91374fe8",
    dersIcerigi: `Olasılık; bir olayın gerçekleşme ihtimalini sayısal olarak ifade eder.

**Temel Kavramlar:**
- **Deneysel Olasılık:** Deney yapılarak elde edilir (frekans/toplam)
- **Teorik Olasılık:** P(A) = Olayın gerçekleşme sayısı / Toplam eşit olası sonuç
- P(A) her zaman 0 ≤ P(A) ≤ 1 arasındadır
- **İmkânsız Olay:** P(A) = 0
- **Kesin Olay:** P(A) = 1

**Bütünleyen Olay:**
- P(Aᶜ) = 1 - P(A)
- *Örnek:* Zarda 6 gelmeme olasılığı = 1 - 1/6 = 5/6

**Bileşik Olaylar:**
- **Bağımsız Olaylar:** P(A ve B) = P(A) × P(B)
- **Karşılıklı Dışlayan:** P(A veya B) = P(A) + P(B)
- **Genel Toplama:** P(A veya B) = P(A) + P(B) - P(A ve B)

**Kombinasyon ve Permütasyon:**
- Permütasyon (sıra önemli): P(n,r) = n!/(n-r)!
- Kombinasyon (sıra önemsiz): C(n,r) = n!/(r!(n-r)!)

**Sık Kullanılan Örnekler:**
- Zar atma: 1/6 olasılıkla herhangi bir yüz
- Para atma: 1/2 olasılıkla tura veya yazı
- Kart çekme: 52 kartlık desteden hesap`,
    kazanimlar: [
      "Basit olayın olasılığını hesaplar",
      "Bütünleyen olay olasılığını bulur",
      "Bağımsız olayların olasılıklarını hesaplar",
      "Kombinasyon ve permütasyon kullanır",
      "Günlük hayat problemlerinde olasılığı uygular",
    ],
  },
  {
    id: "c7dec2ea-6f8c-4e1d-bd56-db48b5097000",
    dersIcerigi: `Veri analizi; toplanan verileri düzenleme, özetleme ve yorumlama sürecini kapsar.

**Merkezi Eğilim Ölçüleri:**
- **Ortalama (Aritmetik):** Verilerin toplamı / veri sayısı
- **Medyan (Ortanca):** Verilerin sıralı dizilişinde ortadaki değer (tek sayıda) veya iki ortadakinin ortalaması (çift sayıda)
- **Mod (Tepe Değer):** En sık tekrarlanan değer

**Yayılım Ölçüleri:**
- **Ranj:** En büyük - en küçük
- **Standart Sapma:** Verilerin ortalamadan ortalama uzaklığı
- **Çeyrekler:** Q1 (alt çeyrek), Q2 (medyan), Q3 (üst çeyrek)

**Grafik Türleri:**
- **Sütun Grafiği:** Kategorik verileri karşılaştırmak için
- **Çizgi Grafiği:** Zaman içindeki değişimi göstermek için
- **Pasta Grafiği:** Bütünün parçalarını yüzde olarak göstermek için
- **Kutu Grafiği (Box Plot):** Yayılımı ve medyanı birlikte gösterir

**Veri Yorumlama:**
- Aykırı değerler ortalamayı etkiler, medyanı daha az etkiler
- Simetrik dağılımda ortalama = medyan = mod`,
    kazanimlar: [
      "Ortalama, medyan ve modu hesaplar",
      "Veri grafiklerini okur ve yorumlar",
      "Verileri tabloya ve grafiğe döker",
      "Aykırı değerlerin etkisini değerlendirir",
      "Yayılım ölçülerini hesaplar",
    ],
  },

  // ==================== FEN BİLİMLERİ ====================
  {
    id: "a088b94d-b9b2-491d-a908-289f608d92de",
    dersIcerigi: `Fen Bilimleri; fizik, kimya ve biyoloji konularını bir arada inceler. LGS'de fen soruları günlük hayatla ilişkili, yorumlama ve analiz gerektiren sorulardır. Grafik okuma, deney yorumlama ve neden-sonuç ilişkisi kurma önemlidir.`,
    kazanimlar: ["Fiziksel olayları açıklar", "Kimyasal tepkimeleri tanır", "Canlı dünyasını inceler", "Bilimsel yöntem uygular"],
  },
  {
    id: "fa75c8d5-5c20-48b8-8afa-d880a11ce9e5",
    dersIcerigi: `Kuvvet ve hareket, cisimler arasındaki etkileşimi ve bu etkileşimin sonucunda oluşan hareketi inceler.

**Kuvvet:**
- Bir cismin hareket durumunu değiştiren veya şeklini bozan etkidir (N - Newton)
- Vektörel büyüklüktür: büyüklük, yön ve doğrultusu vardır

**Newton'un Hareket Yasaları:**
1. **Eylemsizlik Yasası:** Durgun cisim durur, hareket eden hareket etmeye devam eder (net kuvvet sıfırsa)
2. **F = m × a:** Kuvvet = kütle × ivme. Kuvvet artarsa ivme artar, kütle artarsa ivme azalır
3. **Etki-Tepki:** Her etkiye eşit ve zıt yönlü bir tepki kuvveti vardır

**Sürtünme Kuvveti:**
- Yüzeyler arasındaki temas kuvveti
- Statik sürtünme: Cisim hareket etmeden önceki sürtünme
- Kinetik sürtünme: Hareket halindeki cismin sürtünmesi
- Yüzey pürüzlülüğü ve baskı kuvvetiyle değişir

**Serbest Düşme:**
- g ≈ 10 m/s² (yerçekimi ivmesi)
- v = g × t; h = ½ × g × t²

**Momentum:**
- p = m × v
- Çarpışmalarda korunur`,
    kazanimlar: [
      "Newton'un hareket yasalarını açıklar",
      "Kuvvet, kütle ve ivme ilişkisini hesaplar",
      "Sürtünme kuvvetini etkileyen faktörleri açıklar",
      "Serbest düşme problemlerini çözer",
      "Günlük hayattaki kuvvet örneklerini tanır",
    ],
  },
  {
    id: "096a21c2-e7c9-48a3-a536-74a5ec626174",
    dersIcerigi: `Basınç; birim alana etki eden kuvvet miktarıdır.

**Katıların Basıncı:**
P = F / A (Pascal - Pa)
- F: kuvvet (N), A: alan (m²)
- Alan azaldıkça basınç artar (iğnenin ucu, bıçağın ağzı)

**Sıvı Basıncı:**
P = d × g × h
- d: sıvının yoğunluğu (kg/m³), g: 10 m/s², h: derinlik
- Derinlik arttıkça basınç artar
- Yoğunluk arttıkça basınç artar

**Pascal Prensibi:** Kapalı kaplardaki sıvılara uygulanan basınç, her yönde eşit büyüklükte iletilir. (Hidrolik sistemlerin temeli)

**Archimedes Prensibi (Kaldırma Kuvveti):**
F_kaldırma = d_sıvı × g × V_batan
- Cisim sıvıda ağırlığından daha az ağır hisseder
- Yoğunluğu sıvıdan az olan cisim yüzer
- Yoğunluğu sıvıdan fazla olan cisim batar

**Gaz Basıncı:**
- Atmosfer basıncı ≈ 100.000 Pa = 1 atm
- Yükseldikçe azalır
- Manometre ile ölçülür`,
    kazanimlar: [
      "Basınç formülünü uygular",
      "Sıvı basıncını etkileyen faktörleri açıklar",
      "Pascal prensibini hidrolik sistemlere uygular",
      "Archimedes prensibini kullanarak kaldırma kuvvetini hesaplar",
      "Yüzme ve batma koşullarını belirler",
    ],
  },
  {
    id: "2b44cb70-7982-4cc3-a300-764109e3a2a4",
    dersIcerigi: `Maddenin halleri ve ısı; termodinamiğin temelini oluşturur.

**Maddenin Halleri:**
- **Katı:** Belirli şekil ve hacim; tanecikler düzenli ve sıkı
- **Sıvı:** Belirli hacim, belirsiz şekil; tanecikler hareket edebilir
- **Gaz:** Belirsiz şekil ve hacim; tanecikler serbestçe hareket eder
- **Plazma:** 4. hal, yıldızlarda bulunur

**Hal Değişimleri:**
- Erime: Katı → Sıvı (ısı alır)
- Donma: Sıvı → Katı (ısı verir)
- Buharlaşma: Sıvı → Gaz (ısı alır)
- Yoğuşma: Gaz → Sıvı (ısı verir)
- Süblimleşme: Katı → Gaz (ısı alır; kuru buz, naftalin)
- Kırağılaşma: Gaz → Katı (ısı verir)

**Isı ve Sıcaklık:**
- Sıcaklık: Ortalama kinetik enerji (°C veya K)
- Isı: Aktarılan enerji miktarı (Joule veya kalori)
- 1 kalori = 4.18 J

**Özgül Isı Kapasitesi:**
Q = m × c × ΔT
c: özgül ısı (J/kg°C); suyun özgül ısısı = 4200 J/kg°C

**Isı Aktarım Yolları:**
- İletim (Kondüksiyon): Katılarda; temas yoluyla
- Taşınım (Konveksiyon): Sıvı ve gazlarda; akışkanlarla
- Işıma (Radyasyon): Ortamsız; elektromanyetik dalgalarla`,
    kazanimlar: [
      "Maddenin hallerini ve hal değişimlerini açıklar",
      "Isı ve sıcaklık arasındaki farkı bilir",
      "Özgül ısı kapasitesi formülünü kullanır",
      "Isı iletim yollarını örneklendirir",
      "Grafiklerde hal değişimlerini okur",
    ],
  },
  {
    id: "2b8c5b80-458e-4043-8ad2-e5c0fe5951d2",
    dersIcerigi: `Elektrik yükleri ve elektrik enerjisi günlük hayatımızın ayrılmaz parçasıdır.

**Elektrik Yükleri:**
- (+) Proton; (-) Elektron
- Aynı yükler iter, zıt yükler çeker
- Yük korunumu: Toplam yük değişmez

**Elektrik Akımı:**
- I = Q / t (Amper - A)
- Q: Yük miktarı (Coulomb), t: süre (s)

**Elektrik Devresi Bileşenleri:**
- Pil/Akü: EMK kaynağı
- Direnç: Akımı kısıtlar (Ohm - Ω)
- Ampermetre: Seri bağlı, akımı ölçer
- Voltmetre: Paralel bağlı, gerilimi ölçer

**Ohm Yasası:** V = I × R (Volt = Amper × Ohm)

**Devre Bağlantıları:**
- **Seri:** R_toplam = R₁ + R₂; I aynı; V bölünür
- **Paralel:** 1/R_toplam = 1/R₁ + 1/R₂; V aynı; I bölünür

**Elektrik Enerjisi ve Gücü:**
- P = V × I = I²R = V²/R (Watt - W)
- E = P × t (Joule veya kWh)
- 1 kWh = 3.600.000 J

**Elektrik Güvenliği:**
- Kısa devre, aşırı yük, kaçak akım tehlikeleri
- Topraklama ve sigorta kullanımı`,
    kazanimlar: [
      "Elektrik yüklerinin özelliklerini açıklar",
      "Ohm yasasını uygular",
      "Seri ve paralel devre özelliklerini karşılaştırır",
      "Elektrik gücü ve enerji hesaplar",
      "Devre şemalarını okur",
    ],
  },
  {
    id: "52d24115-45e5-43d9-aa4b-d4a7a3c038a8",
    dersIcerigi: `Aydınlatma ve ses, günlük hayatımızdaki iki temel fiziksel olayı kapsar.

**Işık:**
- Elektromanyetik dalgadır, ortamsız yayılır
- Hızı: 3×10⁸ m/s (boşlukta)
- Işın, dalga ve foton modeliyle açıklanır

**Işığın Yansıması:**
- Yansıma açısı = Gelme açısı
- Düzlem ayna: Sanal, dik ve eşit büyüklükte görüntü
- Çukur ayna: Yakınlaştırıcı, gerçek ve sanal görüntü
- Tümsek ayna: Uzaklaştırıcı, küçültülmüş sanal görüntü

**Işığın Kırılması:**
- Işık farklı yoğunlukta ortamdan geçerken yön değiştirir
- Snell Yasası: n₁sinθ₁ = n₂sinθ₂
- Mercekler: Yakınsak (konveks), Iraksak (konkav)

**Ses:**
- Mekanik dalgadır, ortama ihtiyaç duyar (boşlukta yayılmaz)
- Katılarda > Sıvılarda > Gazlarda hızlıdır
- Havada ≈ 340 m/s

**Ses Özellikleri:**
- Frekans (Hz): Sesin tizliği/pestliği
- Genlik: Sesin şiddeti (desibel)
- İnsan kulağı: 20 Hz - 20.000 Hz

**Sesin Yansıması (Yankı):**
Yankı için mesafe en az 17 m olmalı (0.1 saniyelik gecikme)`,
    kazanimlar: [
      "Işığın yansıma ve kırılma özelliklerini açıklar",
      "Ayna ve mercek çeşitlerini kullanır",
      "Sesin yayılma özelliklerini bilir",
      "Ses frekansı ve şiddetini yorumlar",
      "Işık ve ses olaylarını karşılaştırır",
    ],
  },
  {
    id: "3a92f1f3-eb08-4f19-8e26-2cb36502dd12",
    dersIcerigi: `Kimyasal tepkimeler, maddelerin dönüşüm süreçlerini inceler.

**Fiziksel ve Kimyasal Değişim:**
- **Fiziksel:** Maddenin kimliği değişmez (erime, buharlaşma, kırılma)
- **Kimyasal:** Yeni maddeler oluşur (yanma, paslanma, fermantasyon)

**Kimyasal Tepkime İşaretleri:**
- Renk değişimi
- Gaz çıkması (kabarcık)
- Çökelti oluşumu
- Isı veya ışık yayılması
- Koku değişimi

**Tepkime Denklemleri:**
- Girenler (reaktanlar) → Çıkanlar (ürünler)
- 2H₂ + O₂ → 2H₂O (katsayı dengeleme)

**Kütlenin Korunumu Yasası:**
Tepkimedeki toplam kütle değişmez. Girenler kütlesi = Çıkanlar kütlesi

**Yanma Tepkimeleri:**
- Tam yanma: CO₂ + H₂O oluşur (yeterli O₂ ile)
- Eksik yanma: CO + H₂O oluşur (yetersiz O₂)

**Ekzotermik ve Endotermik:**
- Ekzotermik: Isı verir (yanma, paslanma)
- Endotermik: Isı alır (fotosentez, karbonun yavaş yanması)

**Tepkime Hızını Etkileyen Faktörler:**
Sıcaklık, temas yüzeyi, konsantrasyon, katalizör`,
    kazanimlar: [
      "Fiziksel ve kimyasal değişimi ayırt eder",
      "Kimyasal tepkime denklemlerini dengeler",
      "Kütlenin korunumu yasasını uygular",
      "Ekzotermik ve endotermik tepkimeleri ayırt eder",
      "Tepkime hızını etkileyen faktörleri açıklar",
    ],
  },
  {
    id: "fdf69e1b-4502-4fbe-a5e8-a1110f57b669",
    dersIcerigi: `Asitler ve bazlar, kimyasal maddelerin önemli iki sınıfını oluşturur.

**Asitler:**
- Suda çözününce H⁺ iyonu verir
- Ekşi tada sahiptir (limon, sirke)
- Lakmus kâğıdını kırmızıya boyar
- Metallerle tepkimede H₂ gazı çıkar
- Örnekler: HCl (tuz asidi), H₂SO₄ (sülfürik asit), CH₃COOH (asetik asit)

**Bazlar:**
- Suda çözününce OH⁻ iyonu verir
- Acı tada sahiptir ve kaygan hissi verir
- Lakmus kâğıdını maviye boyar
- Örnekler: NaOH (kostik), Ca(OH)₂ (sönmüş kireç), NH₃ (amonyak)

**pH Ölçeği:**
- 0-14 arasında değişir
- pH < 7: Asit
- pH = 7: Nötr (saf su)
- pH > 7: Baz
- Her birim pH değişiminde konsantrasyon 10 kat değişir

**Nötrleşme Tepkimesi:**
Asit + Baz → Tuz + Su
HCl + NaOH → NaCl + H₂O

**İndikatörler:**
- Turnusol: Asitte kırmızı, bazda mavi
- Fenolftalein: Asitte renksiz, bazda pembe
- Evrensel indikatör: Her pH için farklı renk`,
    kazanimlar: [
      "Asit ve bazların özelliklerini karşılaştırır",
      "pH ölçeğini yorumlar",
      "Nötrleşme tepkimesini yazar",
      "İndikatörlerin kullanımını açıklar",
      "Günlük hayattaki asit ve baz örneklerini verir",
    ],
  },
  {
    id: "b2e949b8-4009-452d-8a30-013e98d8cc35",
    dersIcerigi: `DNA ve genetik kod, kalıtım biliminin temelini oluşturur.

**DNA Yapısı:**
- Deoksiribo Nükleik Asit
- Çift sarmal yapı (Watson-Crick modeli)
- Nükleotidlerden oluşur: Fosfat + Şeker (deoksiriboz) + Baz
- Azotlu bazlar: Adenin (A), Timin (T), Guanin (G), Sitozin (C)
- Baz eşleşmesi: A-T; G-C (Chargaff kuralı)

**Gen:** DNA'nın belirli bir protein için şifrelenmiş bölümü

**Genetik Kod:**
- 3'lü kodon sistemi: Her 3 baz bir amino asidi kodlar
- 64 farklı kodon, 20 amino asit
- mRNA: DNA'dan kopyalanan haberci RNA
- tRNA: Amino asitleri ribozoma taşır
- Ribozom: Protein sentez yeri

**Protein Sentezi:**
1. **Transkripsiyon:** DNA → mRNA (çekirdekte)
2. **Translasyon:** mRNA → Protein (ribozomda)

**Mutasyon:**
- DNA'da meydana gelen kalıcı değişiklik
- UV ışınları, radyasyon, kimyasallar mutajendır
- Kanser oluşumuna yol açabilir

**Kalıtım:**
- Mendel Yasaları: Baskın ve çekinik özellikler
- Genotip: Genetik yapı (AA, Aa, aa)
- Fenotip: Görünür özellik`,
    kazanimlar: [
      "DNA'nın yapısını ve baz eşleşmesini açıklar",
      "Protein sentezinin aşamalarını sıralar",
      "Genetik kodu tanır",
      "Mutasyon nedenlerini ve sonuçlarını açıklar",
      "Mendel kalıtım kurallarını uygular",
    ],
  },
  {
    id: "39a79824-e472-4f79-9bbc-3c55e00f6b97",
    dersIcerigi: `Mevsimler ve iklim, Dünya'nın güneş etrafındaki hareketi ve atmosfer olaylarını inceler.

**Mevsimlerin Oluşumu:**
- Dünya'nın eğik eksenle (23.5°) güneş etrafında dönmesi
- Yaz: Yarımküre Güneş'e daha yakın, ışınlar dik gelir
- Kış: Yarımküre Güneş'ten daha uzak, ışınlar eğik gelir

**Gün-Gece Uzunluğu:**
- 21 Haziran: Kuzey yarımkürede en uzun gün
- 21 Aralık: Kuzey yarımkürede en kısa gün
- 21 Mart / 23 Eylül: Ekinoks — gece gündüz eşit

**Hava ve İklim:**
- Hava: Kısa süreli atmosfer olayları (yağmur, bulut)
- İklim: Uzun süreli (30 yıl) ortalama hava koşulları

**İklim Elemanları:**
- Sıcaklık, yağış, nem, rüzgar, basınç

**İklim Tipleri (Türkiye):**
- Karadeniz: Yağışlı, serin
- Akdeniz: Yazı sıcak-kuru, kışı ılık-yağışlı
- Karasal: Sıcaklık farkı büyük, az yağışlı
- Step: Kurak, karasal iklim geçiş

**Küresel Isınma:**
- Sera gazları (CO₂, CH₄) atmosferde birikerek sıcaklığı artırır
- Buzulların erimesi, deniz seviyesinin yükselmesi`,
    kazanimlar: [
      "Mevsimlerin oluşum nedenini açıklar",
      "Gün uzunluğundaki değişimleri yorumlar",
      "Hava ile iklim arasındaki farkı bilir",
      "Türkiye'deki iklim tiplerini tanır",
      "Küresel ısınmanın nedenlerini açıklar",
    ],
  },

  // ==================== SOSYAL BİLGİLER ====================
  {
    id: "b9abfa9b-739d-4f30-87ad-2e01d73faa13",
    dersIcerigi: `T.C. İnkılap Tarihi ve Atatürkçülük dersi; Osmanlı'nın çöküşünden Türkiye Cumhuriyeti'nin kuruluşuna ve Atatürk ilke ve inkılaplarına kadar uzanan süreci inceler. LGS'de bu ders; tarih anlayışı, neden-sonuç ilişkisi ve kronolojik sıralama açısından değerlendirilir.`,
    kazanimlar: ["Kurtuluş Savaşı'nın aşamalarını sıralar", "Atatürk inkılaplarını açıklar", "Demokratikleşme sürecini inceler", "İnsan hakları belgelerini tanır"],
  },
  {
    id: "2615679a-c084-47ae-b85b-23f802745c5b",
    dersIcerigi: `Kurtuluş Savaşı; Osmanlı'nın I. Dünya Savaşı'nı kaybetmesi sonrası işgale uğrayan Anadolu'nun bağımsızlık mücadelesidir.

**Mondros Ateşkesi (30 Ekim 1918):**
- Osmanlı'yı çöküşe sürükleyen ağır koşullar
- Boğazların, limanların ve stratejik noktaların işgali
- Azınlıklara geniş haklar

**İşgaller:**
- İngilizler: İstanbul, Musul, Güney Anadolu
- Fransızlar: Çukurova, Güney Doğu
- İtalyanlar: Güneybatı
- Yunanlılar: İzmir (15 Mayıs 1919)

**Mustafa Kemal'in Samsun'a Çıkışı (19 Mayıs 1919):**
- Milli mücadelenin resmi başlangıcı
- Amasya Genelgesi: "Milletin istiklali yine milletin azim ve kararıyla kurtarılacak"

**Kongreler:**
- Erzurum Kongresi (Temmuz 1919): Doğu illeri adına
- Sivas Kongresi (Eylül 1919): Tüm Anadolu adına; TBMM'ye zemin

**TBMM'nin Açılışı (23 Nisan 1920)**

**Önemli Savaşlar:**
- Sakarya Meydan Muharebesi (1921): Dönüm noktası
- Büyük Taarruz (Ağustos 1922): Son saldırı
- Mudanya Ateşkesi (Ekim 1922)
- Lozan Antlaşması (24 Temmuz 1923)
- Cumhuriyet'in İlanı (29 Ekim 1923)`,
    kazanimlar: [
      "Mondros Ateşkesi'nin sonuçlarını açıklar",
      "Milli mücadelenin başlangıcını ve kongrelerini sıralar",
      "TBMM'nin açılmasının önemini değerlendirir",
      "Kurtuluş Savaşı'nın aşamalarını sıralar",
      "Lozan Antlaşması'nın önemini açıklar",
    ],
  },
  {
    id: "7927623a-313f-4de5-b27b-6a2466589268",
    dersIcerigi: `Atatürk inkılapları; Türkiye'yi çağdaş, laik ve demokratik bir devlete dönüştürmeyi amaçlayan kapsamlı değişikliklerdir.

**Siyasi İnkılaplar:**
- Saltanatın Kaldırılması (1 Kasım 1922)
- Cumhuriyet'in İlanı (29 Ekim 1923)
- Halifeliğin Kaldırılması (3 Mart 1924)

**Hukuk Alanındaki İnkılaplar:**
- Medeni Kanun (1926): İsviçre'den alındı; evlilikte eşitlik, miras hakkı
- Borçlar ve Ticaret Kanunu

**Eğitim ve Kültür:**
- Tevhid-i Tedrisat (1924): Eğitim birliği
- Harf Devrimi (1 Kasım 1928): Latin alfabesi
- Millet Mektepleri: Okuma-yazma kampanyası
- Türk Tarih Kurumu (1931) ve Türk Dil Kurumu (1932)

**Toplumsal İnkılaplar:**
- Kıyafet Devrimi (1925): Şapka Kanunu
- Takvim ve Saat Değişikliği
- Soyadı Kanunu (1934)
- Kadınlara Seçme-Seçilme Hakkı (1934)

**Ekonomik İnkılaplar:**
- Kabotaj Kanunu (1926): Deniz ticareti
- Teşvik-i Sanayi Kanunu

**Atatürk İlkeleri (6 OK):**
Cumhuriyetçilik, Milliyetçilik, Halkçılık, Devletçilik, Laiklik, Devrimcilik`,
    kazanimlar: [
      "Atatürk inkılaplarını alanlarına göre sınıflandırır",
      "Her inkılabın amacını ve sonuçlarını açıklar",
      "Atatürk ilkelerini tanımlar",
      "İnkılapların günümüze yansımalarını değerlendirir",
    ],
  },
  {
    id: "f715f346-7ee2-4209-ae96-a0eb1fc11007",
    dersIcerigi: `Demokratikleşme süreci; Türkiye'nin tek parti döneminden çok partili sisteme geçişini ve demokratik kurumların gelişimini kapsar.

**Tek Parti Dönemi (1923-1946):**
- CHP iktidarı
- 1924, 1934 ve 1945 Anayasaları
- İki deneme girişimi: Terakkiperver Fırkası (1924) ve Serbest Fırka (1930)

**Çok Partili Hayata Geçiş (1946):**
- Demokrat Parti kuruldu (Celal Bayar, Adnan Menderes)
- 1950 seçimlerinde DP iktidara geldi

**27 Mayıs 1960 Darbesi:**
- DP iktidarına son verildi
- 1961 Anayasası hazırlandı

**12 Mart 1971 Muhtırası ve 12 Eylül 1980 Darbesi:**
- 1982 Anayasası

**AB Uyum Süreci:**
- Temel hak ve özgürlüklerin genişletilmesi
- Anayasa değişiklikleri

**Demokrasinin Temel Unsurları:**
- Seçim ve temsil
- Temel hak ve özgürlükler
- Hukuk devleti
- Kuvvetler ayrılığı`,
    kazanimlar: [
      "Türkiye'de çok partili hayata geçişi açıklar",
      "Demokratikleşme sürecindeki kırılma noktalarını bilir",
      "Demokrasinin temel unsurlarını açıklar",
      "Anayasa değişikliklerinin önemini değerlendirir",
    ],
  },
  {
    id: "a66ab79d-aa83-4fee-bdcc-37521053d12d",
    dersIcerigi: `Birleşmiş Milletler (BM) ve insan hakları, uluslararası barış ve güvenliğin temel kurumlarını inceler.

**Birleşmiş Milletler (BM):**
- Kuruluş: 1945, II. Dünya Savaşı sonrası
- Merkez: New York
- Amaçlar: Barış, güvenlik, uluslararası işbirliği
- Ana organlar: Güvenlik Konseyi, Genel Kurul, Sekreterlik, UAD

**BM İnsan Hakları Evrensel Beyannamesi (1948):**
- 30 madde, tüm insanlar için geçerli
- Yaşam hakkı, düşünce özgürlüğü, eğitim hakkı vb.
- Bağlayıcı değil, ahlaki ve siyasi rehber

**Avrupa İnsan Hakları Sözleşmesi (1950):**
- Bağlayıcı nitelikte
- AİHM (Avrupa İnsan Hakları Mahkemesi) denetler

**Türkiye ve İnsan Hakları:**
- 1948 Beyannamesi imzacısı
- AİHM yargı yetkisini kabul etmiştir

**Temel İnsan Hakları Kategorileri:**
- Medeni ve siyasi haklar (kişi dokunulmazlığı, oy hakkı)
- Ekonomik ve sosyal haklar (çalışma, eğitim, sağlık)
- Kültürel haklar (kimlik, dil, inanç)`,
    kazanimlar: [
      "BM'nin kuruluş amacını ve yapısını açıklar",
      "İnsan Hakları Evrensel Beyannamesi'ni tanır",
      "İnsan haklarının kategorilerini bilir",
      "Türkiye'nin uluslararası insan hakları belgelerine katılımını açıklar",
    ],
  },

  // ==================== İNGİLİZCE ====================
  {
    id: "19b01e29-e99d-4dd1-951c-f3536b3ac908",
    dersIcerigi: `English is tested in LGS through reading comprehension, vocabulary, grammar and dialogue completion. Focus on understanding context, making inferences and applying grammar rules in context.`,
    kazanimlar: ["Reads and understands passages", "Uses vocabulary in context", "Applies grammar rules", "Completes dialogues appropriately"],
  },
  {
    id: "90ece106-a99a-4726-bb9b-016c28e0385c",
    dersIcerigi: `Friendship unit covers vocabulary and expressions related to making friends, describing personality traits, and social interactions.

**Key Vocabulary:**
- Personality adjectives: honest, loyal, generous, kind, patient, reliable, cheerful, outgoing, shy, stubborn
- Friendship expressions: get along with, hang out with, have a lot in common, fall out with
- Activities: go shopping, watch movies, play sports, chat online

**Grammar Focus — Present Simple vs Continuous:**
- Present Simple: habits and facts → "She always helps her friends."
- Present Continuous: actions happening now → "They are talking right now."

**Grammar Focus — Expressing Frequency:**
- always (100%), usually (80%), often (60%), sometimes (40%), rarely (20%), never (0%)

**Useful Phrases:**
- "We have a lot in common."
- "I get along well with everyone."
- "She is someone I can count on."
- "We fell out over a misunderstanding."

**LGS Strategy:**
- Read questions before the passage
- Look for synonyms of key words
- Eliminate obviously wrong answers`,
    kazanimlar: [
      "Uses personality adjectives to describe people",
      "Applies present simple and continuous correctly",
      "Understands friendship-themed reading passages",
      "Uses frequency adverbs accurately",
    ],
  },
  {
    id: "858d3804-d940-4d2c-9125-0d765ec9ef10",
    dersIcerigi: `Back to the Future unit focuses on talking about past events, historical inventions and comparing past with present.

**Grammar Focus — Simple Past Tense:**
- Regular: verb + -ed → "worked, played, watched"
- Irregular: go→went, make→made, find→found, buy→bought, write→wrote
- Negative: didn't + base verb
- Question: Did + subject + base verb?

**Grammar Focus — Used to:**
- Past habits no longer true: "People used to travel by horse."
- Negative: "didn't use to"
- Question: "Did you use to...?"

**Key Vocabulary — Inventions:**
- telegraph, telephone, electricity, steam engine, printing press, penicillin
- inventor, invention, discovery, experiment, laboratory

**Useful Phrases:**
- "In the past, people used to..."
- "Back in those days..."
- "Compared to today..."
- "Thanks to this invention..."

**Reading Strategy:**
- Identify timeline words: first, then, after that, finally, eventually
- Look for cause-effect relationships`,
    kazanimlar: [
      "Uses simple past tense for completed actions",
      "Uses 'used to' for past habits",
      "Discusses historical inventions and their impact",
      "Reads and understands historical texts",
    ],
  },
  {
    id: "8b6978f9-4356-4413-b0a8-cd55dc9f6a3b",
    dersIcerigi: `In the Spotlight unit covers topics related to famous people, achievements, and the entertainment world.

**Grammar Focus — Present Perfect:**
- have/has + past participle
- Uses: experiences, recent news, achievements up to now
- "She has won three awards." / "They have never been to Paris."
- Time expressions: ever, never, already, yet, just, recently, since, for

**Grammar Focus — Passive Voice:**
- Subject + to be + past participle
- "The movie was directed by Steven Spielberg."
- Used when action is more important than doer

**Key Vocabulary — Entertainment:**
- celebrity, fame, achievement, award, nomination, performance
- director, producer, screenplay, soundtrack, debut
- journalist, interview, headline, biography

**Useful Phrases:**
- "She has already released her new album."
- "He hasn't been interviewed yet."
- "The movie has just been nominated for an Oscar."

**Reading Tips:**
- Scan for names, dates and specific facts
- Understand the difference between facts and opinions`,
    kazanimlar: [
      "Uses present perfect for experiences and achievements",
      "Forms passive voice sentences",
      "Reads celebrity/entertainment texts",
      "Understands newspaper-style writing",
    ],
  },
  {
    id: "86960832-2a09-4ee4-9629-abe657133698",
    dersIcerigi: `Teen Life unit covers topics related to teenagers' daily routines, hobbies, social media, health and responsibilities.

**Grammar Focus — Modals of Obligation:**
- must / have to: strong obligation → "You must wear a seatbelt."
- should / ought to: advice → "You should exercise regularly."
- mustn't: prohibition → "You mustn't use your phone in class."
- don't have to: no obligation → "You don't have to come early."

**Grammar Focus — Conditional Type 1:**
- If + present simple, will + base verb
- "If you study hard, you will pass the exam."
- Real and possible situations in the future

**Key Vocabulary — Teen Issues:**
- social media, screen time, cyberbullying, peer pressure
- responsibility, independence, discipline, balance
- healthy lifestyle, nutrition, exercise, sleep

**Useful Phrases:**
- "Teenagers these days..."
- "Social media can be both beneficial and harmful."
- "It's important to find a balance."
- "If you spend too much time online, you will..."

**Discussion Topics:**
- Benefits and risks of social media
- Balancing school and hobbies
- Healthy habits for teenagers`,
    kazanimlar: [
      "Uses modal verbs for obligation and advice",
      "Forms Type 1 conditional sentences",
      "Discusses teenage lifestyle and health topics",
      "Reads and responds to teen magazine articles",
    ],
  },

  // ==================== DİN KÜLTÜRÜ ====================
  {
    id: "630d4a84-e104-4bd4-a99a-0a1430bdc64b",
    dersIcerigi: `Din Kültürü ve Ahlak Bilgisi dersi; İslam'ın temel inanç esaslarını, ibadetleri, ahlaki değerleri ve diğer dinleri inceleyerek bireyin manevi gelişimine katkı sağlar. LGS'de kavram tanıma, ayet ve hadis yorumlama, değer analizi soruları yer alır.`,
    kazanimlar: ["İslam'ın temel inanç esaslarını açıklar", "İbadetlerin anlamını yorumlar", "Ahlaki değerleri hayata geçirir", "Diğer dinleri tanır"],
  },
  {
    id: "93e4a95a-3853-464a-8bba-2431223226ef",
    dersIcerigi: `İslam'ın temel ibadetleri; namaz, oruç, zekât, hac ve kelime-i şehadetten oluşan beş şartı kapsar.

**İslam'ın Beş Şartı:**
1. **Kelime-i Şehadet:** Allah'tan başka ilah olmadığını ve Hz. Muhammed'in onun elçisi olduğunu kabul etmek
2. **Namaz:** Günde 5 vakit kılınır; sabah, öğle, ikindi, akşam, yatsı
3. **Oruç:** Ramazan ayında şafaktan güneş batışına kadar yeme-içmeden uzak durmak
4. **Zekât:** Nisab miktarına ulaşan malın 1/40'ını (yüzde 2.5) ihtiyaç sahiplerine vermek
5. **Hac:** Gücü yeten Müslümanların ömründe bir kez Mekke'ye gitmesi

**Namaz:**
- Kılınış şartları: Abdest, kıble, vakit, niyet, örtünme
- Rekât sayıları: Sabah 2, öğle 4, ikindi 4, akşam 3, yatsı 4
- Cuma namazı: Haftalık toplu ibadet

**Oruç:**
- Farz: Ramazan orucu
- Sünnet: Aşure, Şevval orucu
- Orucu bozan ve bozmayan durumlar

**Hac:**
- Usul: İhram giymek, tavaf, sa'y, Arafat vakfesi, kurban
- Veda haccı ve Hz. Muhammed'in hutbesi`,
    kazanimlar: [
      "İslam'ın beş şartını ve özelliklerini açıklar",
      "Namazın kılınış şartlarını bilir",
      "Orucun anlamını ve çeşitlerini açıklar",
      "Hac ibadetinin usulünü açıklar",
      "İbadetlerin bireysel ve toplumsal yararlarını yorumlar",
    ],
  },
  {
    id: "d58725e9-f28c-4dc6-874d-5b336f8af6af",
    dersIcerigi: `Kader inancı; İslam'ın altı iman esasından birini oluşturur ve Allah'ın her şeyi bilmesi, yaratması ve iradesiyle ilgilidir.

**Kader İnancının Tanımı:**
Allah'ın kâinattaki her şeyi ezelden beri bilmesi ve takdir etmesidir.

**Temel Kavramlar:**
- **Kaza:** Allah'ın takdir ettiği şeyin zamanı gelince gerçekleşmesi
- **İlm-i İlahi:** Allah'ın her şeyi ezelden beri bilmesi
- **İrade:** Allah'ın dilemesi; insanın özgür iradesi
- **Levh-i Mahfuz:** Tüm yaratılmış ve yaratılacak olanların yazılı olduğu yer

**İnsan Özgür İradesi:**
- İslam'da insan, seçme özgürlüğüne sahiptir
- Kader ile özgür irade çelişmez
- Allah, insanın yapacağı seçimi bilir ama zorlamaz

**Tevekkül:**
- Çalıştıktan ve önlem aldıktan sonra Allah'a güvenmek
- "Deveni bağla, sonra Allah'a güven" (Hz. Muhammed)

**Kader İnancının Kişiye Katkısı:**
- Sabır ve şükür duygusu geliştirir
- Aşırı üzüntüden korur
- Sorumluluğu ortadan kaldırmaz

**Yanlış Anlaşılmalar:**
- Kader inancı tembelliği meşrulaştırmaz
- Hatayı kadere yüklemek yanlıştır`,
    kazanimlar: [
      "Kader ve kazanın anlamını açıklar",
      "İnsan iradesinin kaderle ilişkisini yorumlar",
      "Tevekkül kavramını açıklar",
      "Kader inancının kişiye katkılarını değerlendirir",
      "Kader hakkındaki yanlış anlaşılmaları düzeltir",
    ],
  },
  {
    id: "48f45f16-a39b-40fa-a976-7f4511045e12",
    dersIcerigi: `Ahlak ve değerler; İslam'ın insani ilişkileri düzenleyen temel prensipleri ile evrensel etik değerleri kapsar.

**İslam Ahlakının Temeli:**
- Kur'an ve Sünnet'te belirlenen ahlaki prensipler
- "Güzel ahlak" (hüsn-ü ahlak) kavramı
- "Komşusu açken tok yatan bizden değildir" (Hadis)

**Temel Ahlaki Değerler:**
- **Dürüstlük (Sıdk):** Söz ve eylemde doğruluk
- **Adalet:** Hak ve hukuka uygun davranış
- **Merhamet:** Başkalarının acısını paylaşma
- **Yardımseverlik:** İhtiyaç sahiplerine destek
- **Sabır:** Zorluklara karşı dayanma gücü
- **Şükür:** Nimetlerin farkında olma ve minnettarlık

**Kötü Ahlak Özellikleri (Kaçınılması Gerekenler):**
- Kibir, haset, yalan, gıybet, iftira, cimrilik

**Evrensel Değerler:**
- İnsan onuruna saygı
- Adaletten taviz vermemek
- Doğa ve çevreye saygı

**Hz. Muhammed'in Ahlakı:**
- "Ben güzel ahlakı tamamlamak için gönderildim." (Hadis)
- Sabır, merhamet, dürüstlük, vefa örnekleri`,
    kazanimlar: [
      "Temel ahlaki değerleri tanımlar ve açıklar",
      "İslam ahlakının kaynaklarını bilir",
      "Ahlaki değerlerin insan ilişkilerine katkısını yorumlar",
      "Kötü ahlak özelliklerini tanır ve bunlardan kaçınmanın yollarını bilir",
      "Hz. Muhammed'in ahlakından örnekler verir",
    ],
  },
  {
    id: "8d1e8f34-b1ee-4abc-9a6d-0f110a0790dc",
    dersIcerigi: `Zekât ve sadaka; Mali ibadetler içinde yer alır ve toplumsal dayanışmayı pekiştirir.

**Zekât:**
- İslam'ın 5 şartından biridir (farz)
- Nisab miktarına ulaşan malın yüzde 2.5'i (1/40)
- Nisab: Yaklaşık 80 gram altın veya eşdeğeri
- Bir yıl (havl) şartı gerekir

**Zekât Verilecek Kişiler (8 Sınıf):**
1. Fakirler
2. Yoksullar (muhtaçlar)
3. Zekât toplayıcıları
4. Kalpleri İslam'a ısındırılacaklar
5. Kölelikten kurtarılacaklar
6. Borçlular
7. Allah yolundakiler
8. Yolda kalmışlar

**Sadaka:**
- Gönüllü ve isteğe bağlı hayır
- Miktar sınırlaması yoktur
- "Gülümsemek bile sadakadır." (Hadis)
- Sadaka-ı cariye: Kalıcı hayır (kuyar, cami, kitap)

**Fitre (Sadaka-ı Fıtr):**
- Ramazan bayramı öncesi verilir
- Her Müslüman için ayrı ayrı hesaplanır
- Yaklaşık 2.5 kg gıda maddesi değerinde

**Zekâtın Toplumsal Faydaları:**
- Servet adaletsizliğini azaltır
- Sosyal yardımlaşmayı güçlendirir
- Ekonomik dengeyi sağlar`,
    kazanimlar: [
      "Zekâtın farz olma şartlarını açıklar",
      "Zekâtın verileceği kişi sınıflarını sıralar",
      "Sadaka çeşitlerini açıklar",
      "Fitrenin zamanını ve miktarını bilir",
      "Zekât ve sadakanın toplumsal yararlarını değerlendirir",
    ],
  },
];

async function main() {
  console.log("🚀 İçerik yükleme başlıyor...\n");
  let basarili = 0;
  let basarisiz = 0;

  for (const konu of KONULAR) {
    try {
      await prisma.topic.update({
        where: { id: konu.id },
        data: {
          dersIcerigi: konu.dersIcerigi,
          kazanimlar: konu.kazanimlar,
        },
      });
      console.log(`✅ ${konu.id.slice(0, 8)} güncellendi`);
      basarili++;
    } catch (e) {
      console.error(`❌ ${konu.id.slice(0, 8)} HATA:`, e.message);
      basarisiz++;
    }
  }

  console.log(`\n📊 Sonuç: ${basarili} başarılı, ${basarisiz} başarısız`);
  console.log(`   Toplam: ${KONULAR.length} konu işlendi`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
