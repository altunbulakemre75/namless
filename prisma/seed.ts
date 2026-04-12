import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed basladi...");

  // ==================== MATEMATIK ====================
  const mat = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Matematik",
      kazanimlar: [],
      onkosuller: [],
    },
  });

  const matSayilar = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Sayılar ve İşlemler",
      parentId: mat.id,
      kazanimlar: [],
      onkosuller: [],
    },
  });

  const matCebirsel = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Cebirsel İfadeler ve Özdeşlikler",
      parentId: mat.id,
      kazanimlar: [],
      onkosuller: [],
    },
  });

  const carpanlar = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Çarpanlar ve Katlar",
      parentId: matSayilar.id,
      kazanimlar: ["M.8.1.1.1", "M.8.1.1.2"],
      onkosuller: [],
      tarihselAgirlik: 3,
    },
  });

  const usluSayilar = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Üslü İfadeler",
      parentId: matSayilar.id,
      kazanimlar: ["M.8.1.2.1", "M.8.1.2.2", "M.8.1.2.3"],
      onkosuller: [],
      tarihselAgirlik: 4,
    },
  });

  const karekoklu = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Kareköklü İfadeler",
      parentId: matSayilar.id,
      kazanimlar: ["M.8.1.3.1", "M.8.1.3.2", "M.8.1.3.3"],
      onkosuller: [usluSayilar.id],
      tarihselAgirlik: 3,
    },
  });

  const ozdesliker = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Özdeşlikler",
      parentId: matCebirsel.id,
      kazanimlar: ["M.8.2.1.1"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  const carpanlara = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Çarpanlara Ayırma",
      parentId: matCebirsel.id,
      kazanimlar: ["M.8.2.2.1"],
      onkosuller: [ozdesliker.id],
      tarihselAgirlik: 3,
    },
  });

  const matDenklemler = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Denklemler ve Eşitsizlikler",
      parentId: mat.id,
      kazanimlar: [],
      onkosuller: [],
    },
  });

  const dogrusalDenklem = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Doğrusal Denklemler",
      parentId: matDenklemler.id,
      kazanimlar: ["M.8.3.1.1", "M.8.3.1.2"],
      onkosuller: [carpanlara.id],
      tarihselAgirlik: 3,
    },
  });

  const esitsizlikler = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Eşitsizlikler",
      parentId: matDenklemler.id,
      kazanimlar: ["M.8.3.2.1"],
      onkosuller: [dogrusalDenklem.id],
      tarihselAgirlik: 2,
    },
  });

  const matOlasilik = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Olasılık",
      parentId: mat.id,
      kazanimlar: ["M.8.5.1.1", "M.8.5.1.2"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  const ucgenler = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Üçgenler",
      parentId: mat.id,
      kazanimlar: ["M.8.4.1.1", "M.8.4.1.2"],
      onkosuller: [],
      tarihselAgirlik: 4,
    },
  });

  const donusum = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Dönüşüm Geometrisi",
      parentId: mat.id,
      kazanimlar: ["M.8.4.2.1"],
      onkosuller: [ucgenler.id],
      tarihselAgirlik: 2,
    },
  });

  // ==================== FEN BİLİMLERİ ====================
  const fen = await prisma.topic.create({
    data: {
      ders: "FEN",
      isim: "Fen Bilimleri",
      kazanimlar: [],
      onkosuller: [],
    },
  });

  const mevsimler = await prisma.topic.create({
    data: {
      ders: "FEN",
      isim: "Mevsimler ve İklim",
      parentId: fen.id,
      kazanimlar: ["F.8.1.1.1", "F.8.1.1.2"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  const dnaGenetik = await prisma.topic.create({
    data: {
      ders: "FEN",
      isim: "DNA ve Genetik Kod",
      parentId: fen.id,
      kazanimlar: ["F.8.2.1.1", "F.8.2.1.2"],
      onkosuller: [],
      tarihselAgirlik: 3,
    },
  });

  const basinc = await prisma.topic.create({
    data: {
      ders: "FEN",
      isim: "Basınç",
      parentId: fen.id,
      kazanimlar: ["F.8.3.1.1", "F.8.3.1.2"],
      onkosuller: [],
      tarihselAgirlik: 3,
    },
  });

  const maddeHalleri = await prisma.topic.create({
    data: {
      ders: "FEN",
      isim: "Maddenin Halleri ve Isı",
      parentId: fen.id,
      kazanimlar: ["F.8.4.1.1"],
      onkosuller: [basinc.id],
      tarihselAgirlik: 2,
    },
  });

  const elektrik = await prisma.topic.create({
    data: {
      ders: "FEN",
      isim: "Elektrik Yükleri ve Elektrik Enerjisi",
      parentId: fen.id,
      kazanimlar: ["F.8.5.1.1", "F.8.5.1.2"],
      onkosuller: [],
      tarihselAgirlik: 3,
    },
  });

  const asitBaz = await prisma.topic.create({
    data: {
      ders: "FEN",
      isim: "Asitler ve Bazlar",
      parentId: fen.id,
      kazanimlar: ["F.8.4.2.1"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  // ==================== TÜRKÇE ====================
  const turkce = await prisma.topic.create({
    data: {
      ders: "TURKCE",
      isim: "Türkçe",
      kazanimlar: [],
      onkosuller: [],
    },
  });

  const sozcukAnlam = await prisma.topic.create({
    data: {
      ders: "TURKCE",
      isim: "Sözcükte Anlam",
      parentId: turkce.id,
      kazanimlar: ["T.8.3.1"],
      onkosuller: [],
      tarihselAgirlik: 4,
    },
  });

  const cumleBilgisi = await prisma.topic.create({
    data: {
      ders: "TURKCE",
      isim: "Cümle Bilgisi",
      parentId: turkce.id,
      kazanimlar: ["T.8.3.5"],
      onkosuller: [],
      tarihselAgirlik: 3,
    },
  });

  const paragraf = await prisma.topic.create({
    data: {
      ders: "TURKCE",
      isim: "Paragraf",
      parentId: turkce.id,
      kazanimlar: ["T.8.3.8", "T.8.3.9"],
      onkosuller: [sozcukAnlam.id, cumleBilgisi.id],
      tarihselAgirlik: 5,
    },
  });

  const yazimKurallari = await prisma.topic.create({
    data: {
      ders: "TURKCE",
      isim: "Yazım Kuralları",
      parentId: turkce.id,
      kazanimlar: ["T.8.4.1"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  const noktalama = await prisma.topic.create({
    data: {
      ders: "TURKCE",
      isim: "Noktalama İşaretleri",
      parentId: turkce.id,
      kazanimlar: ["T.8.4.2"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  // ==================== SOSYAL BİLGİLER ====================
  const sosyal = await prisma.topic.create({
    data: {
      ders: "SOSYAL",
      isim: "T.C. İnkılap Tarihi ve Atatürkçülük",
      kazanimlar: [],
      onkosuller: [],
    },
  });

  const kurtulusSavasi = await prisma.topic.create({
    data: {
      ders: "SOSYAL",
      isim: "Kurtuluş Savaşı",
      parentId: sosyal.id,
      kazanimlar: ["SB.8.1.1", "SB.8.1.2"],
      onkosuller: [],
      tarihselAgirlik: 4,
    },
  });

  const ataturkInkilaplari = await prisma.topic.create({
    data: {
      ders: "SOSYAL",
      isim: "Atatürk İnkılapları",
      parentId: sosyal.id,
      kazanimlar: ["SB.8.2.1", "SB.8.2.2"],
      onkosuller: [kurtulusSavasi.id],
      tarihselAgirlik: 5,
    },
  });

  const demokratiklesme = await prisma.topic.create({
    data: {
      ders: "SOSYAL",
      isim: "Demokratikleşme Süreci",
      parentId: sosyal.id,
      kazanimlar: ["SB.8.3.1"],
      onkosuller: [ataturkInkilaplari.id],
      tarihselAgirlik: 3,
    },
  });

  // ==================== İNGİLİZCE ====================
  const ingilizce = await prisma.topic.create({
    data: {
      ders: "INGILIZCE",
      isim: "İngilizce",
      kazanimlar: [],
      onkosuller: [],
    },
  });

  const friendship = await prisma.topic.create({
    data: {
      ders: "INGILIZCE",
      isim: "Friendship",
      parentId: ingilizce.id,
      kazanimlar: ["E.8.1.1"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  const teenLife = await prisma.topic.create({
    data: {
      ders: "INGILIZCE",
      isim: "Teen Life",
      parentId: ingilizce.id,
      kazanimlar: ["E.8.2.1"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  // ==================== DİN KÜLTÜRÜ ====================
  const din = await prisma.topic.create({
    data: {
      ders: "DIN",
      isim: "Din Kültürü ve Ahlak Bilgisi",
      kazanimlar: [],
      onkosuller: [],
    },
  });

  const kaderInanc = await prisma.topic.create({
    data: {
      ders: "DIN",
      isim: "Kader İnancı",
      parentId: din.id,
      kazanimlar: ["D.8.1.1"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  const zekat = await prisma.topic.create({
    data: {
      ders: "DIN",
      isim: "Zekât ve Sadaka",
      parentId: din.id,
      kazanimlar: ["D.8.2.1"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  // ==================== ÖRNEK SORULAR ====================
  console.log("📝 Örnek sorular ekleniyor...");

  // Matematik - Üslü İfadeler
  await prisma.question.create({
    data: {
      topicId: usluSayilar.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 2,
      soruMetni: "2^3 × 2^4 işleminin sonucu kaçtır?",
      siklar: ["64", "128", "256", "512"],
      dogruSik: 1,
      aciklama:
        "Tabanları aynı olan üslü sayıların çarpımında üsler toplanır: 2^3 × 2^4 = 2^(3+4) = 2^7 = 128",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: usluSayilar.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 1,
      soruMetni: "3^0 + 5^1 ifadesinin değeri kaçtır?",
      siklar: ["5", "6", "8", "15"],
      dogruSik: 1,
      aciklama:
        "Herhangi bir sayının 0. kuvveti 1'dir. 3^0 = 1, 5^1 = 5. Toplam: 1 + 5 = 6",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: usluSayilar.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 3,
      soruMetni:
        "(2^5 × 4^3) / 8^2 işleminin sonucu kaçtır?",
      siklar: ["8", "16", "32", "64"],
      dogruSik: 2,
      aciklama:
        "4 = 2^2, 8 = 2^3 olduğundan: (2^5 × 2^6) / 2^6 = 2^(5+6-6) = 2^5 = 32",
      validationStatus: "PUBLISHED",
    },
  });

  // Matematik - Kareköklü İfadeler
  await prisma.question.create({
    data: {
      topicId: karekoklu.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 2,
      soruMetni: "√50 ifadesinin sadeleştirilmiş hali aşağıdakilerden hangisidir?",
      siklar: ["5√2", "2√5", "25√2", "10√5"],
      dogruSik: 0,
      aciklama: "√50 = √(25×2) = √25 × √2 = 5√2",
      validationStatus: "PUBLISHED",
    },
  });

  // Matematik - Olasılık
  await prisma.question.create({
    data: {
      topicId: matOlasilik.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni:
        "Bir zar atıldığında üst yüzüne 3'ten büyük bir sayı gelme olasılığı kaçtır?",
      siklar: ["1/6", "1/3", "1/2", "2/3"],
      dogruSik: 2,
      aciklama:
        "3'ten büyük sayılar: 4, 5, 6 → 3 tane. Toplam: 6. Olasılık: 3/6 = 1/2",
      validationStatus: "PUBLISHED",
    },
  });

  // Fen - Basınç
  await prisma.question.create({
    data: {
      topicId: basinc.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 2,
      soruMetni:
        "Aynı kuvvet uygulandığında aşağıdakilerden hangisinde basınç en büyüktür?",
      siklar: [
        "Geniş tabanlı kutu",
        "İğne ucu",
        "Kitap kapağı",
        "Masa yüzeyi",
      ],
      dogruSik: 1,
      aciklama:
        "Basınç = Kuvvet / Alan. Aynı kuvvette alan küçüldükçe basınç artar. İğne ucu en küçük alana sahiptir.",
      validationStatus: "PUBLISHED",
    },
  });

  // Fen - DNA
  await prisma.question.create({
    data: {
      topicId: dnaGenetik.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 2,
      soruMetni:
        "DNA'nın yapısında aşağıdaki bazlardan hangisi bulunmaz?",
      siklar: ["Adenin", "Guanin", "Urasil", "Timin"],
      dogruSik: 2,
      aciklama:
        "DNA'da Adenin (A), Timin (T), Guanin (G), Sitozin (C) bulunur. Urasil (U) RNA'ya özgüdür.",
      validationStatus: "PUBLISHED",
    },
  });

  // Türkçe - Sözcükte Anlam
  await prisma.question.create({
    data: {
      topicId: sozcukAnlam.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 2,
      soruMetni:
        '"Çocuk sınavda çok parlak bir başarı gösterdi." cümlesinde altı çizili sözcük hangi anlamda kullanılmıştır?',
      siklar: [
        "Gerçek anlam",
        "Mecaz anlam",
        "Terim anlam",
        "Deyim",
      ],
      dogruSik: 1,
      aciklama:
        "'Parlak' sözcüğü gerçek anlamı 'ışık yansıtan' iken burada 'üstün, göz alıcı' mecaz anlamında kullanılmıştır.",
      validationStatus: "PUBLISHED",
    },
  });

  // Türkçe - Paragraf
  await prisma.question.create({
    data: {
      topicId: paragraf.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 3,
      soruMetni:
        "Bir paragrafın ana düşüncesini bulmak için aşağıdakilerden hangisi yapılmalıdır?",
      siklar: [
        "İlk cümle okunmalıdır",
        "Son cümle okunmalıdır",
        "Tüm cümleler okunup ortak mesaj çıkarılmalıdır",
        "Başlığa bakılmalıdır",
      ],
      dogruSik: 2,
      aciklama:
        "Ana düşünce, paragrafın tamamını kapsayan genel yargıdır. Tek bir cümleden değil, tüm cümlelerin ortak mesajından çıkarılır.",
      validationStatus: "PUBLISHED",
    },
  });

  // Sosyal - Kurtuluş Savaşı
  await prisma.question.create({
    data: {
      topicId: kurtulusSavasi.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 2,
      soruMetni:
        "Amasya Genelgesi'nin Kurtuluş Savaşı açısından en önemli özelliği aşağıdakilerden hangisidir?",
      siklar: [
        "İlk kez manda ve himaye reddedilmiştir",
        "Vatanın bütünlüğü ve milletin bağımsızlığı tehlikededir ifadesi kullanılmıştır",
        "Misak-ı Milli kabul edilmiştir",
        "Düzenli ordu kurulmuştur",
      ],
      dogruSik: 1,
      aciklama:
        "Amasya Genelgesi (22 Haziran 1919), Kurtuluş Savaşı'nın gerekçe belgesidir. 'Vatanın bütünlüğü, milletin bağımsızlığı tehlikededir' ifadesi ilk kez burada kullanılmıştır.",
      validationStatus: "PUBLISHED",
    },
  });

  // Fen - Elektrik
  await prisma.question.create({
    data: {
      topicId: elektrik.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 1,
      soruMetni:
        "Aşağıdakilerden hangisi elektrik akımını ileten maddelerdendir?",
      siklar: ["Plastik", "Cam", "Bakır", "Tahta"],
      dogruSik: 2,
      aciklama:
        "Bakır bir metaldir ve metaller elektrik akımını iyi iletir. Plastik, cam ve tahta yalıtkandır.",
      validationStatus: "PUBLISHED",
    },
  });

  // Matematik - Üçgenler
  await prisma.question.create({
    data: {
      topicId: ucgenler.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 2,
      soruMetni:
        "Bir üçgenin iç açıları toplamı kaç derecedir?",
      siklar: ["90°", "180°", "270°", "360°"],
      dogruSik: 1,
      aciklama: "Her üçgenin iç açıları toplamı 180 derecedir. Bu temel bir geometri kuralıdır.",
      validationStatus: "PUBLISHED",
    },
  });

  const topicCount = await prisma.topic.count();
  const questionCount = await prisma.question.count();
  console.log(`✅ Seed tamamlandi: ${topicCount} konu, ${questionCount} soru`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
