/**
 * Proaktif Bildirim Cron — Hermes uyarlaması
 *
 * Vercel Cron veya harici cron servisi tarafından çağrılır.
 * Görevler:
 *   1. Streak riski: 2+ gün çalışmayan öğrencilere DB bildirimi yaz
 *   2. Haftalık rapor: Pazar günü otomatik üretim + bildirim
 *   3. LGS yaklaşım: 90/60/30/14/7/1 gün kaldığında tüm öğrencilere bildirim
 *   4. Skill evolver: Son 30 günlük attempt'lardan SKILL.md güncelleme
 *
 * Güvenlik: CRON_SECRET header kontrolü
 *
 * Vercel cron.json:
 *   { "crons": [{ "path": "/api/cron/notifications", "schedule": "0 9 * * *" }] }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { WeeklyReportGenerator } from "@/infrastructure/report/weekly-report-generator";
import { evolveSkill } from "@/infrastructure/skills/skill-evolver";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const LGS_TARIH = new Date("2026-06-07");

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const bugun = new Date();
  const sonuclar: Record<string, unknown> = {};

  // --- Görev 1: Streak riski ---
  try {
    sonuclar.streakRisk = await checkStreakRisk();
  } catch (e) {
    sonuclar.streakRiskHata = String(e);
  }

  // --- Görev 2: Haftalık rapor (Pazar = 0) ---
  if (bugun.getDay() === 0) {
    try {
      sonuclar.haftalikRapor = await generateWeeklyReports();
    } catch (e) {
      sonuclar.haftalikRaporHata = String(e);
    }
  }

  // --- Görev 3: LGS yaklaşıyor ---
  try {
    sonuclar.lgsBildirim = await checkLgsApproach(bugun);
  } catch (e) {
    sonuclar.lgsBildirimHata = String(e);
  }

  // --- Görev 4: Skill evolver ---
  try {
    sonuclar.skillEvolver = await runSkillEvolver();
  } catch (e) {
    sonuclar.skillEvolverHata = String(e);
  }

  return NextResponse.json({ tarih: bugun.toISOString(), sonuclar });
}

/**
 * 2+ gün çalışmayan streak sahiplerine DB bildirimi yaz
 */
async function checkStreakRisk(): Promise<{ tespit: number; kaydedilen: number }> {
  const ikigünOnce = new Date(Date.now() - 2 * 86400000);
  const otuzGünOnce = new Date(Date.now() - 30 * 86400000);

  const riskliKullanicilar = await prisma.user.findMany({
    where: {
      rol: "STUDENT",
      currentStreak: { gt: 0 },
      lastStudyDate: { lt: ikigünOnce, gte: otuzGünOnce },
    },
    select: { id: true, isim: true, currentStreak: true },
    take: 100,
  });

  let kaydedilen = 0;
  for (const u of riskliKullanicilar) {
    try {
      await (prisma as any).bildirim.create({
        data: {
          userId: u.id,
          tip: "STREAK_RISK",
          baslik: "Seriniz tehlikede!",
          mesaj: `${u.currentStreak} günlük çalışma serinizi kaybetmemek için bugün en az 1 soru çözün.`,
          veri: { streak: u.currentStreak },
        },
      });
      kaydedilen++;
    } catch { /* devam */ }
  }

  return { tespit: riskliKullanicilar.length, kaydedilen };
}

/**
 * Aktif öğrenciler için haftalık rapor üret + bildirim kaydet
 */
async function generateWeeklyReports(): Promise<{ uretilen: number; hata: number }> {
  const generator = new WeeklyReportGenerator(prisma);
  const yediGünOnce = new Date(Date.now() - 7 * 86400000);

  const aktifOgrenciler = await prisma.user.findMany({
    where: { rol: "STUDENT", lastStudyDate: { gte: yediGünOnce } },
    select: { id: true },
    take: 200,
  });

  let uretilen = 0;
  let hata = 0;

  for (const ogr of aktifOgrenciler) {
    try {
      const rapor = await generator.generate(ogr.id);

      await (prisma as any).bildirim.create({
        data: {
          userId: ogr.id,
          tip: "HAFTALIK_RAPOR",
          baslik: "Haftalık Raporun Hazır",
          mesaj: rapor.haftaninOnerisi,
          veri: {
            cozulenSoru: rapor.ozet.cozulenSoru,
            dogruOrani: rapor.ozet.dogruOrani,
            streak: rapor.ozet.streak,
          },
        },
      });

      uretilen++;
      await new Promise((res) => setTimeout(res, 500));
    } catch {
      hata++;
    }
  }

  return { uretilen, hata };
}

