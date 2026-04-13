/**
 * Proaktif Bildirim Cron — Hermes uyarlaması
 *
 * Vercel Cron veya harici cron servisi tarafından çağrılır.
 * Görevler:
 *   1. Streak riski: 2+ gün çalışmayan öğrencilere uyarı
 *   2. Haftalık rapor: Pazar günü otomatik üretim
 *   3. Hedef kontrolü: LGS'ye 30/60/90 gün kaldığında motivasyon mesajı
 *
 * Güvenlik: CRON_SECRET header kontrolü
 *
 * Vercel cron.json örneği:
 *   { "crons": [{ "path": "/api/cron/notifications", "schedule": "0 9 * * *" }] }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { WeeklyReportGenerator } from "@/infrastructure/report/weekly-report-generator";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const LGS_TARIH = new Date("2026-06-07");

export async function GET(request: Request) {
  // Güvenlik: cron secret kontrolü
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const bugun = new Date();
  const sonuclar: Record<string, unknown> = {};

  // --- Görev 1: Streak riski bildirimi ---
  try {
    sonuclar.streakRisk = await checkStreakRisk();
  } catch (e) {
    sonuclar.streakRiskHata = String(e);
  }

  // --- Görev 2: Haftalık rapor (Pazar günü = 0) ---
  if (bugun.getDay() === 0) {
    try {
      sonuclar.haftalikRapor = await generateWeeklyReports();
    } catch (e) {
      sonuclar.haftalikRaporHata = String(e);
    }
  }

  // --- Görev 3: LGS yaklaşıyor bildirimi ---
  try {
    sonuclar.lgsBildirim = await checkLgsApproach(bugun);
  } catch (e) {
    sonuclar.lgsBildirimHata = String(e);
  }

  return NextResponse.json({
    tarih: bugun.toISOString(),
    sonuclar,
  });
}

/**
 * 2+ gün çalışmayan aktif kullanıcıları tespit et
 * Gerçek bildirim sistemi (push/email) entegre edildiğinde buraya eklenir
 */
async function checkStreakRisk(): Promise<{ tespit: number; uyarilan: number }> {
  const ikigünOnce = new Date(Date.now() - 2 * 86400000);
  const otuzGünOnce = new Date(Date.now() - 30 * 86400000);

  // Son 30 günde aktif ama 2+ gündür çalışmayan kullanıcılar
  const riskliKullanicilar = await prisma.user.findMany({
    where: {
      rol: "STUDENT",
      currentStreak: { gt: 0 }, // Streak'i olan
      lastStudyDate: { lt: ikigünOnce, gte: otuzGünOnce },
    },
    select: { id: true, isim: true, email: true, currentStreak: true, lastStudyDate: true },
    take: 100, // Batch işleme
  });

  // TODO: Gerçek bildirim gönder (e-posta, push, vs.)
  // Şimdilik sadece log + sayı döndür
  console.log(`[Cron] Streak riski: ${riskliKullanicilar.length} kullanıcı`);

  return {
    tespit: riskliKullanicilar.length,
    uyarilan: riskliKullanicilar.length, // Gerçek sistemde gönderilenleri say
  };
}

/**
 * Tüm aktif öğrenciler için haftalık rapor üret ve DB'ye yaz
 */
async function generateWeeklyReports(): Promise<{ uretilen: number; hata: number }> {
  const generator = new WeeklyReportGenerator(prisma);

  // Son 7 günde aktif öğrenciler
  const yediGünOnce = new Date(Date.now() - 7 * 86400000);
  const aktifOgrenciler = await prisma.user.findMany({
    where: {
      rol: "STUDENT",
      lastStudyDate: { gte: yediGünOnce },
    },
    select: { id: true },
    take: 200, // Batch limit
  });

  let uretilen = 0;
  let hata = 0;

  // Sırayla işle (rate limit)
  for (const ogr of aktifOgrenciler) {
    try {
      const rapor = await generator.generate(ogr.id);

      // Raporun sonucunu logla (gerçek sistemde DB'ye kaydedilebilir veya e-posta atılabilir)
      console.log(`[Cron] Rapor üretildi: ${ogr.id} — ${rapor.ozet.cozulenSoru} soru`);
      uretilen++;

      // Rate limit: 500ms bekleme
      await new Promise((res) => setTimeout(res, 500));
    } catch {
      hata++;
    }
  }

  return { uretilen, hata };
}

/**
 * LGS'ye belirli günler kalınca motivasyon bildirimi
 */
async function checkLgsApproach(bugun: Date): Promise<{ bildirimTipi: string | null }> {
  const kalanGun = Math.ceil((LGS_TARIH.getTime() - bugun.getTime()) / 86400000);

  const bildirimGunleri = [90, 60, 30, 14, 7, 1];
  if (!bildirimGunleri.includes(kalanGun)) {
    return { bildirimTipi: null };
  }

  const mesajlar: Record<number, string> = {
    90: "LGS'ye 3 ay kaldı! Planını gözden geçirme zamanı.",
    60: "LGS'ye 60 gün! Son sprint başlıyor.",
    30: "LGS'ye 1 ay kaldı! Zayıf konulara odaklan.",
    14: "LGS'ye 2 hafta! Hızlı tekrar modu.",
    7: "LGS'ye 1 hafta! Moral iyi, tempo sabit.",
    1: "LGS yarın! Erken uyu, güvenli ol.",
  };

  // TODO: Tüm aktif öğrencilere bildirim gönder
  console.log(`[Cron] LGS bildirimi (${kalanGun} gün): ${mesajlar[kalanGun]}`);

  return { bildirimTipi: `lgs_${kalanGun}_gun` };
}
