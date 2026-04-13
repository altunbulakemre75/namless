import { NextResponse } from "next/server";
import { prisma } from "../../../infrastructure/database/prisma";

export async function GET() {
  const baslangic = Date.now();
  const sonuclar: Record<string, unknown> = {};
  const hatalar: string[] = [];

  // 1. DB bağlantısı
  try {
    await prisma.$queryRaw`SELECT 1`;
    sonuclar.db = "OK";
  } catch (e) {
    sonuclar.db = "HATA";
    hatalar.push("DB bağlantısı başarısız: " + String(e));
  }

  // 2. Soru sayısı
  try {
    const soruSayisi = await prisma.question.count({ where: { validationStatus: "PUBLISHED" } });
    const toplamSoru = await prisma.question.count();
    sonuclar.sorular = { yayinlanan: soruSayisi, toplam: toplamSoru };
    if (soruSayisi === 0) hatalar.push("Yayınlanan soru yok!");
  } catch (e) {
    hatalar.push("Soru sorgusu başarısız: " + String(e));
  }

  // 3. Konu sayısı
  try {
    const konuSayisi = await prisma.topic.count();
    sonuclar.konular = { toplam: konuSayisi };
  } catch (e) {
    hatalar.push("Konu sorgusu başarısız: " + String(e));
  }

  // 4. Okul sayısı
  try {
    const okulSayisi = await prisma.school.count();
    sonuclar.okullar = { toplam: okulSayisi };
    if (okulSayisi === 0) hatalar.push("Hiç okul yok!");
  } catch (e) {
    hatalar.push("Okul sorgusu başarısız: " + String(e));
  }

  // 5. Kullanıcı ve plan istatistikleri
  try {
    const kullanicSayisi = await prisma.user.count();
    const planSayisi = await prisma.studyPlan.count();
    const masterySayisi = await prisma.mastery.count();
    const attemptSayisi = await prisma.attempt.count();
    const mockSayisi = await prisma.mockExam.count();
    sonuclar.kullanicilar = {
      toplam: kullanicSayisi,
      planOlusan: planSayisi,
      masteryKaydi: masterySayisi,
      cevapKaydi: attemptSayisi,
      denemeSinavi: mockSayisi,
    };
  } catch (e) {
    hatalar.push("Kullanıcı sorgusu başarısız: " + String(e));
  }

  // 6. Ders bazında soru dağılımı
  try {
    const dersGruplari = await prisma.question.groupBy({
      by: ["topicId"],
      where: { validationStatus: "PUBLISHED" },
      _count: { id: true },
    });

    const dersDetay = await prisma.topic.findMany({
      where: { id: { in: dersGruplari.map(d => d.topicId) } },
      select: { ders: true, id: true },
    });

    const dersSayilari: Record<string, number> = {};
    dersGruplari.forEach(g => {
      const topic = dersDetay.find(t => t.id === g.topicId);
      if (topic) {
        dersSayilari[topic.ders] = (dersSayilari[topic.ders] ?? 0) + g._count.id;
      }
    });
    sonuclar.dersBasinaSoru = dersSayilari;
  } catch (e) {
    hatalar.push("Ders dağılımı sorgusu başarısız: " + String(e));
  }

  // 7. Son 5 attempt (canlı aktivite)
  try {
    const sonAttemptler = await prisma.attempt.findMany({
      orderBy: { tarih: "desc" },
      take: 5,
      select: { tarih: true, dogruMu: true, baglam: true, userId: true },
    });
    sonuclar.sonAktivite = sonAttemptler;
  } catch (e) {
    hatalar.push("Aktivite sorgusu başarısız: " + String(e));
  }

  const sure = Date.now() - baslangic;
  const saglikli = hatalar.length === 0;

  return NextResponse.json({
    durum: saglikli ? "SAGLIKLI" : "SORUNLU",
    sure: `${sure}ms`,
    zaman: new Date().toISOString(),
    sonuclar,
    hatalar,
  }, { status: saglikli ? 200 : 500 });
}
