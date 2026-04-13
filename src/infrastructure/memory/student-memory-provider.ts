/**
 * Student Memory Provider
 *
 * Hermes'in MemoryProvider arayüzünün LGS uyarlaması.
 * - prefetch(): Oturum öncesi öğrenci profilini çeker
 * - syncAfterSession(): Oturum sonrası hafızayı günceller
 * - buildPromptContext(): AI prompt'una eklenecek bağlamı oluşturur
 */

import { PrismaClient } from "@prisma/client";

export interface StudentContext {
  seviye: "baslangic" | "orta" | "ileri";
  masterySkoru: number;
  zayifKonular: string[];
  gucluKonular: string[];
  hataEgilimi: string | null;
  ogrenmeStili: string | null;
  motivasyonNotu: string | null;
  sonOturumOzeti: string | null;
  toplamOturum: number;
  toplamSureDk: number;
  stilSkorlari: Record<string, number>;
}

export class StudentMemoryProvider {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Oturum öncesi öğrenci bağlamını çek
   * Hermes: prefetch()
   */
  async prefetch(userId: string, topicId?: string): Promise<StudentContext> {
    const [memory, masteries, recentAttempts] = await Promise.all([
      this.prisma.studentMemory.findUnique({ where: { userId } }),
      this.prisma.mastery.findMany({
        where: { userId },
        include: { topic: { select: { isim: true, ders: true } } },
        orderBy: { skor: "asc" },
      }),
      this.prisma.attempt.findMany({
        where: { userId, tarih: { gte: new Date(Date.now() - 30 * 86400000) } },
        select: { dogruMu: true, hataKategorisi: true },
        orderBy: { tarih: "desc" },
        take: 100,
      }),
    ]);

    // Ortalama mastery
    const avgMastery = masteries.length > 0
      ? masteries.reduce((s, m) => s + m.skor, 0) / masteries.length
      : 30;

    const seviye: "baslangic" | "orta" | "ileri" =
      avgMastery >= 70 ? "ileri" : avgMastery >= 40 ? "orta" : "baslangic";

    // Zayıf ve güçlü konuları mastery'den hesapla
    const zayifKonular = masteries
      .filter((m) => m.skor < 40)
      .slice(0, 5)
      .map((m) => m.topic.isim);

    const gucluKonular = masteries
      .filter((m) => m.skor >= 70)
      .slice(-5)
      .map((m) => m.topic.isim);

    // Hata eğilimi (son 30 gün)
    const hatalar = recentAttempts
      .filter((a) => !a.dogruMu && a.hataKategorisi)
      .map((a) => a.hataKategorisi!);
    const hataFreq = new Map<string, number>();
    hatalar.forEach((h) => hataFreq.set(h, (hataFreq.get(h) ?? 0) + 1));
    const enSikHata = [...hataFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      seviye,
      masterySkoru: Math.round(avgMastery),
      zayifKonular: memory?.zayifKonular ?? zayifKonular,
      gucluKonular: memory?.gucluKonular ?? gucluKonular,
      hataEgilimi: memory?.hataEgilimi ?? enSikHata,
      ogrenmeStili: memory?.ogrenmeStili ?? null,
      motivasyonNotu: memory?.motivasyonNotu ?? null,
      sonOturumOzeti: memory?.sonOturumOzeti ?? null,
      toplamOturum: memory?.toplamOturum ?? 0,
      toplamSureDk: memory?.toplamSureDk ?? 0,
      stilSkorlari: (memory?.stilSkorlari as Record<string, number>) ?? {},
    };
  }