/**
 * LGS'ye belirli günler kalınca tüm aktif öğrencilere bildirim
 */
async function checkLgsApproach(bugun: Date): Promise<{ bildirimTipi: string | null; kaydedilen: number }> {
  const kalanGun = Math.ceil((LGS_TARIH.getTime() - bugun.getTime()) / 86400000);
  const bildirimGunleri = [90, 60, 30, 14, 7, 1];

  if (!bildirimGunleri.includes(kalanGun)) {
    return { bildirimTipi: null, kaydedilen: 0 };
  }

  const mesajlar: Record<number, { baslik: string; mesaj: string }> = {
    90: { baslik: "LGS'ye 3 Ay Kaldı", mesaj: "Planını gözden geçirme zamanı. Zayıf konuları belirle!" },
    60: { baslik: "LGS'ye 60 Gün", mesaj: "Son sprint başlıyor. Her gün düzenli çalış!" },
    30: { baslik: "LGS'ye 1 Ay Kaldı", mesaj: "Zayıf konulara odaklan, hızlı tekrar yap." },
    14: { baslik: "LGS'ye 2 Hafta", mesaj: "Hızlı tekrar modu. Günlük hedefini düşürme." },
    7:  { baslik: "LGS'ye 1 Hafta", mesaj: "Moral iyi, tempo sabit. Yeni konu çalışma!" },
    1:  { baslik: "LGS Yarın!", mesaj: "Erken uyu, güvenli ol. Başarılar!" },
  };

  const aktifOgrenciler = await prisma.user.findMany({
    where: {
      rol: "STUDENT",
      lastStudyDate: { gte: new Date(Date.now() - 30 * 86400000) },
    },
    select: { id: true },
    take: 500,
  });

  const { baslik, mesaj } = mesajlar[kalanGun];
  let kaydedilen = 0;

  for (const ogr of aktifOgrenciler) {
    try {
      await (prisma as any).bildirim.create({
        data: {
          userId: ogr.id,
          tip: "LGS_YAKLASIM",
          baslik,
          mesaj,
          veri: { kalanGun },
        },
      });
      kaydedilen++;
    } catch { /* devam */ }
  }

  return { bildirimTipi: `lgs_${kalanGun}_gun`, kaydedilen };
}

/**
 * Son 30 günlük attempt verilerinden SKILL.md dosyalarını güncelle
 */
async function runSkillEvolver(): Promise<{ islenenKonu: number; guncellenen: number }> {
  const otuzGünOnce = new Date(Date.now() - 30 * 86400000);

  // Her topic için attempt özetleri çek
  const topicAttempts = await prisma.attempt.findMany({
    where: { tarih: { gte: otuzGünOnce } },
    include: {
      question: {
        select: {
          soruMetni: true,
          dogruSik: true,
          topic: { select: { id: true, isim: true, ders: true } },
        },
      },
    },
  });

  // Topic'e göre grupla
  const topicMap = new Map<string, {
    isim: string;
    ders: string;
    attempts: Array<{ soruMetni: string; secilenSik: number; dogruSik: number; dogruMu: boolean; hataKategorisi?: string | null }>;
  }>();

  for (const a of topicAttempts) {
    const topicId = a.question.topic.id;
    if (!topicMap.has(topicId)) {
      topicMap.set(topicId, { isim: a.question.topic.isim, ders: a.question.topic.ders, attempts: [] });
    }
    topicMap.get(topicId)!.attempts.push({
      soruMetni: a.question.soruMetni,
      secilenSik: a.secilenSik,
      dogruSik: a.question.dogruSik,
      dogruMu: a.dogruMu,
      hataKategorisi: a.hataKategorisi,
    });
  }

  let islenenKonu = 0;
  let guncellenen = 0;

  for (const [, { isim, ders, attempts }] of topicMap) {
    const result = evolveSkill({ topicIsim: isim, ders, attempts });
    islenenKonu++;
    if (result.dosyaGuncellendi) guncellenen++;
  }

  return { islenenKonu, guncellenen };
}
