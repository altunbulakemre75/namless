/**
 * Haftalık Rapor Motoru
 *
 * BettaFish ReportEngine konseptinin LGS uyarlaması.
 * Öğrenci + veli için haftalık ilerleme raporu üretir.
 */

import { PrismaClient } from "@prisma/client";
import { getModelForTask } from "../ai/model-router";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", INGILIZCE: "İngilizce", DIN: "Din Kültürü",
};

export interface DersIlerleme {
  ders: string;
  dersIsim: string;
  ortMastery: number;
  masteryDegisim: number; // + veya -
  cozulenSoru: number;
  dogruOrani: number;
}

export interface WeeklyReport {
  baslik: string;
  tarihAraligi: { baslangic: string; bitis: string };
  ogrenci: { isim: string; hedefOkul?: string | null };

  ozet: {
    toplamCalismaSureDk: number;
    cozulenSoru: number;
    dogruOrani: number;
    streak: number;
    netDegisim: number;
  };

  dersBazinda: DersIlerleme[];

  zayifKonular: Array<{ isim: string; ders: string; skor: number }>;
  enCokGelisen: Array<{ isim: string; ders: string; degisim: number }>;

  haftaninOnerisi: string;
  veliAksiyonu: string;
}

export class WeeklyReportGenerator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async generate(userId: string): Promise<WeeklyReport> {
    const yediGunOnce = new Date(Date.now() - 7 * 86400000);
    const bugun = new Date();

    const [user, attempts, studySessions, masteries] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { targetSchool: { select: { isim: true } } },
      }),
      this.prisma.attempt.findMany({
        where: { userId, tarih: { gte: yediGunOnce } },
        include: { question: { select: { topic: { select: { ders: true, isim: true } } } } },
      }),
      this.prisma.studySession.findMany({
        where: { userId, tarih: { gte: yediGunOnce } },
      }),
      this.prisma.mastery.findMany({
        where: { userId },
        include: { topic: { select: { isim: true, ders: true } } },
      }),
    ]);

    const toplamSureDk = studySessions.reduce((s, ss) => s + ss.sureDk, 0);
    const dogruSayisi = attempts.filter((a) => a.dogruMu).length;
    const dogruOrani = attempts.length > 0 ? dogruSayisi / attempts.length : 0;

    // Ders bazında ilerleme
    const dersGruplari = new Map<string, typeof attempts>();
    attempts.forEach((a) => {
      const d = a.question.topic.ders;
      if (!dersGruplari.has(d)) dersGruplari.set(d, []);
      dersGruplari.get(d)!.push(a);
    });

    const dersMastery = new Map<string, number[]>();
    masteries.forEach((m) => {
      const d = m.topic.ders;
      if (!dersMastery.has(d)) dersMastery.set(d, []);
      dersMastery.get(d)!.push(m.skor);
    });

    const dersBazinda: DersIlerleme[] = [];
    for (const [ders, dersAttempts] of dersGruplari) {
      const dDogru = dersAttempts.filter((a) => a.dogruMu).length;
      const skorlar = dersMastery.get(ders) ?? [];
      const ortMastery = skorlar.length > 0
        ? Math.round(skorlar.reduce((s, v) => s + v, 0) / skorlar.length)
        : 0;

      dersBazinda.push({
        ders,
        dersIsim: DERS_ISIM[ders] ?? ders,
        ortMastery,
        masteryDegisim: 0, // Basitleştirilmiş — geçmiş snapshot yok
        cozulenSoru: dersAttempts.length,
        dogruOrani: dersAttempts.length > 0 ? Math.round((dDogru / dersAttempts.length) * 100) : 0,
      });
    }

    // Zayıf konular
    const zayifKonular = masteries
      .filter((m) => m.skor < 50)
      .sort((a, b) => a.skor - b.skor)
      .slice(0, 5)
      .map((m) => ({ isim: m.topic.isim, ders: m.topic.ders, skor: Math.round(m.skor) }));

    // En çok gelişen (basitleştirilmiş — sadece yüksek mastery'ler)
    const enCokGelisen = masteries
      .filter((m) => m.skor >= 60)
      .sort((a, b) => b.skor - a.skor)
      .slice(0, 3)
      .map((m) => ({ isim: m.topic.isim, ders: m.topic.ders, degisim: Math.round(m.skor) }));

    // AI koç yorumu ve veli aksiyonu
    const haftaninOnerisi = await this.generateAIComment(
      "koc", toplamSureDk, dogruOrani, zayifKonular, user.currentStreak
    );

    const veliAksiyonu = await this.generateAIComment(
      "veli", toplamSureDk, dogruOrani, zayifKonular, user.currentStreak
    );

    return {
      baslik: `Haftalık İlerleme Raporu`,
      tarihAraligi: {
        baslangic: yediGunOnce.toISOString().slice(0, 10),
        bitis: bugun.toISOString().slice(0, 10),
      },
      ogrenci: {
        isim: user.isim,
        hedefOkul: user.targetSchool?.isim ?? null,
      },
      ozet: {
        toplamCalismaSureDk: toplamSureDk,
        cozulenSoru: attempts.length,
        dogruOrani: Math.round(dogruOrani * 100),
        streak: user.currentStreak,
        netDegisim: 0,
      },
      dersBazinda,
      zayifKonular,
      enCokGelisen,
      haftaninOnerisi,
      veliAksiyonu,
    };
  }

  private async generateAIComment(
    tip: "koc" | "veli",
    sureDk: number,
    dogruOrani: number,
    zayifKonular: Array<{ isim: string }>,
    streak: number,
  ): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith("buraya")) {
      return tip === "koc"
        ? "Bu hafta çalışmaya devam et!"
        : "Çocuğunuzun düzenli çalışmasını destekleyin.";
    }

    const config = getModelForTask("koc_yorumu");
    const lgsGun = Math.ceil((new Date("2026-06-07").getTime() - Date.now()) / 86400000);

    const prompt = tip === "koc"
      ? `Bir LGS koçusun. Öğrenciye haftalık yorum yaz.
Süre: ${sureDk}dk, Doğru oranı: %${Math.round(dogruOrani * 100)}, Seri: ${streak} gün.
Zayıf konular: ${zayifKonular.map((z) => z.isim).join(", ") || "yok"}.
LGS'ye ${lgsGun} gün kaldı. 2-3 cümle, motive edici, somut öneri ver.`
      : `Bir eğitim danışmanısın. Veliye çocuğunun haftalık performansını özetle.
Süre: ${sureDk}dk, Doğru oranı: %${Math.round(dogruOrani * 100)}.
Zayıf konular: ${zayifKonular.map((z) => z.isim).join(", ") || "yok"}.
2 cümle. Somut bir veli aksiyonu öner.`;

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 200,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw new Error("API hata");
      const data = await response.json();
      return data.content?.[0]?.text ?? "Çalışmaya devam!";
    } catch {
      return tip === "koc"
        ? "Bu hafta düzenli çalışmaya devam et!"
        : "Çocuğunuzun düzenli çalışmasını destekleyin.";
    }
  }
}