  /**
   * Oturum sonrası hafızayı güncelle
   * Hermes: sync_turn()
   */
  async syncAfterSession(
    userId: string,
    oturumSonucu: {
      topicId: string;
      topicIsim: string;
      dogruSayisi: number;
      yanlisSayisi: number;
      hataKategorileri: string[];
      kullanilanStil?: string;
      oncekiMastery: number;
      sonrakiMastery: number;
      sureDk: number;
    }
  ): Promise<void> {
    const mevcut = await this.prisma.studentMemory.findUnique({ where: { userId } });

    // Hata eğilimi güncelle
    const hataFreq = new Map<string, number>();
    oturumSonucu.hataKategorileri.forEach((h) =>
      hataFreq.set(h, (hataFreq.get(h) ?? 0) + 1)
    );
    const yeniHataEgilimi = [...hataFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? mevcut?.hataEgilimi;

    // Stil skorlarını güncelle
    const stilSkorlari = ((mevcut?.stilSkorlari as Record<string, number>) ?? {});
    if (oturumSonucu.kullanilanStil) {
      const masteryFark = oturumSonucu.sonrakiMastery - oturumSonucu.oncekiMastery;
      stilSkorlari[oturumSonucu.kullanilanStil] =
        (stilSkorlari[oturumSonucu.kullanilanStil] ?? 0) + masteryFark;
    }

    // En etkili stili bul
    const enIyiStil = Object.entries(stilSkorlari).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Zayıf/güçlü konuları mastery'ye göre güncelle
    const masteries = await this.prisma.mastery.findMany({
      where: { userId },
      include: { topic: { select: { isim: true } } },
      orderBy: { skor: "asc" },
    });

    const zayifKonular = masteries.filter((m) => m.skor < 40).slice(0, 8).map((m) => m.topic.isim);
    const gucluKonular = masteries.filter((m) => m.skor >= 70).slice(-8).map((m) => m.topic.isim);

    // Oturum özeti
    const oran = oturumSonucu.dogruSayisi + oturumSonucu.yanlisSayisi > 0
      ? Math.round((oturumSonucu.dogruSayisi / (oturumSonucu.dogruSayisi + oturumSonucu.yanlisSayisi)) * 100)
      : 0;
    const sonOturumOzeti = `${oturumSonucu.topicIsim}: ${oturumSonucu.dogruSayisi}/${oturumSonucu.dogruSayisi + oturumSonucu.yanlisSayisi} doğru (%${oran})`;

    await this.prisma.studentMemory.upsert({
      where: { userId },
      update: {
        zayifKonular,
        gucluKonular,
        hataEgilimi: yeniHataEgilimi,
        ogrenmeStili: enIyiStil,
        sonOturumOzeti,
        toplamOturum: { increment: 1 },
        toplamSureDk: { increment: oturumSonucu.sureDk },
        stilSkorlari,
        sonGuncelleme: new Date(),
      },
      create: {
        userId,
        zayifKonular,
        gucluKonular,
        hataEgilimi: yeniHataEgilimi,
        ogrenmeStili: enIyiStil,
        sonOturumOzeti,
        toplamOturum: 1,
        toplamSureDk: oturumSonucu.sureDk,
        stilSkorlari,
      },
    });
  }

  /**
   * AI prompt'una eklenecek öğrenci bağlamı
   * Hermes: build_system_prompt()
   */
  buildPromptContext(ctx: StudentContext): string {
    const parts = [
      `ÖĞRENCİ PROFİLİ:`,
      `- Seviye: ${ctx.seviye} (%${ctx.masterySkoru} mastery)`,
    ];

    if (ctx.ogrenmeStili) {
      parts.push(`- Öğrenme stili: ${ctx.ogrenmeStili} (bu stille daha iyi öğreniyor)`);
    }
    if (ctx.hataEgilimi) {
      parts.push(`- Sık yapılan hata: ${ctx.hataEgilimi}`);
    }
    if (ctx.zayifKonular.length > 0) {
      parts.push(`- Zayıf konular: ${ctx.zayifKonular.slice(0, 5).join(", ")}`);
    }
    if (ctx.gucluKonular.length > 0) {
      parts.push(`- Güçlü konular: ${ctx.gucluKonular.slice(0, 5).join(", ")}`);
    }
    if (ctx.motivasyonNotu) {
      parts.push(`- ${ctx.motivasyonNotu}`);
    }
    if (ctx.sonOturumOzeti) {
      parts.push(`- Son oturum: ${ctx.sonOturumOzeti}`);
    }

    return parts.join("\n");
  }
}
