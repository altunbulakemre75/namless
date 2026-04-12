import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed basladi...");

  // ==================== MATEMATİK ====================
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
      videoUrl: "https://www.youtube.com/watch?v=example_carpanlar",
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
      videoUrl: "https://www.youtube.com/watch?v=7B_A3aN2Kqw",
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
      videoUrl: "https://www.youtube.com/watch?v=example_karekok",
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
      videoUrl: "https://www.youtube.com/watch?v=example_denklem",
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
      videoUrl: "https://www.youtube.com/watch?v=example_olasilik",
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
      videoUrl: "https://www.youtube.com/watch?v=example_ucgen",
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

  const veriAnaliz = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Veri Analizi",
      parentId: mat.id,
      kazanimlar: ["M.8.5.2.1", "M.8.5.2.2"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  const piramitKoni = await prisma.topic.create({
    data: {
      ders: "MATEMATIK",
      isim: "Piramit, Koni ve Küre",
      parentId: mat.id,
      kazanimlar: ["M.8.4.3.1", "M.8.4.3.2"],
      onkosuller: [ucgenler.id],
      tarihselAgirlik: 3,
      videoUrl: "https://www.youtube.com/watch?v=example_piramit",
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
      videoUrl: "https://www.youtube.com/watch?v=example_dna",
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
      videoUrl: "https://www.youtube.com/watch?v=example_basinc",
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
      videoUrl: "https://www.youtube.com/watch?v=example_elektrik",
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

  const kimyasalTepkimeler = await prisma.topic.create({
    data: {
      ders: "FEN",
      isim: "Kimyasal Tepkimeler",
      parentId: fen.id,
      kazanimlar: ["F.8.4.3.1", "F.8.4.3.2"],
      onkosuller: [asitBaz.id],
      tarihselAgirlik: 2,
      videoUrl: "https://www.youtube.com/watch?v=example_kimyasal",
    },
  });

  const kuvvetHareket = await prisma.topic.create({
    data: {
      ders: "FEN",
      isim: "Kuvvet ve Hareket",
      parentId: fen.id,
      kazanimlar: ["F.8.3.2.1", "F.8.3.2.2"],
      onkosuller: [],
      tarihselAgirlik: 3,
    },
  });

  const optik = await prisma.topic.create({
    data: {
      ders: "FEN",
      isim: "Aydınlatma ve Ses",
      parentId: fen.id,
      kazanimlar: ["F.8.6.1.1", "F.8.6.1.2"],
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

  const sozVarikligi = await prisma.topic.create({
    data: {
      ders: "TURKCE",
      isim: "Söz Varlığı",
      parentId: turkce.id,
      kazanimlar: ["T.8.3.2", "T.8.3.3"],
      onkosuller: [sozcukAnlam.id],
      tarihselAgirlik: 3,
    },
  });

  const metin = await prisma.topic.create({
    data: {
      ders: "TURKCE",
      isim: "Metin Türleri",
      parentId: turkce.id,
      kazanimlar: ["T.8.1.1", "T.8.1.2"],
      onkosuller: [],
      tarihselAgirlik: 3,
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
      videoUrl: "https://www.youtube.com/watch?v=example_kurtulus",
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
      videoUrl: "https://www.youtube.com/watch?v=example_inkilaplar",
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

  const birlesmisMilletler = await prisma.topic.create({
    data: {
      ders: "SOSYAL",
      isim: "Birleşmiş Milletler ve İnsan Hakları",
      parentId: sosyal.id,
      kazanimlar: ["SB.8.4.1", "SB.8.4.2"],
      onkosuller: [demokratiklesme.id],
      tarihselAgirlik: 2,
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

  const inChallenge = await prisma.topic.create({
    data: {
      ders: "INGILIZCE",
      isim: "In the Spotlight",
      parentId: ingilizce.id,
      kazanimlar: ["E.8.3.1"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  const science = await prisma.topic.create({
    data: {
      ders: "INGILIZCE",
      isim: "Back to the Future",
      parentId: ingilizce.id,
      kazanimlar: ["E.8.4.1"],
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

  const islamahlak = await prisma.topic.create({
    data: {
      ders: "DIN",
      isim: "İslam'ın Temel İbadetleri",
      parentId: din.id,
      kazanimlar: ["D.8.3.1", "D.8.3.2"],
      onkosuller: [],
      tarihselAgirlik: 3,
    },
  });

  const ahlakDegerleri = await prisma.topic.create({
    data: {
      ders: "DIN",
      isim: "Ahlak ve Değerler",
      parentId: din.id,
      kazanimlar: ["D.8.4.1"],
      onkosuller: [],
      tarihselAgirlik: 2,
    },
  });

  // ==================== ÖRNEK SORULAR ====================
  console.log("Ornek sorular ekleniyor...");

  // ===== MATEMATİK - Üslü İfadeler (3 soru) =====
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

  await prisma.question.create({
    data: {
      topicId: usluSayilar.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni: "(-3)^4 işleminin sonucu kaçtır?",
      siklar: ["-81", "81", "-12", "12"],
      dogruSik: 1,
      aciklama:
        "Negatif sayının çift kuvveti pozitiftir. (-3)^4 = (-3)×(-3)×(-3)×(-3) = 81",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: usluSayilar.id,
      kaynak: "AI_URETIM",
      zorluk: 3,
      soruMetni:
        "a^3 × a^(-2) ifadesini sadeleştirince sonuç nedir? (a ≠ 0)",
      siklar: ["a^(-6)", "a^5", "a", "a^(-1)"],
      dogruSik: 2,
      aciklama:
        "Tabanlar eşit olduğunda üsler toplanır: a^3 × a^(-2) = a^(3+(-2)) = a^1 = a",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== MATEMATİK - Kareköklü İfadeler (4 soru) =====
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

  await prisma.question.create({
    data: {
      topicId: karekoklu.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni: "3√2 + 5√2 işleminin sonucu kaçtır?",
      siklar: ["8√4", "8√2", "15√2", "8√2"],
      dogruSik: 1,
      aciklama:
        "Kareköklü ifadelerde aynı kökler toplanır: 3√2 + 5√2 = (3+5)√2 = 8√2",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: karekoklu.id,
      kaynak: "AI_URETIM",
      zorluk: 3,
      soruMetni: "√12 × √3 işleminin sonucu kaçtır?",
      siklar: ["3", "6", "9", "√36"],
      dogruSik: 1,
      aciklama:
        "√12 × √3 = √(12×3) = √36 = 6",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: karekoklu.id,
      kaynak: "AI_URETIM",
      zorluk: 1,
      soruMetni: "√81 - √16 işleminin sonucu kaçtır?",
      siklar: ["5", "√65", "13", "65"],
      dogruSik: 0,
      aciklama: "√81 = 9 ve √16 = 4. Fark: 9 - 4 = 5",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== MATEMATİK - Çarpanlar ve Katlar (3 soru) =====
  await prisma.question.create({
    data: {
      topicId: carpanlar.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 1,
      soruMetni: "12 sayısının asal çarpanlarına ayrılmış hali hangisidir?",
      siklar: ["2 × 6", "2^2 × 3", "4 × 3", "2 × 2 × 2"],
      dogruSik: 1,
      aciklama: "12 = 2 × 6 = 2 × 2 × 3 = 2^2 × 3. Asal çarpan ayrışımı budur.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: carpanlar.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni: "EBOB(24, 36) kaçtır?",
      siklar: ["6", "8", "12", "18"],
      dogruSik: 2,
      aciklama:
        "24 = 2^3 × 3 ve 36 = 2^2 × 3^2. EBOB = 2^2 × 3 = 12",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: carpanlar.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni: "EKOK(8, 12) kaçtır?",
      siklar: ["4", "24", "48", "96"],
      dogruSik: 1,
      aciklama:
        "8 = 2^3 ve 12 = 2^2 × 3. EKOK = 2^3 × 3 = 24",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== MATEMATİK - Olasılık (4 soru) =====
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

  await prisma.question.create({
    data: {
      topicId: matOlasilik.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "İçinde 3 kırmızı, 5 mavi top bulunan bir torbadan rastgele bir top çekildiğinde mavi gelme olasılığı kaçtır?",
      siklar: ["3/8", "5/8", "3/5", "1/2"],
      dogruSik: 1,
      aciklama:
        "Toplam top: 3 + 5 = 8. Mavi gelme olasılığı: 5/8",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: matOlasilik.id,
      kaynak: "CIKMIS",
      kaynakYili: 2022,
      zorluk: 3,
      soruMetni:
        "1'den 20'ye kadar yazılmış sayılardan birisi rastgele seçildiğinde 3'ün katı gelme olasılığı kaçtır?",
      siklar: ["1/4", "1/3", "3/10", "3/20"],
      dogruSik: 3,
      aciklama:
        "1-20 arasında 3'ün katları: 3,6,9,12,15,18 → 6 tane. Olasılık: 6/20 = 3/10",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: matOlasilik.id,
      kaynak: "AI_URETIM",
      zorluk: 1,
      soruMetni:
        "Adil bir madeni para atıldığında yazı gelme olasılığı kaçtır?",
      siklar: ["1/4", "1/3", "1/2", "2/3"],
      dogruSik: 2,
      aciklama:
        "Madeni paranın iki yüzü vardır: tura ve yazı. Yazı gelme olasılığı: 1/2",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== MATEMATİK - Üçgenler (4 soru) =====
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

  await prisma.question.create({
    data: {
      topicId: ucgenler.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Dik üçgende kısa kenara a = 3, b = 4 ise hipotenüs kaç birimdir?",
      siklar: ["5", "6", "7", "12"],
      dogruSik: 0,
      aciklama:
        "Pisagor teoremi: c^2 = a^2 + b^2 = 9 + 16 = 25, c = 5",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: ucgenler.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 3,
      soruMetni:
        "Bir ikizkenar üçgenin taban açıları 50° ise tepe açısı kaç derecedir?",
      siklar: ["50°", "70°", "80°", "100°"],
      dogruSik: 2,
      aciklama:
        "Taban açıları toplamı: 50 + 50 = 100°. Tepe açısı: 180 - 100 = 80°",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: ucgenler.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Taban 6 cm ve yükseklik 4 cm olan üçgenin alanı kaç cm²'dir?",
      siklar: ["10", "12", "24", "48"],
      dogruSik: 1,
      aciklama:
        "Üçgen alanı = (taban × yükseklik) / 2 = (6 × 4) / 2 = 12 cm²",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== MATEMATİK - Doğrusal Denklemler (3 soru) =====
  await prisma.question.create({
    data: {
      topicId: dogrusalDenklem.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni: "2x + 5 = 13 denklemini çözünüz.",
      siklar: ["x = 3", "x = 4", "x = 5", "x = 9"],
      dogruSik: 1,
      aciklama:
        "2x = 13 - 5 = 8. x = 8/2 = 4",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: dogrusalDenklem.id,
      kaynak: "AI_URETIM",
      zorluk: 3,
      soruMetni:
        "3(x - 2) = 2x + 1 denkleminin çözüm kümesi nedir?",
      siklar: ["x = 5", "x = 7", "x = -5", "x = 1"],
      dogruSik: 1,
      aciklama:
        "3x - 6 = 2x + 1 → 3x - 2x = 1 + 6 → x = 7",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: dogrusalDenklem.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Bir sayının 3 fazlası 15'e eşittir. Bu sayı kaçtır?",
      siklar: ["10", "11", "12", "13"],
      dogruSik: 2,
      aciklama:
        "x + 3 = 15 → x = 15 - 3 = 12",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== MATEMATİK - Piramit, Koni ve Küre (2 soru) =====
  await prisma.question.create({
    data: {
      topicId: piramitKoni.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 2,
      soruMetni:
        "Yarıçapı 6 cm olan kürenin hacmi kaç cm³'tür? (π = 3 alınız)",
      siklar: ["72", "144", "216", "864"],
      dogruSik: 3,
      aciklama:
        "Küre hacmi = (4/3)πr³ = (4/3) × 3 × 6³ = 4 × 216 = 864 cm³",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: piramitKoni.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Taban yarıçapı 3 cm, yüksekliği 7 cm olan koninin hacmi kaç cm³'tür? (π = 3 alınız)",
      siklar: ["21", "63", "126", "189"],
      dogruSik: 1,
      aciklama:
        "Koni hacmi = (1/3)πr²h = (1/3) × 3 × 9 × 7 = 63 cm³",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== FEN - Basınç (4 soru) =====
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

  await prisma.question.create({
    data: {
      topicId: basinc.id,
      kaynak: "CIKMIS",
      kaynakYili: 2022,
      zorluk: 3,
      soruMetni:
        "10 N'luk kuvvetin 2 m² yüzeye uygulandığı basınç kaç Pa'dır?",
      siklar: ["2 Pa", "5 Pa", "20 Pa", "50 Pa"],
      dogruSik: 1,
      aciklama:
        "Basınç = Kuvvet / Alan = 10 N / 2 m² = 5 Pa",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: basinc.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Sıvı basıncı hangi faktöre bağlı değildir?",
      siklar: [
        "Sıvının yoğunluğuna",
        "Sıvının derinliğine",
        "Sıvının miktarına",
        "Yerçekimi ivmesine",
      ],
      dogruSik: 2,
      aciklama:
        "Sıvı basıncı P = ρgh formülü ile hesaplanır. Sıvının miktarı (hacmi) bu formülde yer almaz.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: basinc.id,
      kaynak: "AI_URETIM",
      zorluk: 1,
      soruMetni:
        "Gemilerin su üzerinde yüzmesini sağlayan kuvvet aşağıdakilerden hangisidir?",
      siklar: ["Ağırlık", "Sürtünme kuvveti", "Kaldırma kuvveti", "Manyetik kuvvet"],
      dogruSik: 2,
      aciklama:
        "Arşimet prensibine göre sıvıya daldırılan cisimlere uygulanan yukarı yönlü kaldırma kuvveti, gemiyi su üzerinde tutar.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== FEN - DNA ve Genetik (4 soru) =====
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

  await prisma.question.create({
    data: {
      topicId: dnaGenetik.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni:
        "Kalıtsal bilgiyi taşıyan ve hücre çekirdeğinde bulunan yapı aşağıdakilerden hangisidir?",
      siklar: ["Ribozom", "Mitokondri", "DNA", "Hücre zarı"],
      dogruSik: 2,
      aciklama:
        "DNA (Deoksiribonükleik asit) kalıtsal bilgiyi taşır ve ökaryot hücrelerde çekirdekte bulunur.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: dnaGenetik.id,
      kaynak: "AI_URETIM",
      zorluk: 3,
      soruMetni:
        "Aşağıdakilerden hangisi DNA'nın özelliklerinden biri değildir?",
      siklar: [
        "Çift sarmal yapıdadır",
        "Hücre bölünmesi sırasında eşlenir",
        "Sadece hücre zarında bulunur",
        "Adenin-Timin ve Guanin-Sitozin baz eşleşmesi yapar",
      ],
      dogruSik: 2,
      aciklama:
        "DNA çekirdekte ve mitokondride bulunur, hücre zarında bulunmaz.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: dnaGenetik.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Bireyin anne ve babasından aldığı kalıtsal birimlere ne ad verilir?",
      siklar: ["Hücre", "Gen", "Kromatin", "Ribozom"],
      dogruSik: 1,
      aciklama:
        "Gen, DNA üzerinde yer alan ve kalıtsal özellikleri belirleyen temel birimidir.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== FEN - Elektrik (4 soru) =====
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

  await prisma.question.create({
    data: {
      topicId: elektrik.id,
      kaynak: "CIKMIS",
      kaynakYili: 2022,
      zorluk: 2,
      soruMetni:
        "Ohm kanununa göre direnç sabitken akım arttığında gerilim nasıl değişir?",
      siklar: [
        "Azalır",
        "Değişmez",
        "Artar",
        "Önce artar sonra azalır",
      ],
      dogruSik: 2,
      aciklama:
        "Ohm Kanunu: V = I × R. Direnç sabit olduğunda gerilim, akımla doğru orantılıdır.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: elektrik.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Elektrik akımının birimi aşağıdakilerden hangisidir?",
      siklar: ["Volt (V)", "Amper (A)", "Ohm (Ω)", "Watt (W)"],
      dogruSik: 1,
      aciklama:
        "Elektrik akımı Amper (A) ile ölçülür. Volt gerilim, Ohm direnç, Watt güç birimi.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: elektrik.id,
      kaynak: "AI_URETIM",
      zorluk: 3,
      soruMetni:
        "Seri bağlı iki direnç için hangisi doğrudur?",
      siklar: [
        "Üzerlerinden geçen akımlar farklıdır",
        "Eşdeğer direnç her bir dirençten küçüktür",
        "Üzerlerindeki gerilimler eşittir",
        "Eşdeğer direnç dirençlerin toplamına eşittir",
      ],
      dogruSik: 3,
      aciklama:
        "Seri bağlı devrede akım aynı, eşdeğer direnç R = R1 + R2 şeklinde hesaplanır.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== FEN - Asitler ve Bazlar (3 soru) =====
  await prisma.question.create({
    data: {
      topicId: asitBaz.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni:
        "pH değeri 7'den küçük olan maddeler için aşağıdakilerden hangisi doğrudur?",
      siklar: [
        "Bazik özellik gösterir",
        "Nötr özellik gösterir",
        "Asit özellik gösterir",
        "Tuz özellik gösterir",
      ],
      dogruSik: 2,
      aciklama:
        "pH < 7 ise madde asidik, pH = 7 ise nötr, pH > 7 ise bazik özellik gösterir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: asitBaz.id,
      kaynak: "AI_URETIM",
      zorluk: 1,
      soruMetni:
        "Aşağıdaki maddelerden hangisi bir asittir?",
      siklar: ["Sabun", "Limon suyu", "Çamaşır suyu", "Yumurta akı"],
      dogruSik: 1,
      aciklama:
        "Limon suyu sitrik asit içerdiği için asidiktir (pH < 7). Sabun ve çamaşır suyu baziktir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: asitBaz.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Bir asit ile bir baz tepkimeye girdiğinde oluşan ürünler nelerdir?",
      siklar: [
        "Asit + Baz",
        "Tuz + Su",
        "Sadece tuz",
        "Sadece su",
      ],
      dogruSik: 1,
      aciklama:
        "Nötrleşme tepkimesi: Asit + Baz → Tuz + Su. Bu, temel kimya kuralıdır.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== FEN - Kuvvet ve Hareket (3 soru) =====
  await prisma.question.create({
    data: {
      topicId: kuvvetHareket.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni:
        "Newton'un I. Hareket Yasası'na göre aşağıdakilerden hangisi doğrudur?",
      siklar: [
        "Kuvvet uygulanmayan cisim durur",
        "Cisimler her zaman ivme kazanır",
        "Net kuvvet sıfırsa cisim hareketini değiştirmez",
        "Ağır cisimler daha çok ivme kazanır",
      ],
      dogruSik: 2,
      aciklama:
        "Eylemsizlik yasası: Üzerine net kuvvet etki etmeyen bir cisim duruyorsa durmaya, hareket ediyorsa aynı hızla hareket etmeye devam eder.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: kuvvetHareket.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "F = 20 N ve m = 4 kg için ivme kaç m/s²'dir?",
      siklar: ["2 m/s²", "5 m/s²", "16 m/s²", "80 m/s²"],
      dogruSik: 1,
      aciklama:
        "Newton'un II. Yasası: F = m × a → a = F/m = 20/4 = 5 m/s²",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: kuvvetHareket.id,
      kaynak: "AI_URETIM",
      zorluk: 1,
      soruMetni:
        "Sürtünme kuvvetinin yönü hareket yönüne göre nasıldır?",
      siklar: [
        "Aynı yöndedir",
        "Zıt yöndedir",
        "Dik yöndedir",
        "Yönü yoktur",
      ],
      dogruSik: 1,
      aciklama:
        "Sürtünme kuvveti her zaman harekete karşı, yani hareket yönünün tersine etki eder.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== TÜRKÇE - Sözcükte Anlam (4 soru) =====
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

  await prisma.question.create({
    data: {
      topicId: sozcukAnlam.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni:
        '"Ayak" sözcüğü aşağıdaki cümlelerin hangisinde mecaz anlamda kullanılmıştır?',
      siklar: [
        "Çocuğun ayağı ağrıyordu.",
        "Dağın ayağında bir köy vardı.",
        "Koşarken ayağım büküldü.",
        "Ayakkabım ayağımı sıkıyor.",
      ],
      dogruSik: 1,
      aciklama:
        "'Dağın ayağı' ifadesinde 'ayak' sözcüğü dağın eteği anlamında mecaz olarak kullanılmıştır.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: sozcukAnlam.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Aşağıdaki cümlelerin hangisinde sözcük eş anlamlısıyla yer değiştiremez?",
      siklar: [
        "Bu iş kolay değil. (basit)",
        "Çok mutluyum. (sevinçli)",
        "Göz yaşı döktü. (ağladı)",
        "Hızlı koştu. (çabuk)",
      ],
      dogruSik: 2,
      aciklama:
        "'Göz yaşı döktü' bir deyimdir. Deyimlerde sözcükler mecaz anlam kazandığından eş anlamlılarıyla yer değiştirilemez.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: sozcukAnlam.id,
      kaynak: "AI_URETIM",
      zorluk: 1,
      soruMetni:
        '"Tatlı dil yılanı deliğinden çıkarır" atasözünde "tatlı" sözcüğü hangi anlamda kullanılmıştır?',
      siklar: [
        "Şeker tadında olan",
        "Yumuşak, güzel konuşma biçimi",
        "Tatlı yiyecek türü",
        "Hoş görünen",
      ],
      dogruSik: 1,
      aciklama:
        "Atasözünde 'tatlı dil', şeker tadı anlamında değil; nazik ve ikna edici konuşma biçimini ifade eder.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== TÜRKÇE - Paragraf (4 soru) =====
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

  await prisma.question.create({
    data: {
      topicId: paragraf.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Destekleyici cümle ile ilgili aşağıdakilerden hangisi doğrudur?",
      siklar: [
        "Paragrafın konusunu belirtir",
        "Ana düşünceyi açıklar, örnekler verir",
        "Paragrafı sonlandırır",
        "Yeni bir konu başlatır",
      ],
      dogruSik: 1,
      aciklama:
        "Destekleyici cümleler, ana düşünceyi açıklamak, kanıtlamak ve örneklemek için kullanılır.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: paragraf.id,
      kaynak: "CIKMIS",
      kaynakYili: 2022,
      zorluk: 3,
      soruMetni:
        "Paragrafta geçiş cümleleri ne işe yarar?",
      siklar: [
        "Ana fikri belirtir",
        "Paragrafı sona erdirir",
        "Düşünceler arasında bağlantı kurar",
        "Yeni paragraf başlatır",
      ],
      dogruSik: 2,
      aciklama:
        "Geçiş cümleleri paragraf içinde düşünceler arasında bağlantı sağlar ve akıcılığı artırır.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: paragraf.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Bir paragrafta 'sonuç bildiren' cümlenin özelliği nedir?",
      siklar: [
        "Örnek verir",
        "Soru sorar",
        "Önceki bilgilere dayanarak bir yargıya varır",
        "Yeni bilgi sunar",
      ],
      dogruSik: 2,
      aciklama:
        "Sonuç cümlesi, paragraftaki bilgileri değerlendirerek genel bir yargıya varır ve konuyu kapatır.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== TÜRKÇE - Cümle Bilgisi (3 soru) =====
  await prisma.question.create({
    data: {
      topicId: cumleBilgisi.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 2,
      soruMetni:
        '"Ali kitabı masaya bıraktı." cümlesinin öznesi hangisidir?',
      siklar: ["kitabı", "masaya", "Ali", "bıraktı"],
      dogruSik: 2,
      aciklama:
        "Cümlede eylemi gerçekleştiren kişi ya da varlık öznedir. 'Ali' kitabı bırakan kişidir, dolayısıyla öznedir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: cumleBilgisi.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Aşağıdaki cümlelerin hangisi soru cümlesidir?",
      siklar: [
        "Yarın okula gidiyorum.",
        "Hava çok soğuktu.",
        "Kitabını okuyor musun?",
        "Annem beni seviyor.",
      ],
      dogruSik: 2,
      aciklama:
        "Soru cümlesi, soru eki (-mi/-mı/-mu/-mü) ya da soru sözcükleri içeren ve soru işareti ile biten cümledir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: cumleBilgisi.id,
      kaynak: "AI_URETIM",
      zorluk: 3,
      soruMetni:
        '"Güneş batıya doğru alçaldı." cümlesinde yüklem hangisidir?',
      siklar: ["Güneş", "batıya", "doğru", "alçaldı"],
      dogruSik: 3,
      aciklama:
        "Yüklem, cümledeki temel eylem ya da yargıyı bildirir. 'Alçaldı' eylemi cümlenin yüklemidir.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== SOSYAL - Kurtuluş Savaşı (4 soru) =====
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

  await prisma.question.create({
    data: {
      topicId: kurtulusSavasi.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni:
        "Kurtuluş Savaşı'nın hukuki temelini oluşturan ve millî iradeyi yansıtan belge aşağıdakilerden hangisidir?",
      siklar: [
        "Mondros Ateşkes Antlaşması",
        "Sevr Antlaşması",
        "Misak-ı Millî",
        "Lozan Antlaşması",
      ],
      dogruSik: 2,
      aciklama:
        "Misak-ı Millî (28 Ocak 1920), Osmanlı Mebusan Meclisi tarafından kabul edilen ve millî sınırları belirleyen belgedir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: kurtulusSavasi.id,
      kaynak: "AI_URETIM",
      zorluk: 3,
      soruMetni:
        "Sakarya Savaşı hangi açıdan önem taşır?",
      siklar: [
        "İlk düzenli ordu savaşıdır",
        "Kurtuluş Savaşı'nın başlangıcıdır",
        "Taarruza geçişin önü açılmıştır",
        "Lozan müzakereleri başlamıştır",
      ],
      dogruSik: 2,
      aciklama:
        "Sakarya Zaferi (23 Ağustos - 13 Eylül 1921), savunmadan taarruza geçişin önünü açmıştır. Bu zaferden sonra Mustafa Kemal'e Gazilik unvanı verilmiştir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: kurtulusSavasi.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Kurtuluş Savaşı'nı kesin olarak zaferle sonuçlandıran savaş hangisidir?",
      siklar: [
        "I. İnönü Savaşı",
        "Sakarya Savaşı",
        "Büyük Taarruz ve Başkomutanlık Meydan Savaşı",
        "II. İnönü Savaşı",
      ],
      dogruSik: 2,
      aciklama:
        "Büyük Taarruz (26 Ağustos 1922) ve ardından gelen Başkomutanlık Meydan Savaşı, Yunan kuvvetlerini kesin yenilgiye uğratan savaştır.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== SOSYAL - Atatürk İnkılapları (4 soru) =====
  await prisma.question.create({
    data: {
      topicId: ataturkInkilaplari.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 2,
      soruMetni:
        "Saltanatın kaldırılmasıyla (1 Kasım 1922) aşağıdakilerden hangisi sona ermiştir?",
      siklar: [
        "Osmanlı hükümeti",
        "Siyasi ve fiilî Osmanlı yönetimi",
        "Türk Devleti",
        "Cumhuriyet idaresi",
      ],
      dogruSik: 1,
      aciklama:
        "Saltanatın kaldırılmasıyla Osmanlı Devleti'nin siyasi varlığı sona ermiş, TBMM tek meşru güç olmuştur.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: ataturkInkilaplari.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni:
        "Türkiye Cumhuriyeti'nin ilanı hangi tarihte gerçekleşmiştir?",
      siklar: [
        "23 Nisan 1920",
        "1 Kasım 1922",
        "29 Ekim 1923",
        "3 Mart 1924",
      ],
      dogruSik: 2,
      aciklama:
        "Türkiye Cumhuriyeti 29 Ekim 1923'te ilan edilmiş, Mustafa Kemal Atatürk ilk Cumhurbaşkanı seçilmiştir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: ataturkInkilaplari.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Harf İnkılabı (1928) ile aşağıdakilerden hangisi gerçekleşmiştir?",
      siklar: [
        "Arapça zorunlu ders yapıldı",
        "Latin kökenli Türk alfabesi kabul edildi",
        "Osmanlı alfabesi zorunlu hale getirildi",
        "Farsça alfabe benimsendi",
      ],
      dogruSik: 1,
      aciklama:
        "Harf İnkılabı ile Arap harfleri bırakılmış, Latin kökenli yeni Türk alfabesi kabul edilmiştir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: ataturkInkilaplari.id,
      kaynak: "AI_URETIM",
      zorluk: 3,
      soruMetni:
        "Aşağıdaki inkılapların kronolojik sıralaması hangisinde doğru verilmiştir?",
      siklar: [
        "Saltanatın kaldırılması → Cumhuriyetin ilanı → Hilafetin kaldırılması",
        "Cumhuriyetin ilanı → Saltanatın kaldırılması → Hilafetin kaldırılması",
        "Hilafetin kaldırılması → Cumhuriyetin ilanı → Saltanatın kaldırılması",
        "Saltanatın kaldırılması → Hilafetin kaldırılması → Cumhuriyetin ilanı",
      ],
      dogruSik: 0,
      aciklama:
        "Saltanat 1 Kasım 1922, Cumhuriyet 29 Ekim 1923, Hilafet ise 3 Mart 1924'te kaldırılmıştır.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== İNGİLİZCE - Friendship (3 soru) =====
  await prisma.question.create({
    data: {
      topicId: friendship.id,
      kaynak: "CIKMIS",
      kaynakYili: 2024,
      zorluk: 1,
      soruMetni:
        "Which word means 'a person you know well and like a lot'?",
      siklar: ["Enemy", "Stranger", "Friend", "Teacher"],
      dogruSik: 2,
      aciklama:
        "'Friend' kelimesi, iyi tanıdığınız ve çok sevdiğiniz kişi anlamına gelir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: friendship.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Choose the correct sentence: 'My best friend ___ very kind.'",
      siklar: ["am", "are", "is", "be"],
      dogruSik: 2,
      aciklama:
        "He/She/It için 'is' kullanılır. 'My best friend' tekil üçüncü şahıs olduğundan 'is' doğrudur.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: friendship.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "What does 'trustworthy' mean?",
      siklar: [
        "Someone who lies often",
        "Someone you can trust and rely on",
        "Someone who is very rich",
        "Someone who is shy",
      ],
      dogruSik: 1,
      aciklama:
        "'Trustworthy' = güvenilir. Güvenebileceğiniz ve her zaman yanınızda olan kişi.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== İNGİLİZCE - Teen Life (3 soru) =====
  await prisma.question.create({
    data: {
      topicId: teenLife.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni:
        "Fill in the blank: 'She ___ basketball every Saturday.'",
      siklar: ["play", "plays", "playing", "played"],
      dogruSik: 1,
      aciklama:
        "She üçüncü tekil şahıs olduğundan Simple Present Tense'de 'plays' kullanılır.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: teenLife.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Which sentence is in the past tense?",
      siklar: [
        "I go to school every day.",
        "She is reading a book.",
        "They played football yesterday.",
        "We will visit the museum.",
      ],
      dogruSik: 2,
      aciklama:
        "'Played' fiilinin geçmiş zaman (past tense) formu olduğundan bu cümle Simple Past Tense'dir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: teenLife.id,
      kaynak: "AI_URETIM",
      zorluk: 3,
      soruMetni:
        "Choose the correct question tag: 'You like pizza, ___?'",
      siklar: ["do you", "don't you", "are you", "aren't you"],
      dogruSik: 1,
      aciklama:
        "Cümle olumlu (You like) olduğundan soru etiketi olumsuz olmalı: 'don't you'",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== DİN - Kader İnancı (3 soru) =====
  await prisma.question.create({
    data: {
      topicId: kaderInanc.id,
      kaynak: "CIKMIS",
      kaynakYili: 2023,
      zorluk: 2,
      soruMetni:
        "İslam'da kader inancına göre aşağıdakilerden hangisi doğrudur?",
      siklar: [
        "Kader, insanın iradesini tamamen ortadan kaldırır",
        "Allah her şeyi bilir ve insanın özgür iradesine saygı duyar",
        "Kader inancı çalışmayı engeller",
        "Her şey tamamen insanın iradesiyle belirlenir",
      ],
      dogruSik: 1,
      aciklama:
        "Kader inancına göre Allah her şeyi bilir ancak insana irade vermiştir. İnsan seçimlerinden sorumludur.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: kaderInanc.id,
      kaynak: "AI_URETIM",
      zorluk: 1,
      soruMetni:
        "İslam'da 'kaza' kavramı ne anlama gelir?",
      siklar: [
        "Allah'ın her şeyi önceden bilmesi",
        "Allah'ın hükmünü gerçekleştirmesi",
        "İnsanın özgür iradesi",
        "Dua etmek",
      ],
      dogruSik: 1,
      aciklama:
        "Kaza, Allah'ın ezelî bilgisi doğrultusunda hükmünü zamanı geldiğinde gerçekleştirmesidir.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: kaderInanc.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Kader inancının insana kazandırdığı en önemli özellik aşağıdakilerden hangisidir?",
      siklar: [
        "Tembellik",
        "Kadere razı olmak ve sorumluluk almak",
        "Her şeyi başkasına bırakmak",
        "Çalışmayı bırakmak",
      ],
      dogruSik: 1,
      aciklama:
        "Doğru kader inancı insana tevekkül (Allah'a güvenip gerekeni yapmak) ve sorumluluk bilinci kazandırır.",
      validationStatus: "PUBLISHED",
    },
  });

  // ===== DİN - Zekât ve Sadaka (3 soru) =====
  await prisma.question.create({
    data: {
      topicId: zekat.id,
      kaynak: "CIKMIS",
      kaynakYili: 2022,
      zorluk: 2,
      soruMetni:
        "Zekâtın İslam'ın beş şartı arasında kaçıncı sırada yer aldığı aşağıdakilerden hangisidir?",
      siklar: ["İkinci", "Üçüncü", "Dördüncü", "Beşinci"],
      dogruSik: 1,
      aciklama:
        "İslam'ın beş şartı sırasıyla: 1. Kelime-i şahadet, 2. Namaz, 3. Oruç, 4. Zekât, 5. Hac. Zekât dördüncü sıradadır.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: zekat.id,
      kaynak: "AI_URETIM",
      zorluk: 2,
      soruMetni:
        "Zekât ile sadaka arasındaki temel fark nedir?",
      siklar: [
        "İkisi de aynı şeydir",
        "Zekât farz, sadaka gönüllüdür",
        "Sadaka farz, zekât gönüllüdür",
        "Zekât daha az para gerektirir",
      ],
      dogruSik: 1,
      aciklama:
        "Zekât, belli şartları taşıyan Müslümanlara farz olan mali ibadettir. Sadaka ise gönüllü olarak verilen yardımdır.",
      validationStatus: "PUBLISHED",
    },
  });

  await prisma.question.create({
    data: {
      topicId: zekat.id,
      kaynak: "AI_URETIM",
      zorluk: 1,
      soruMetni:
        "Sadaka ile ilgili aşağıdakilerden hangisi doğrudur?",
      siklar: [
        "Sadece para olarak verilir",
        "Sadece zenginler verebilir",
        "Gülümsemek de bir sadakadır",
        "Yılda bir kez verilmesi zorunludur",
      ],
      dogruSik: 2,
      aciklama:
        "Hz. Muhammed'in hadisine göre kardeşine gülümsemen dahi sadakadır. Sadaka para ile sınırlı değildir.",
      validationStatus: "PUBLISHED",
    },
  });

  // ==================== OKULLAR ====================
  console.log("Okullar ekleniyor...");

  await prisma.school.create({
    data: {
      isim: "Galatasaray Lisesi",
      sehir: "İstanbul",
      ilce: "Beyoğlu",
      minPuan: 497.5,
      tur: "Fen Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "İstanbul Lisesi",
      sehir: "İstanbul",
      ilce: "Fatih",
      minPuan: 487.3,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Kadıköy Anadolu Lisesi",
      sehir: "İstanbul",
      ilce: "Kadıköy",
      minPuan: 489.1,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Vefa Lisesi",
      sehir: "İstanbul",
      ilce: "Fatih",
      minPuan: 483.6,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Ankara Fen Lisesi",
      sehir: "Ankara",
      ilce: "Çankaya",
      minPuan: 499.1,
      tur: "Fen Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "İzmir Fen Lisesi",
      sehir: "İzmir",
      ilce: "Bornova",
      minPuan: 496.8,
      tur: "Fen Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Bursa Fen Lisesi",
      sehir: "Bursa",
      ilce: "Osmangazi",
      minPuan: 493.7,
      tur: "Fen Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "İstanbul Erkek Lisesi",
      sehir: "İstanbul",
      ilce: "Fatih",
      minPuan: 484.9,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Boğaziçi Lisesi",
      sehir: "İstanbul",
      ilce: "Üsküdar",
      minPuan: 480.2,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Kabataş Erkek Lisesi",
      sehir: "İstanbul",
      ilce: "Beşiktaş",
      minPuan: 486.4,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Haydarpaşa Lisesi",
      sehir: "İstanbul",
      ilce: "Kadıköy",
      minPuan: 478.5,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Ankara Anadolu Lisesi",
      sehir: "Ankara",
      ilce: "Çankaya",
      minPuan: 481.3,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Atatürk Lisesi (Ankara)",
      sehir: "Ankara",
      ilce: "Çankaya",
      minPuan: 477.6,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "İzmir Atatürk Lisesi",
      sehir: "İzmir",
      ilce: "Konak",
      minPuan: 474.8,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Adana Fen Lisesi",
      sehir: "Adana",
      ilce: "Seyhan",
      minPuan: 491.2,
      tur: "Fen Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Konya Meram Fen Lisesi",
      sehir: "Konya",
      ilce: "Meram",
      minPuan: 490.4,
      tur: "Fen Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Antalya Fen Lisesi",
      sehir: "Antalya",
      ilce: "Muratpaşa",
      minPuan: 488.9,
      tur: "Fen Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Trabzon Fen Lisesi",
      sehir: "Trabzon",
      ilce: "Ortahisar",
      minPuan: 487.0,
      tur: "Fen Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Samsun Anadolu Lisesi",
      sehir: "Samsun",
      ilce: "İlkadım",
      minPuan: 472.3,
      tur: "Anadolu Lisesi",
    },
  });

  await prisma.school.create({
    data: {
      isim: "Gaziantep Fen Lisesi",
      sehir: "Gaziantep",
      ilce: "Şahinbey",
      minPuan: 489.6,
      tur: "Fen Lisesi",
    },
  });

  const topicCount = await prisma.topic.count();
  const questionCount = await prisma.question.count();
  const schoolCount = await prisma.school.count();
  console.log(
    `Seed tamamlandi: ${topicCount} konu, ${questionCount} soru, ${schoolCount} okul`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
