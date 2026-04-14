/**
 * seed-test-data.ts
 *
 * Gerçekçi test verisi oluşturur:
 * - 15 Türkiye genelinde popüler lise (taban puan 280-490)
 * - Mevcut konulara bağlı mastery skorları (350-450 YEP aralığı)
 * - Hata defteri için yanlış attempt'ler
 *
 * Çalıştır: npx tsx scripts/seed-test-data.ts
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

// 350-450 YEP aralığı için mastery dağılımı:
// YEP = 100 + (toplamDogru/90)*400
// 400 YEP ≈ 67.5 doğru → ~%75 mastery ortalaması
const MASTERY_HEDEF: Record<string, number> = {
  TURKCE:    72, // 14.4/20 → güçlü
  MATEMATIK: 55, // 11/20  → orta
  FEN:       60, // 12/20  → orta
  SOSYAL:    78, // 7.8/10 → güçlü
  DIN:       80, // 8/10   → güçlü
  INGILIZCE: 52, // 5.2/10 → zayıf
};

const OKULLAR = [
  // Zor (490+)
  { isim: "Galatasaray Lisesi", sehir: "İstanbul", ilce: "Beyoğlu", minPuan: 489, tur: "Anadolu Lisesi" },
  { isim: "Kabataş Erkek Lisesi", sehir: "İstanbul", ilce: "Beşiktaş", minPuan: 481, tur: "Anadolu Lisesi" },
  { isim: "Ankara Fen Lisesi", sehir: "Ankara", ilce: "Çankaya", minPuan: 487, tur: "Fen Lisesi" },
  // Üst orta (440-480)
  { isim: "Kadıköy Anadolu Lisesi", sehir: "İstanbul", ilce: "Kadıköy", minPuan: 462, tur: "Anadolu Lisesi" },
  { isim: "Bornova Anadolu Lisesi", sehir: "İzmir", ilce: "Bornova", minPuan: 455, tur: "Anadolu Lisesi" },
  { isim: "Ankara Anadolu Lisesi", sehir: "Ankara", ilce: "Altındağ", minPuan: 448, tur: "Anadolu Lisesi" },
  { isim: "İzmir Fen Lisesi", sehir: "İzmir", ilce: "Buca", minPuan: 470, tur: "Fen Lisesi" },
  // Orta (380-440)
  { isim: "Şişli Anadolu Lisesi", sehir: "İstanbul", ilce: "Şişli", minPuan: 420, tur: "Anadolu Lisesi" },
  { isim: "Bursa Anadolu Lisesi", sehir: "Bursa", ilce: "Osmangazi", minPuan: 410, tur: "Anadolu Lisesi" },
  { isim: "Konya Anadolu Lisesi", sehir: "Konya", ilce: "Selçuklu", minPuan: 395, tur: "Anadolu Lisesi" },
  { isim: "Gaziantep Anadolu Lisesi", sehir: "Gaziantep", ilce: "Şahinbey", minPuan: 388, tur: "Anadolu Lisesi" },
  // Alt orta (300-380)
  { isim: "Adana Anadolu Lisesi", sehir: "Adana", ilce: "Seyhan", minPuan: 365, tur: "Anadolu Lisesi" },
  { isim: "Antalya Anadolu Lisesi", sehir: "Antalya", ilce: "Muratpaşa", minPuan: 352, tur: "Anadolu Lisesi" },
  { isim: "Trabzon Anadolu Lisesi", sehir: "Trabzon", ilce: "Ortahisar", minPuan: 338, tur: "Anadolu Lisesi" },
  { isim: "Kayseri Anadolu Lisesi", sehir: "Kayseri", ilce: "Melikgazi", minPuan: 320, tur: "Anadolu Lisesi" },
];

async function main() {
  console.log("🌱 Test verisi oluşturuluyor...\n");

  // ── 1. Okullar ──────────────────────────────────────────────────────────────
  console.log("🏫 Okullar ekleniyor...");
  let okulEklendi = 0;
  for (const okul of OKULLAR) {
    const mevcut = await prisma.school.findFirst({ where: { isim: okul.isim } });
    if (!mevcut) {
      await (prisma as any).school.create({ data: okul });
      okulEklendi++;
    }
  }
  console.log(`   ${okulEklendi} yeni okul eklendi, ${OKULLAR.length - okulEklendi} zaten vardı.\n`);

  // ── 2. Konuları al ──────────────────────────────────────────────────────────
  const tumKonular = await prisma.topic.findMany({
    where: { parentId: { not: null } }, // sadece alt konular
    select: { id: true, ders: true, isim: true },
  });

  if (tumKonular.length === 0) {
    console.log("⚠️  Veritabanında konu yok. Önce 'npx prisma db seed' çalıştır.\n");
    return;
  }

  console.log(`📚 ${tumKonular.length} konu bulundu.\n`);

  // ── 3. Test öğrencisi için mastery verileri ──────────────────────────────────
  // Supabase'deki gerçek kullanıcı ID'sini bul
  const mevcutKullanici = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!mevcutKullanici) {
    console.log("⚠️  Veritabanında kullanıcı yok. Önce sisteme giriş yap.\n");
    return;
  }

  console.log(`👤 Kullanıcı: ${mevcutKullanici.isim} (${mevcutKullanici.email})`);
  console.log("📊 Mastery skorları güncelleniyor (350-450 YEP aralığı)...\n");

  const userId = mevcutKullanici.id;
  let masteryGuncellendi = 0;

  for (const konu of tumKonular) {
    const hedefMastery = MASTERY_HEDEF[konu.ders] ?? 60;
    // Konu bazında ±15 rastgele varyasyon ekle (gerçekçi dağılım)
    const varyasyon = (Math.random() - 0.5) * 30;
    const skor = Math.min(95, Math.max(10, hedefMastery + varyasyon));

    await prisma.mastery.upsert({
      where: { userId_topicId: { userId, topicId: konu.id } },
      update: { skor, sonGuncelleme: new Date() },
      create: {
        userId,
        topicId: konu.id,
        skor,
        guvenAraligi: 20,
        sonGuncelleme: new Date(),
      },
    });
    masteryGuncellendi++;
  }

  console.log(`   ${masteryGuncellendi} mastery skoru güncellendi.\n`);

  // ── 4. Tahmin hesapla ve göster ─────────────────────────────────────────────
  const masteries = await prisma.mastery.findMany({
    where: { userId },
    include: { topic: { select: { ders: true } } },
  });

  const LGS_SORU: Record<string, number> = {
    TURKCE: 20, MATEMATIK: 20, FEN: 20, SOSYAL: 10, DIN: 10, INGILIZCE: 10,
  };

  const dersSkorlar: Record<string, number[]> = {};
  for (const m of masteries) {
    const ders = m.topic.ders;
    if (!dersSkorlar[ders]) dersSkorlar[ders] = [];
    dersSkorlar[ders].push(m.skor);
  }

  let toplamDogru = 0;
  console.log("📈 Ders bazında tahmin:");
  for (const [ders, soruSayisi] of Object.entries(LGS_SORU)) {
    const skorlar = dersSkorlar[ders] ?? [];
    const ort = skorlar.length ? skorlar.reduce((a, b) => a + b) / skorlar.length : 0;
    const dogru = Math.round((ort / 100) * soruSayisi);
    toplamDogru += dogru;
    console.log(`   ${ders.padEnd(12)}: %${Math.round(ort).toString().padStart(3)} mastery → ~${dogru}/${soruSayisi} doğru`);
  }

  const yepPuan = Math.min(500, Math.round(100 + (toplamDogru / 90) * 400));
  console.log(`\n🎯 Tahmini YEP Puanı: ${yepPuan} (hedef: 350-450)`);

  // ── 5. Kullanıcı streak güncelle ─────────────────────────────────────────────
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: 7,
      longestStreak: 14,
      lastStudyDate: new Date(),
      dailyStudyMins: 90,
    },
  });
  console.log("\n🔥 Streak: 7 gün, en uzun: 14 gün\n");

  console.log("✅ Test verisi hazır! Sistemi başlatıp test edebilirsin.\n");
}

main()
  .catch((e) => { console.error("❌ Hata:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
