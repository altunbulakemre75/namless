import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { MasteryCalculator } from "../../domain/assessment/services/mastery-calculator";
import { StudyPlanGenerator } from "../../domain/learning/services/study-plan-generator";
import { AttemptBaglam } from "../../domain/assessment/entities/attempt";
import { processDiagnostic } from "../../domain/assessment/services/diagnostic-processor";
import { searchRelevantContent } from "../../infrastructure/rag/search";
import {
  generatePersonalizedLesson,
  analyzeWrongAnswer,
  generateCoachComment,
  generateHint,
} from "../../infrastructure/ai/prompt-engine";
import { getCachedOrGenerate } from "../../infrastructure/cache/redis";
import { StudentMemoryProvider } from "../../infrastructure/memory/student-memory-provider";
import { WeeklyReportGenerator } from "../../infrastructure/report/weekly-report-generator";
import { runExpertPanel, shouldTriggerExpertPanel } from "../../infrastructure/ai/expert-panel";

const masteryCalc = new MasteryCalculator();
const planGenerator = new StudyPlanGenerator();

const LGS_TARIHI = new Date("2026-06-07");

export const learningRouter = router({
  // Sprint 1: localStorage diagnostic sonuclarini DB'ye aktar + plan olustur
  transferDiagnostic: protectedProcedure
    .input(
      z.object({
        cevaplar: z.array(
          z.object({
            questionId: z.string(),
            secilenSik: z.number(),
            dogruMu: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      await ctx.prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: ctx.user.email!,
          isim: (ctx.user.user_metadata?.isim as string | undefined) ?? "Öğrenci",
        },
      });

      for (const cevap of input.cevaplar) {
        await ctx.prisma.attempt.create({
          data: {
            userId,
            questionId: cevap.questionId,
            secilenSik: cevap.secilenSik,
            dogruMu: cevap.dogruMu,
            sureMs: 30000,
            baglam: "DIAGNOSTIC",
          },
        });
      }

      const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
      const { masteries } = await processDiagnostic(ctx.prisma, userId, user?.dailyStudyMins ?? 60);

      return { basarili: true, masterySayisi: masteries.length };
    }),

  // Sprint 4: Hedef okul sec
  setTargetSchool: protectedProcedure
    .input(
      z.object({
        schoolId: z.string(),
        dailyStudyMins: z.number().min(30).max(300),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const school = await ctx.prisma.school.findUniqueOrThrow({
        where: { id: input.schoolId },
      });

      const masteries = await ctx.prisma.mastery.findMany({
        where: { userId: ctx.user.id },
      });
      const avgMastery = masteries.length > 0
        ? masteries.reduce((s, m) => s + m.skor, 0) / masteries.length
        : 30;

      const puanFarki = Math.max(0, school.minPuan - avgMastery * 5);
      const gunlukKazanim = (input.dailyStudyMins / 60) * 2;
      const tahminiGun = Math.ceil(puanFarki / gunlukKazanim) || 30;
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + tahminiGun);

      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          targetSchoolId: input.schoolId,
          dailyStudyMins: input.dailyStudyMins,
          estimatedReadyDate: estimatedDate,
        },
      });

      return { okul: school.isim, tahminiGun, estimatedDate };
    }),

  // Sprint 4: Okullari listele
  getSchools: publicProcedure
    .input(z.object({ sehir: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.school.findMany({
        where: input?.sehir ? { sehir: input.sehir } : {},
        orderBy: { minPuan: "desc" },
      });
    }),

  // Sprint 6: Streak guncelle
  updateStreak: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
    });

    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    const dun = new Date(bugun);
    dun.setDate(dun.getDate() - 1);

    let yeniStreak = user.currentStreak;

    if (user.lastStudyDate) {
      const sonCalismaTarihi = new Date(user.lastStudyDate);
      sonCalismaTarihi.setHours(0, 0, 0, 0);

      if (sonCalismaTarihi.getTime() === dun.getTime()) {
        yeniStreak += 1;
      } else if (sonCalismaTarihi.getTime() < dun.getTime()) {
        yeniStreak = 1;
      }
    } else {
      yeniStreak = 1;
    }

    const enUzun = Math.max(yeniStreak, user.longestStreak);

    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        currentStreak: yeniStreak,
        longestStreak: enUzun,
        lastStudyDate: new Date(),
      },
    });

    return { streak: yeniStreak, enUzun };
  }),

  // Sprint 6: Deneme sinavi olustur
  createMockExam: protectedProcedure
    .input(z.object({ stressModu: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const sorular = await ctx.prisma.question.findMany({
        where: { validationStatus: "PUBLISHED" },
        include: { topic: true },
      });

      const dersGruplari = new Map<string, typeof sorular>();
      sorular.forEach((q) => {
        const d = q.topic.ders;
        if (!dersGruplari.has(d)) dersGruplari.set(d, []);
        dersGruplari.get(d)!.push(q);
      });

      const secilenIds: string[] = [];
      const lgsOranlar: Record<string, number> = {
        TURKCE: 5, MATEMATIK: 5, FEN: 5, SOSYAL: 3, INGILIZCE: 1, DIN: 1,
      };

      dersGruplari.forEach((dsSorular, ders) => {
        const hedef = lgsOranlar[ders] ?? 2;
        const karisik = [...dsSorular].sort(() => Math.random() - 0.5);
        secilenIds.push(...karisik.slice(0, hedef).map((q) => q.id));
      });

      const exam = await ctx.prisma.mockExam.create({
        data: {
          userId: ctx.user.id,
          toplamSoru: secilenIds.length,
          stressModu: input.stressModu,
          attemptIds: secilenIds,
        },
      });

      const secilenSorular = sorular
        .filter((q) => secilenIds.includes(q.id))
        .map((q) => ({
          id: q.id,
          ders: q.topic.ders,
          konuIsim: q.topic.isim,
          soruMetni: q.soruMetni,
          siklar: q.siklar,
          zorluk: q.zorluk,
          // dogruSik client'a gönderilmiyor — server-side kontrol edilecek
        }));

      return {
        examId: exam.id,
        stressModu: input.stressModu,
        toplamSoru: secilenIds.length,
        sureDakika: input.stressModu ? Math.ceil(secilenIds.length * 1.5) : 0,
        sorular: secilenSorular,
      };
    }),

  // Sprint 6: Deneme sinavi bitir + koc yorumu (server-side dogru/yanlis kontrolu)
  completeMockExam: protectedProcedure
    .input(
      z.object({
        examId: z.string(),
        cevaplar: z.array(z.object({
          questionId: z.string(),
          secilenSik: z.number().min(-1).max(3), // -1 = boş bırakıldı
        })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      let dogru = 0, yanlis = 0, bos = 0;
      const dersBazinda: Record<string, { dogru: number; toplam: number }> = {};

      for (const cevap of input.cevaplar) {
        const soru = await ctx.prisma.question.findUniqueOrThrow({
          where: { id: cevap.questionId },
          include: { topic: { select: { ders: true } } },
        });
        const ders = soru.topic.ders;
        if (!dersBazinda[ders]) dersBazinda[ders] = { dogru: 0, toplam: 0 };
        dersBazinda[ders].toplam++;

        if (cevap.secilenSik === -1) {
          bos++;
        } else {
          const dogruMu = soru.dogruSik === cevap.secilenSik;
          if (dogruMu) { dogru++; dersBazinda[ders].dogru++; } else { yanlis++; }
          await ctx.prisma.attempt.create({
            data: { userId, questionId: cevap.questionId, secilenSik: cevap.secilenSik, dogruMu, sureMs: 0, baglam: "MOCK_EXAM" },
          });
        }
      }

      const net = dogru - yanlis / 3;
      const zayifDersler = Object.entries(dersBazinda)
        .filter(([, v]) => v.toplam > 0 && v.dogru / v.toplam < 0.5)
        .map(([ders]) => ders);

      const dersIsim: Record<string, string> = {
        MATEMATIK: "Matematik", FEN: "Fen", TURKCE: "Türkçe",
        SOSYAL: "Sosyal", INGILIZCE: "İngilizce", DIN: "Din",
      };

      let kocYorumu = `Bu denemede ${net.toFixed(1)} net yaptın. `;
      if (zayifDersler.length > 0) {
        kocYorumu += `${zayifDersler.map((d) => dersIsim[d] ?? d).join(" ve ")} derslerinde düşüyorsun. Bu hafta bu konulara odaklan.`;
      } else {
        kocYorumu += "Tüm derslerde dengeli bir performans gösterdin. Böyle devam et!";
      }

      await ctx.prisma.mockExam.update({
        where: { id: input.examId },
        data: { bitisTarihi: new Date(), dogruSayisi: dogru, yanlisSayisi: yanlis, bosSayisi: bos, netPuan: net, kocYorumu },
      });

      return { net, kocYorumu, zayifDersler, dersBazinda };
    }),

  // Sprint 5: Konu listesi (serbest mod)
  getTopicsForBrowse: publicProcedure
    .input(z.object({ ders: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const where = input?.ders
        ? { ders: input.ders as "MATEMATIK" | "FEN" | "TURKCE" | "SOSYAL" | "INGILIZCE" | "DIN", parentId: null as string | null }
        : { parentId: null as string | null };

      return ctx.prisma.topic.findMany({
        where,
        include: {
          children: {
            include: {
              children: true,
              _count: { select: { questions: true } },
            },
            orderBy: { isim: "asc" },
          },
          _count: { select: { questions: true } },
        },
        orderBy: { ders: "asc" },
      });
    }),

  // Kullanici profili (dashboard icin)
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
    });
    // targetSchool tablosu henuz yoksa (db push yapilmamissa) null don
    const targetSchool = user.targetSchoolId
      ? await ctx.prisma.school.findUnique({
          where: { id: user.targetSchoolId },
          select: { id: true, isim: true, sehir: true, minPuan: true },
        })
      : null;
    return { ...user, targetSchool };
  }),

  // Deneme sonrasi otomatik plan olustur
  createPlanFromExam: protectedProcedure
    .input(z.object({
      zayifDersler: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const zayifTopics = await ctx.prisma.topic.findMany({
        where: {
          ders: { in: input.zayifDersler as ("MATEMATIK"|"FEN"|"TURKCE"|"SOSYAL"|"INGILIZCE"|"DIN")[] },
          parentId: null,
        },
        include: { children: true },
      });
      const masteries = await ctx.prisma.mastery.findMany({ where: { userId } });
      const masteryMap = new Map(masteries.map((m) => [m.topicId, m.skor]));
      const tumKonular = zayifTopics.flatMap((t) => t.children.length > 0 ? t.children : [t]);
      const oncelikliKonular = tumKonular
        .sort((a, b) => (masteryMap.get(a.id) ?? 0) - (masteryMap.get(b.id) ?? 0))
        .slice(0, 20);
      if (oncelikliKonular.length === 0) return { planOlusturuldu: false };
      const masteryNesneleri = oncelikliKonular.map((topic) => ({
        userId, topicId: topic.id,
        skor: masteryMap.get(topic.id) ?? 20,
        guvenAraligi: 25, sonGuncelleme: new Date(), versiyon: 1,
      }));
      const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
      const planData = planGenerator.generate({
        userId, masteries: masteryNesneleri,
        hedefTarih: LGS_TARIHI, gunlukDakika: user?.dailyStudyMins ?? 60,
      });
      await ctx.prisma.studyPlan.deleteMany({ where: { userId } });
      await ctx.prisma.studyPlan.create({
        data: {
          userId, hedefTarih: planData.hedefTarih,
          gunlukDakika: planData.gunlukDakika, planVersiyonu: planData.planVersiyonu,
          sessions: {
            create: planData.sessions.slice(0, 30).map((s) => ({
              tarih: s.tarih, hedefTopicIds: s.hedefTopicIds,
              tahminiSure: s.tahminiSure, durum: s.durum, attemptIds: [],
            })),
          },
        },
      });
      return { planOlusturuldu: true, konuSayisi: oncelikliKonular.length };
    }),

  // Sure kaydet
  recordStudyTime: protectedProcedure
    .input(z.object({
      sureDk: z.number().min(1).max(480),
      tip: z.enum(["KONU", "SORU", "DENEME"]),
      topicId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const bugun = new Date(); bugun.setHours(0,0,0,0);
      await ctx.prisma.studySession.create({
        data: { userId, topicId: input.topicId, tip: input.tip, sureDk: input.sureDk },
      });
      const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
      const bugunMu = user?.lastActiveDate &&
        new Date(user.lastActiveDate).setHours(0,0,0,0) === bugun.getTime();
      const haftaBasi = new Date(bugun);
      haftaBasi.setDate(haftaBasi.getDate() - haftaBasi.getDay());
      const haftaIciMi = user?.lastActiveDate &&
        new Date(user.lastActiveDate) >= haftaBasi;
      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          dailyActiveMinutes: bugunMu ? { increment: input.sureDk } : input.sureDk,
          weeklyActiveMinutes: haftaIciMi ? { increment: input.sureDk } : input.sureDk,
          lastActiveDate: new Date(),
        },
      });
      return { kaydedildi: true };
    }),

  // Sure istatistikleri
  getStudyStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const bugun = new Date(); bugun.setHours(0,0,0,0);
    const haftaBasi = new Date(bugun);
    haftaBasi.setDate(bugun.getDate() - bugun.getDay());
    const haftaOturumlari = await ctx.prisma.studySession.findMany({
      where: { userId, tarih: { gte: haftaBasi } },
    });
    const gunlukDk = haftaOturumlari
      .filter((s) => new Date(s.tarih) >= bugun)
      .reduce((sum, s) => sum + s.sureDk, 0);
    const haftalikDk = haftaOturumlari.reduce((sum, s) => sum + s.sureDk, 0);
    return { gunlukDk, haftalikDk, oturumSayisi: haftaOturumlari.length };
  }),

  // Konu anlatimi getir (PDF + AI + manuel)
  // Not: aiAnlatim ve pdfUrl alanlari schema'ya eklendi — npx prisma generate sonrasi aktif olur
  getKonuAnlatim: publicProcedure
    .input(z.object({ topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (ctx.prisma.topic as any).findUnique({
        where: { id: input.topicId },
        select: {
          id: true, isim: true, ders: true,
          aiAnlatim: true, pdfUrl: true, videoUrl: true, dersIcerigi: true,
        },
      });
    }),

  // Adaptif soru secimi
  getAdaptiveQuestions: protectedProcedure
    .input(z.object({ topicId: z.string(), adet: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { topicId, adet } = input;

      const YEDIgun = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const OTUZgun = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [tumSorular, sonAttemptler, mastery] = await Promise.all([
        ctx.prisma.question.findMany({
          where: { topicId, validationStatus: "PUBLISHED" },
          select: { id: true, soruMetni: true, siklar: true, dogruSik: true, aciklama: true, zorluk: true },
        }),
        ctx.prisma.attempt.findMany({
          where: { userId, question: { topicId }, tarih: { gte: OTUZgun } },
          orderBy: { tarih: "desc" },
          select: { questionId: true, dogruMu: true, tarih: true },
        }),
        ctx.prisma.mastery.findUnique({ where: { userId_topicId: { userId, topicId } } }),
      ]);

      const masterySkoru = mastery?.skor ?? 50;
      const soruDurumu = new Map<string, { dogruMu: boolean; tarih: Date }>();
      for (const a of sonAttemptler) {
        if (!soruDurumu.has(a.questionId))
          soruDurumu.set(a.questionId, { dogruMu: a.dogruMu, tarih: a.tarih });
      }

      const hedefZorluk = masterySkoru < 40 ? 1 : masterySkoru < 70 ? 2 : 3;

      const agirlikliSorular = tumSorular.map((s) => {
        const durum = soruDurumu.get(s.id);
        let agirlik: number;
        let oncelik: string;
        if (!durum) { agirlik = 5; oncelik = "Yeni"; }
        else if (!durum.dogruMu && durum.tarih >= YEDIgun) { agirlik = 10; oncelik = "Son hafta yanlış"; }
        else if (!durum.dogruMu) { agirlik = 7; oncelik = "Eski yanlış"; }
        else if (durum.tarih >= YEDIgun) { agirlik = 1; oncelik = "Son hafta doğru"; }
        else { agirlik = 3; oncelik = "Eski doğru"; }

        if (s.zorluk === hedefZorluk) agirlik *= 1.5;
        return { ...s, agirlik, oncelik };
      });

      agirlikliSorular.sort((a, b) => b.agirlik - a.agirlik);
      return { sorular: agirlikliSorular.slice(0, adet), masterySkoru };
    }),

  // Mastery guncelle (review sonrasi)
  updateMasteryFromReview: protectedProcedure
    .input(z.object({ topicId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const OTUZgun = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const attempts = await ctx.prisma.attempt.findMany({
        where: { userId, question: { topicId: input.topicId }, tarih: { gte: OTUZgun } },
        include: { question: { include: { topic: { select: { ders: true } } } } },
        orderBy: { tarih: "desc" },
      });

      if (attempts.length === 0) return { guncellendi: false };

      const domainAttempts = attempts.map((a) => ({
        id: a.id, userId: a.userId, questionId: a.questionId,
        secilenSik: a.secilenSik, dogruMu: a.dogruMu,
        sureMs: a.sureMs, tarih: a.tarih, baglam: a.baglam as AttemptBaglam,
      }));

      const m = masteryCalc.calculate(userId, input.topicId, domainAttempts);
      await ctx.prisma.mastery.upsert({
        where: { userId_topicId: { userId, topicId: input.topicId } },
        update: { skor: m.skor, guvenAraligi: m.guvenAraligi, sonGuncelleme: new Date(), versiyon: { increment: 1 } },
        create: { userId, topicId: input.topicId, skor: m.skor, guvenAraligi: m.guvenAraligi },
      });

      return { guncellendi: true, yeniSkor: m.skor };
    }),

  // Hata kategorisi kaydet
  kategorizeHata: protectedProcedure
    .input(z.object({
      attemptId: z.string(),
      kategori: z.enum(["DIKKATSIZLIK", "KAVRAM_EKSIK", "KONU_ATLAMA", "ZAMAN_BASKISI", "BILINMIYOR"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.attempt.update({
        where: { id: input.attemptId },
        data: { hataKategorisi: input.kategori },
      });
      return { kaydedildi: true };
    }),

  // Zayif konular listesi
  getWeakTopics: protectedProcedure
    .input(z.object({
      ders: z.string().optional(),
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const masteries = await ctx.prisma.mastery.findMany({
        where: {
          userId,
          ...(input.ders ? { topic: { ders: input.ders as "MATEMATIK"|"FEN"|"TURKCE"|"SOSYAL"|"INGILIZCE"|"DIN" } } : {}),
        },
        include: { topic: { select: { isim: true, ders: true } } },
        orderBy: { skor: "asc" },
        take: input.limit,
      });

      return masteries.map((m) => ({
        topicId: m.topicId,
        isim: m.topic.isim,
        ders: m.topic.ders,
        skor: m.skor,
        oncelik: m.skor < 40 ? "ACIL" : m.skor < 65 ? "ORTA" : "IYI",
      }));
    }),

  // Konu gecmis oturumlari
  getTopicSessionHistory: protectedProcedure
    .input(z.object({ topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const OTUZgun = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const attempts = await ctx.prisma.attempt.findMany({
        where: { userId, question: { topicId: input.topicId }, tarih: { gte: OTUZgun } },
        orderBy: { tarih: "desc" },
        select: { dogruMu: true, tarih: true },
      });

      const gunGruplari = new Map<string, { dogru: number; toplam: number }>();
      for (const a of attempts) {
        const gun = a.tarih.toISOString().slice(0, 10);
        if (!gunGruplari.has(gun)) gunGruplari.set(gun, { dogru: 0, toplam: 0 });
        const g = gunGruplari.get(gun)!;
        g.toplam++;
        if (a.dogruMu) g.dogru++;
      }

      const oturumlar = Array.from(gunGruplari.entries())
        .map(([tarih, v]) => ({ tarih, ...v, oran: Math.round((v.dogru / v.toplam) * 100) }))
        .sort((a, b) => a.tarih.localeCompare(b.tarih))
        .slice(-5);

      let trend: "YUKSELIYOR" | "DUSUYOR" | "YOK" = "YOK";
      if (oturumlar.length >= 2) {
        const ilk = oturumlar[0].oran;
        const son = oturumlar[oturumlar.length - 1].oran;
        trend = son > ilk + 5 ? "YUKSELIYOR" : son < ilk - 5 ? "DUSUYOR" : "YOK";
      }

      return { oturumlar, trend, toplamOturum: gunGruplari.size };
    }),

  // Bir sonraki onerilecek konu
  getNextRecommendedTopic: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const plan = await ctx.prisma.studyPlan.findFirst({
      where: { userId },
      include: { sessions: { where: { durum: "PENDING" }, orderBy: { tarih: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });

    if (plan?.sessions[0]?.hedefTopicIds[0]) {
      const topicId = plan.sessions[0].hedefTopicIds[0];
      const topic = await ctx.prisma.topic.findUnique({ where: { id: topicId }, select: { id: true, isim: true, ders: true } });
      if (topic) return { topicId: topic.id, isim: topic.isim, ders: topic.ders, kaynak: "plan" };
    }

    const enZayif = await ctx.prisma.mastery.findFirst({
      where: { userId },
      orderBy: { skor: "asc" },
      include: { topic: { select: { id: true, isim: true, ders: true } } },
    });

    if (enZayif) {
      return { topicId: enZayif.topicId, isim: enZayif.topic.isim, ders: enZayif.topic.ders, kaynak: "mastery" };
    }

    const topics = await ctx.prisma.topic.findMany({
      where: { questions: { some: { validationStatus: "PUBLISHED" } } },
      select: { id: true, isim: true, ders: true },
      take: 5,
    });
    if (topics.length > 0) {
      const t = topics[Math.floor(Math.random() * topics.length)];
      return { topicId: t.id, isim: t.isim, ders: t.ders, kaynak: "rastgele" };
    }

    return null;
  }),

  // ==================== FAZ 3: AI PROMPT ENGINE ENDPOINTS ====================

  // Kişiselleştirilmiş ders anlatımı
  getPersonalizedLesson: protectedProcedure
    .input(z.object({ topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const topic = await ctx.prisma.topic.findUniqueOrThrow({
        where: { id: input.topicId },
        select: { id: true, isim: true, ders: true, aiAnlatim: true },
      });

      const mastery = await ctx.prisma.mastery.findUnique({
        where: { userId_topicId: { userId, topicId: input.topicId } },
      });

      const learningProfile = await ctx.prisma.learningProfile.findUnique({
        where: { userId },
      });

      const ragResults = await searchRelevantContent(ctx.prisma, {
        topicId: input.topicId,
        topicIsim: topic.isim,
        ders: topic.ders,
        limit: 3,
      });

      const seviye = (mastery?.skor ?? 30) < 40 ? "baslangic" : (mastery?.skor ?? 30) < 70 ? "orta" : "ileri";
      const cacheKey = `lesson:${input.topicId}:${seviye}`;

      const anlatim = await getCachedOrGenerate(cacheKey, 3600, () =>
        generatePersonalizedLesson(
          topic.isim,
          topic.ders,
          ragResults,
          {
            masteryScore: mastery?.skor ?? 30,
            enEtkiliStil: learningProfile?.enEtkiliStil ?? null,
            ortCozumSureMs: learningProfile?.ortCozumSureMs ?? 30000,
          }
        )
      );

      return { anlatim, topicIsim: topic.isim, ders: topic.ders, ragKaynak: ragResults.length > 0 };
    }),

  // Yanlış cevap analizi
  getWrongAnswerAnalysis: protectedProcedure
    .input(z.object({ attemptId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const attempt = await ctx.prisma.attempt.findUniqueOrThrow({
        where: { id: input.attemptId },
        include: { question: { include: { topic: true } } },
      });

      if (attempt.userId !== userId) throw new Error("Yetkisiz erişim");
      if (attempt.dogruMu) return { hataKategorisi: null, aciklama: "Bu soruyu doğru cevapladın!", oneri: null };

      const mastery = await ctx.prisma.mastery.findUnique({
        where: { userId_topicId: { userId, topicId: attempt.question.topicId } },
      });

      const learningProfile = await ctx.prisma.learningProfile.findUnique({
        where: { userId },
      });

      const ragResults = await searchRelevantContent(ctx.prisma, {
        topicId: attempt.question.topicId,
        topicIsim: attempt.question.topic.isim,
        ders: attempt.question.topic.ders,
        limit: 2,
      });

      const analysis = await analyzeWrongAnswer(
        attempt.question.soruMetni,
        attempt.question.siklar,
        attempt.question.dogruSik,
        attempt.secilenSik,
        ragResults,
        {
          masteryScore: mastery?.skor ?? 30,
          ortCozumSureMs: learningProfile?.ortCozumSureMs ?? 30000,
        }
      );

      // Hata kategorisini attempt'e kaydet
      if (analysis.hataKategorisi && analysis.hataKategorisi !== "BILINMIYOR") {
        await ctx.prisma.attempt.update({
          where: { id: input.attemptId },
          data: { hataKategorisi: analysis.hataKategorisi as "KAVRAM_EKSIK" | "DIKKATSIZLIK" | "KONU_ATLAMA" | "ZAMAN_BASKISI" },
        });
      }

      return analysis;
    }),

  // Koç yorumu (haftalık)
  getCoachComment: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const yediGunOnce = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [attempts, masteries, user] = await Promise.all([
      ctx.prisma.attempt.findMany({
        where: { userId, tarih: { gte: yediGunOnce } },
        include: { question: { select: { topic: { select: { ders: true } } } } },
      }),
      ctx.prisma.mastery.findMany({
        where: { userId },
        include: { topic: { select: { ders: true } } },
      }),
      ctx.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ]);

    const toplamSoru = attempts.length;
    const dogruSayisi = attempts.filter((a) => a.dogruMu).length;
    const dogruOrani = toplamSoru > 0 ? dogruSayisi / toplamSoru : 0;

    // Hata kategorileri
    const hatalar = attempts
      .filter((a) => !a.dogruMu && a.hataKategorisi)
      .map((a) => a.hataKategorisi!);
    const hataFreq = new Map<string, number>();
    hatalar.forEach((h) => hataFreq.set(h, (hataFreq.get(h) ?? 0) + 1));
    const enCokHata = [...hataFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "BILINMIYOR";

    // Ders bazında
    const dersSkoru = new Map<string, number[]>();
    masteries.forEach((m) => {
      const d = m.topic.ders;
      if (!dersSkoru.has(d)) dersSkoru.set(d, []);
      dersSkoru.get(d)!.push(m.skor);
    });

    const zayifDersler: string[] = [];
    const gucluDersler: string[] = [];
    dersSkoru.forEach((skorlar, ders) => {
      const avg = skorlar.reduce((s, v) => s + v, 0) / skorlar.length;
      if (avg < 50) zayifDersler.push(ders);
      else if (avg >= 70) gucluDersler.push(ders);
    });

    const bugunStr = new Date().toISOString().slice(0, 10);
    const coachCacheKey = `coach:${userId}:${bugunStr}`;

    const yorum = await getCachedOrGenerate(coachCacheKey, 43200, () =>
      generateCoachComment({
        toplamSoru,
        dogruOrani,
        streak: user.currentStreak,
        enCokHata,
        zayifDersler,
        gucluDersler,
        masteryDegisim: {},
      })
    );

    return { yorum, toplamSoru, dogruOrani, streak: user.currentStreak };
  }),

  // Soru ipucu
  getQuestionHint: protectedProcedure
    .input(z.object({ soruMetni: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const mastery = await ctx.prisma.mastery.findFirst({
        where: { userId },
        orderBy: { skor: "asc" },
      });

      const hint = await generateHint(input.soruMetni, {
        masteryScore: mastery?.skor ?? 50,
      });

      return { ipucu: hint };
    }),

  // Öğrenme profili güncelle
  updateLearningProfile: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const OTUZgun = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const attempts = await ctx.prisma.attempt.findMany({
      where: { userId, tarih: { gte: OTUZgun } },
      select: { sureMs: true, dogruMu: true, hataKategorisi: true, tarih: true },
    });

    if (attempts.length === 0) return { guncellendi: false };

    // Ortalama çözüm süresi
    const ortCozumSureMs = Math.round(
      attempts.reduce((s, a) => s + a.sureMs, 0) / attempts.length
    );

    // En aktif saat
    const saatFreq = new Map<number, number>();
    attempts.forEach((a) => {
      const saat = new Date(a.tarih).getHours();
      saatFreq.set(saat, (saatFreq.get(saat) ?? 0) + 1);
    });
    const enAktifSaat = [...saatFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Zayıf nokta özeti
    const hatalar = attempts.filter((a) => !a.dogruMu && a.hataKategorisi);
    const hataFreq = new Map<string, number>();
    hatalar.forEach((a) => hataFreq.set(a.hataKategorisi!, (hataFreq.get(a.hataKategorisi!) ?? 0) + 1));
    const zayifNoktaOzeti = [...hataFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    await ctx.prisma.learningProfile.upsert({
      where: { userId },
      update: { ortCozumSureMs, enAktifSaat, zayifNoktaOzeti, sonGuncelleme: new Date() },
      create: { userId, ortCozumSureMs, enAktifSaat, zayifNoktaOzeti },
    });

    return { guncellendi: true, ortCozumSureMs, enAktifSaat };
  }),

  // ==================== HAFTALIK RAPOR ====================

  getWeeklyReport: protectedProcedure.query(async ({ ctx }) => {
    const generator = new WeeklyReportGenerator(ctx.prisma);
    return generator.generate(ctx.user.id);
  }),

  // ==================== UZMAN PANEL (Multi-Agent) ====================

  getExpertPanelAnalysis: protectedProcedure
    .input(z.object({
      attemptId: z.string(),
      manuelTetik: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const attempt = await ctx.prisma.attempt.findUniqueOrThrow({
        where: { id: input.attemptId },
        include: { question: { include: { topic: true } } },
      });

      if (attempt.userId !== userId) throw new Error("Yetkisiz erişim");
      if (attempt.dogruMu) return null;

      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: userId } });

      // Aynı konuda kaç kez yanlış?
      const tekrarYanlis = await ctx.prisma.attempt.count({
        where: { userId, dogruMu: false, question: { topicId: attempt.question.topicId } },
      });

      const tetikle = shouldTriggerExpertPanel({
        isPremium: user.subscriptionTier !== "FREE",
        zorluk: attempt.question.zorluk,
        tekrarYanlisSayisi: tekrarYanlis,
        manuelTetik: input.manuelTetik,
      });

      if (!tetikle) return { tetiklendi: false, neden: "Koşullar sağlanmadı" };

      // Öğrenci bağlamı
      const memProvider = new StudentMemoryProvider(ctx.prisma);
      const studentCtx = await memProvider.prefetch(userId);
      const promptCtx = memProvider.buildPromptContext(studentCtx);

      const result = await runExpertPanel(
        attempt.question.soruMetni,
        attempt.question.siklar,
        attempt.question.dogruSik,
        attempt.secilenSik,
        promptCtx,
      );

      // Hata kategorisini kaydet
      if (result.hataKategorisi && result.hataKategorisi !== "BILINMIYOR") {
        await ctx.prisma.attempt.update({
          where: { id: input.attemptId },
          data: { hataKategorisi: result.hataKategorisi as "KAVRAM_EKSIK" | "DIKKATSIZLIK" | "KONU_ATLAMA" | "ZAMAN_BASKISI" },
        });
      }

      return { tetiklendi: true, ...result };
    }),

  // ==================== HAFIZA SİSTEMİ (Hermes uyarlaması) ====================

  // Oturum öncesi öğrenci bağlamını çek
  getStudentContext: protectedProcedure
    .input(z.object({ topicId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const provider = new StudentMemoryProvider(ctx.prisma);
      return provider.prefetch(ctx.user.id, input?.topicId);
    }),

  // Oturum sonrası hafızayı güncelle
  syncSessionMemory: protectedProcedure
    .input(z.object({
      topicId: z.string(),
      topicIsim: z.string(),
      dogruSayisi: z.number(),
      yanlisSayisi: z.number(),
      hataKategorileri: z.array(z.string()),
      kullanilanStil: z.string().optional(),
      oncekiMastery: z.number(),
      sonrakiMastery: z.number(),
      sureDk: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const provider = new StudentMemoryProvider(ctx.prisma);
      await provider.syncAfterSession(ctx.user.id, input);
      return { basarili: true };
    }),

  // Konu detayi
  getTopicDetail: protectedProcedure
    .input(z.object({ topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topicPrisma = ctx.prisma.topic as any;
      const [rawTopic, mastery] = await Promise.all([
        topicPrisma.findUniqueOrThrow({
          where: { id: input.topicId },
          include: {
            children: { select: { id: true, isim: true } },
            questions: {
              where: { validationStatus: "PUBLISHED" },
              select: { id: true, soruMetni: true, siklar: true, dogruSik: true, aciklama: true, zorluk: true },
            },
            _count: { select: { questions: true } },
          },
        }),
        ctx.prisma.mastery.findUnique({ where: { userId_topicId: { userId, topicId: input.topicId } } }),
      ]);

      // aiAnlatim ve pdfUrl: schema'ya eklendi, prisma generate sonrasi typed olur
      const topic = rawTopic as typeof rawTopic & { aiAnlatim?: string | null; pdfUrl?: string | null };
      return { topic, mastery };
    }),
});
