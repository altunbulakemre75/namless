import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { MasteryCalculator } from "../../domain/assessment/services/mastery-calculator";
import { StudyPlanGenerator } from "../../domain/learning/services/study-plan-generator";
import { AttemptBaglam } from "../../domain/assessment/entities/attempt";
import { processDiagnostic } from "../../domain/assessment/services/diagnostic-processor";
import { searchRelevantContent } from "../../infrastructure/rag/search";
import { hybridSearch, formatChunksForPrompt } from "../../infrastructure/rag/hybrid-search";
import { analyzeWithSmartSolver } from "../../infrastructure/ai/smart-solver";
import { predictMastery } from "../../infrastructure/ai/mastery-predictor";
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
    .input(z.object({ stressModu: z.boolean().default(false), tamMod: z.boolean().default(true) }))
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

      // LGS gerçek soru dağılımı — mevcut soru sayısıyla sınırla
      const lgsHedef: Record<string, number> = input.tamMod
        ? { TURKCE: 20, MATEMATIK: 20, FEN: 20, SOSYAL: 10, INGILIZCE: 10, DIN: 10 }
        : { TURKCE: 4, MATEMATIK: 4, FEN: 4, SOSYAL: 2, INGILIZCE: 2, DIN: 2 };

      const secilenIds: string[] = [];
      const dersSoruSayisi: Record<string, number> = {};

      dersGruplari.forEach((dsSorular, ders) => {
        const hedef = lgsHedef[ders] ?? 2;
        const karisik = [...dsSorular].sort(() => Math.random() - 0.5);
        const secilen = karisik.slice(0, hedef);
        secilenIds.push(...secilen.map((q) => q.id));
        dersSoruSayisi[ders] = secilen.length;
      });

      const exam = await ctx.prisma.mockExam.create({
        data: {
          userId: ctx.user.id,
          toplamSoru: secilenIds.length,
          stressModu: input.stressModu,
          attemptIds: secilenIds,
        },
      });

      // LGS sırası: Türkçe → Matematik → Fen → Sosyal → Din → İngilizce
      const DERS_SIRA = ["TURKCE", "MATEMATIK", "FEN", "SOSYAL", "DIN", "INGILIZCE"];
      const secilenSorular = sorular
        .filter((q) => secilenIds.includes(q.id))
        .sort((a, b) => {
          const ai = DERS_SIRA.indexOf(a.topic.ders);
          const bi = DERS_SIRA.indexOf(b.topic.ders);
          return ai !== bi ? ai - bi : 0;
        })
        .map((q) => ({
          id: q.id,
          ders: q.topic.ders,
          konuIsim: q.topic.isim,
          soruMetni: q.soruMetni,
          siklar: q.siklar,
          zorluk: q.zorluk,
        }));

      return {
        examId: exam.id,
        stressModu: input.stressModu,
        tamMod: input.tamMod,
        toplamSoru: secilenIds.length,
        sureDakika: input.stressModu ? (input.tamMod ? 130 : 30) : 0,
        sorular: secilenSorular,
        dersSoruSayisi,
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

      // YEP puan tahmini: gerçek LGS'de 90 soruymuş gibi normalize et
      const LGS_SORU: Record<string, number> = { TURKCE: 20, MATEMATIK: 20, FEN: 20, SOSYAL: 10, INGILIZCE: 10, DIN: 10 };
      let tahminiDogru = 0;
      let toplamAgirlik = 0;
      for (const [ders, { dogru: d, toplam: t }] of Object.entries(dersBazinda)) {
        if (t > 0) {
          const oran = d / t;
          tahminiDogru += oran * (LGS_SORU[ders] ?? 0);
          toplamAgirlik += LGS_SORU[ders] ?? 0;
        }
      }
      const yepPuan = toplamAgirlik > 0
        ? Math.min(500, Math.round(100 + (tahminiDogru / 90) * 400))
        : null;

      return { net, kocYorumu, zayifDersler, dersBazinda, yepPuan };
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
    // upsert: kullanıcı yoksa oluştur (findUniqueOrThrow yerine)
    const user = await ctx.prisma.user.upsert({
      where: { id: ctx.user.id },
      update: {},
      create: {
        id: ctx.user.id,
        email: ctx.user.email!,
        isim: (ctx.user.user_metadata?.isim as string | undefined) ?? "Öğrenci",
      },
    });
    // targetSchool tablosu henuz yoksa (db push yapilmamissa) null don
    let targetSchool = null;
    if (user.targetSchoolId) {
      try {
        targetSchool = await ctx.prisma.school.findUnique({
          where: { id: user.targetSchoolId },
          select: { id: true, isim: true, sehir: true, minPuan: true },
        });
      } catch { /* schools tablosu yoksa atla */ }
    }
    return { ...user, targetSchool };
  }),

  // Profil güncelle: isim + günlük süre
  updateProfile: protectedProcedure
    .input(
      z.object({
        isim: z.string().min(2, "İsim en az 2 karakter olmalı").max(50, "İsim en fazla 50 karakter olabilir").optional(),
        dailyStudyMins: z.number().min(15).max(480).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, unknown> = {};
      if (input.isim !== undefined) data.isim = input.isim.trim();
      if (input.dailyStudyMins !== undefined) data.dailyStudyMins = input.dailyStudyMins;

      const updated = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data,
        select: { isim: true, dailyStudyMins: true, email: true },
      });
      return updated;
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

  // LGS'ye yetişecek acil plan oluştur
  regeneratePlan: protectedProcedure
    .input(z.object({ gunlukDakika: z.number().min(30).max(300) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const masteries = await ctx.prisma.mastery.findMany({ where: { userId } });
      if (masteries.length === 0) return { planId: null, olusturulanSessionSayisi: 0, gunlukDakika: input.gunlukDakika };

      // Eski planı sil
      await ctx.prisma.studyPlan.deleteMany({ where: { userId } });

      // LGS tarihine odaklı yeni plan üret
      const planData = planGenerator.generate({
        userId,
        masteries,
        hedefTarih: LGS_TARIHI,
        gunlukDakika: input.gunlukDakika,
      });

      const created = await ctx.prisma.studyPlan.create({
        data: {
          userId,
          hedefTarih: planData.hedefTarih,
          gunlukDakika: planData.gunlukDakika,
          planVersiyonu: planData.planVersiyonu,
          sessions: {
            create: planData.sessions.slice(0, 60).map((s) => ({
              tarih: s.tarih,
              hedefTopicIds: s.hedefTopicIds,
              tahminiSure: s.tahminiSure,
              durum: s.durum,
              attemptIds: [],
            })),
          },
        },
      });

      // Kullanıcının günlük süresini güncelle
      await ctx.prisma.user.update({
        where: { id: userId },
        data: { dailyStudyMins: input.gunlukDakika },
      });

      return { planId: created.id, olusturulanSessionSayisi: planData.sessions.length, gunlukDakika: input.gunlukDakika };
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

  // Takvim: çalışma planı oturumları (60 gün ileriye)
  getStudyCalendar: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const plan = await ctx.prisma.studyPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        sessions: {
          orderBy: { tarih: "asc" },
          take: 60,
          include: { studyPlan: { select: { gunlukDakika: true } } },
        },
      },
    });

    if (!plan) return { sessions: [], gunlukDakika: 60 };

    const sessions = await Promise.all(
      plan.sessions.map(async (s) => {
        const topics = s.hedefTopicIds.length > 0
          ? await ctx.prisma.topic.findMany({
              where: { id: { in: s.hedefTopicIds } },
              select: { id: true, isim: true, ders: true },
            })
          : [];
        return {
          id: s.id,
          tarih: s.tarih,
          durum: s.durum,
          tahminiSure: s.tahminiSure,
          konular: topics,
        };
      })
    );

    return { sessions, gunlukDakika: plan.gunlukDakika };
  }),

  // Oturumu tamamlandı olarak işaretle
  completeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.dailySession.findFirstOrThrow({
        where: { id: input.sessionId, studyPlan: { userId: ctx.user.id } },
      });
      await ctx.prisma.dailySession.update({
        where: { id: session.id },
        data: { durum: "DONE" },
      });
      return { tamamlandi: true };
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

      // Hibrit RAG: topicId + fuzzy + ders fallback + mastery reranking
      const hybridChunks = await hybridSearch(ctx.prisma, {
        topicId: input.topicId,
        topicIsim: topic.isim,
        ders: topic.ders,
        masterySkoru: mastery?.skor ?? 30,
        limit: 4,
      });

      // Fallback: chunk yoksa eski basit arama dene
      const ragResults = hybridChunks.length > 0
        ? hybridChunks.map((c) => ({ icerik: c.icerik, bolum: c.bolum, kaynak: c.kaynak, similarity: c.skor }))
        : await searchRelevantContent(ctx.prisma, {
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

      return {
        anlatim,
        topicIsim: topic.isim,
        ders: topic.ders,
        ragKaynak: ragResults.length > 0,
        hybridKullanildi: hybridChunks.length > 0,
      };
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

      // NOT: Attempt immutable — hataKategorisi attempt'e yazılmaz.
      // Analiz sonucu yalnızca dönüş değeri olarak kullanılır.

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

      // NOT: Attempt immutable — hataKategorisi attempt'e yazılmaz.
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

  // Smart solver — mutation (imperatively triggered from UI after wrong answer)
  runSmartSolver: protectedProcedure
    .input(z.object({ attemptId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const attempt = await ctx.prisma.attempt.findUniqueOrThrow({
        where: { id: input.attemptId },
        include: { question: { select: { soruMetni: true, siklar: true, dogruSik: true, topicId: true } } },
      });
      if (attempt.userId !== userId) throw new Error("Yetkisiz erişim");
      if (attempt.dogruMu) return null;

      const mastery = await ctx.prisma.mastery.findUnique({
        where: { userId_topicId: { userId, topicId: attempt.question.topicId } },
      });

      return analyzeWithSmartSolver({
        soruMetni: attempt.question.soruMetni,
        siklar: attempt.question.siklar,
        dogruSik: attempt.question.dogruSik,
        secilenSik: attempt.secilenSik,
        masterySkoru: mastery?.skor ?? 30,
      });
    }),

  // ==================== GENEL MASTERY TAHMİN (Dashboard için) ====================

  getOverallMasteryPrediction: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const altmisGunOnce = new Date(Date.now() - 60 * 86400000);

    // En zayıf 3 konu
    const zayifMasteries = await ctx.prisma.mastery.findMany({
      where: { userId },
      orderBy: { skor: "asc" },
      take: 3,
      include: { topic: { select: { id: true, isim: true, ders: true } } },
    });

    if (zayifMasteries.length === 0) return null;

    // Her zayıf konu için tahmin üret
    const tahminler = await Promise.all(
      zayifMasteries.map(async (m) => {
        const attempts = await ctx.prisma.attempt.findMany({
          where: { userId, question: { topicId: m.topicId }, tarih: { gte: altmisGunOnce } },
          orderBy: { tarih: "asc" },
          select: { dogruMu: true, tarih: true },
        });

        const gunlukGrup = new Map<string, { dogru: number; toplam: number }>();
        for (const a of attempts) {
          const tarihStr = a.tarih.toISOString().slice(0, 10);
          if (!gunlukGrup.has(tarihStr)) gunlukGrup.set(tarihStr, { dogru: 0, toplam: 0 });
          const g = gunlukGrup.get(tarihStr)!;
          g.toplam++;
          if (a.dogruMu) g.dogru++;
        }

        const dataPoints = [...gunlukGrup.entries()].map(([tarihStr, g]) => ({
          tarih: new Date(tarihStr),
          skor: Math.round((g.dogru / g.toplam) * 100),
        }));

        const p = predictMastery(dataPoints, m.skor);
        return {
          topicId: m.topicId,
          topicIsim: m.topic.isim,
          ders: m.topic.ders,
          mevcutSkor: p.mevcutSkor,
          tahminiLgsSkor: p.tahminiLgsSkor,
          trend: p.trend,
          lgsDaysLeft: p.lgsDaysLeft,
        };
      })
    );

    // Genel hazırlık ortalaması
    const genelOrtalama = Math.round(
      tahminler.reduce((s, t) => s + t.tahminiLgsSkor, 0) / tahminler.length
    );

    return { tahminler, genelOrtalama, lgsDaysLeft: tahminler[0]?.lgsDaysLeft ?? 0 };
  }),

  // ==================== SMART SOLVER (DeepTutor çift döngü) ====================

  getSmartSolverAnalysis: protectedProcedure
    .input(z.object({ attemptId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const attempt = await ctx.prisma.attempt.findUniqueOrThrow({
        where: { id: input.attemptId },
        include: { question: { include: { topic: true } } },
      });

      if (attempt.userId !== userId) throw new Error("Yetkisiz erişim");
      if (attempt.dogruMu) return null;

      const mastery = await ctx.prisma.mastery.findUnique({
        where: { userId_topicId: { userId, topicId: attempt.question.topicId } },
      });

      const result = await analyzeWithSmartSolver({
        soruMetni: attempt.question.soruMetni,
        siklar: attempt.question.siklar,
        dogruSik: attempt.question.dogruSik,
        secilenSik: attempt.secilenSik,
        masterySkoru: mastery?.skor ?? 30,
      });

      // NOT: Attempt immutable — hataKategorisi attempt'e yazılmaz.
      return result;
    }),

  // ==================== MASTERY TAHMİN (Kronos lineer regresyon) ====================

  getMasteryPrediction: protectedProcedure
    .input(z.object({ topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Son 60 günlük mastery geçmişi — attempt verilerinden hesapla
      const altmisGunOnce = new Date(Date.now() - 60 * 86400000);
      const attempts = await ctx.prisma.attempt.findMany({
        where: { userId, question: { topicId: input.topicId }, tarih: { gte: altmisGunOnce } },
        orderBy: { tarih: "asc" },
        select: { dogruMu: true, tarih: true },
      });

      // Haftalık mastery tahmini hesapla (günlük grup)
      const gunlukGrup = new Map<string, { dogru: number; toplam: number }>();
      for (const a of attempts) {
        const tarihStr = a.tarih.toISOString().slice(0, 10);
        if (!gunlukGrup.has(tarihStr)) gunlukGrup.set(tarihStr, { dogru: 0, toplam: 0 });
        const g = gunlukGrup.get(tarihStr)!;
        g.toplam++;
        if (a.dogruMu) g.dogru++;
      }

      const dataPoints = [...gunlukGrup.entries()].map(([tarihStr, g]) => ({
        tarih: new Date(tarihStr),
        skor: Math.round((g.dogru / g.toplam) * 100),
      }));

      const mastery = await ctx.prisma.mastery.findUnique({
        where: { userId_topicId: { userId, topicId: input.topicId } },
      });

      const prediction = predictMastery(dataPoints, mastery?.skor ?? undefined);
      return { ...prediction, topicId: input.topicId };
    }),

  // Hibrit RAG arama (gelişmiş)
  getHybridContent: protectedProcedure
    .input(z.object({ topicId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const topic = await ctx.prisma.topic.findUniqueOrThrow({
        where: { id: input.topicId },
        select: { isim: true, ders: true },
      });
      const mastery = await ctx.prisma.mastery.findUnique({
        where: { userId_topicId: { userId, topicId: input.topicId } },
      });

      const chunks = await hybridSearch(ctx.prisma, {
        topicId: input.topicId,
        topicIsim: topic.isim,
        ders: topic.ders,
        masterySkoru: mastery?.skor ?? 50,
        limit: 5,
      });

      return {
        chunks,
        formattedText: formatChunksForPrompt(chunks),
        kaynak: chunks.length > 0 ? "kitap" : "yok",
      };
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

  // ─── VELİ PANELİ ──────────────────────────────────────────────────────────

  // Veli, öğrenci e-postasıyla çocuğunu hesabına bağlar
  veliBagla: protectedProcedure
    .input(z.object({ cocukEmail: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const cocuk = await ctx.prisma.user.findUnique({
        where: { email: input.cocukEmail },
      });
      if (!cocuk) {
        throw new Error("Bu e-posta ile kayıtlı öğrenci bulunamadı.");
      }
      if (cocuk.id === ctx.user.id) {
        throw new Error("Kendi hesabınızı bağlayamazsınız.");
      }
      await ctx.prisma.user.update({
        where: { id: cocuk.id },
        data: { parentId: ctx.user.id },
      });
      return { basarili: true, cocukIsim: cocuk.isim };
    }),

  // Veli paneli verisi — tüm bağlı çocukların istatistikleri
  getVeliDashboard: protectedProcedure.query(async ({ ctx }) => {
    const cocuklar = await ctx.prisma.user.findMany({
      where: { parentId: ctx.user.id },
      include: {
        masteries: { include: { topic: { select: { ders: true, isim: true } } } },
        attempts: {
          orderBy: { tarih: "desc" },
          take: 30,
          select: { dogruMu: true, tarih: true, sureMs: true },
        },
      },
    });

    return cocuklar.map((c) => {
      const toplamAttempt = c.attempts.length;
      const dogruSayisi = c.attempts.filter((a) => a.dogruMu).length;
      const basariYuzdesi = toplamAttempt > 0 ? Math.round((dogruSayisi / toplamAttempt) * 100) : 0;

      const dersMastery: Record<string, number> = {};
      for (const m of c.masteries) {
        const ders = m.topic.ders;
        if (!dersMastery[ders]) dersMastery[ders] = 0;
        dersMastery[ders] = Math.max(dersMastery[ders], m.skor);
      }

      return {
        id: c.id,
        isim: c.isim,
        email: c.email,
        currentStreak: c.currentStreak,
        longestStreak: c.longestStreak,
        lastStudyDate: c.lastStudyDate,
        basariYuzdesi,
        toplamAttempt,
        dersMastery,
      };
    });
  }),

  // ─── LGS PUAN TAHMİNİ ─────────────────────────────────────────────────────

  getLgsPuanTahmini: protectedProcedure.query(async ({ ctx }) => {
    const masteries = await ctx.prisma.mastery.findMany({
      where: { userId: ctx.user.id },
      include: { topic: { select: { ders: true } } },
    });

    const LGS_SORU_SAYISI: Record<string, number> = {
      TURKCE: 20, MATEMATIK: 20, FEN: 20, SOSYAL: 10, DIN: 10, INGILIZCE: 10,
    };

    // Her ders için ortalama mastery
    const dersSkorlar: Record<string, number[]> = {};
    for (const m of masteries) {
      const ders = m.topic.ders;
      if (!dersSkorlar[ders]) dersSkorlar[ders] = [];
      dersSkorlar[ders].push(m.skor);
    }

    let toplamTahminiDogru = 0;
    const dersDetay: Record<string, { mastery: number; tahminiDogru: number; soruSayisi: number }> = {};

    for (const [ders, soruSayisi] of Object.entries(LGS_SORU_SAYISI)) {
      const skorlar = dersSkorlar[ders] ?? [];
      const ort = skorlar.length ? skorlar.reduce((a, b) => a + b, 0) / skorlar.length : 0;
      const tahminiDogru = Math.round((ort / 100) * soruSayisi);
      toplamTahminiDogru += tahminiDogru;
      dersDetay[ders] = { mastery: Math.round(ort), tahminiDogru, soruSayisi };
    }

    // YEP puanı tahmini: minimum 100, maksimum 500
    const yepPuan = Math.min(500, Math.round(100 + (toplamTahminiDogru / 90) * 400));

    // Eşleşen okullar
    let eslesenOkullar: Array<{ id: string; isim: string; sehir: string; minPuan: number; tur: string }> = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schoolPrisma = ctx.prisma as any;
      eslesenOkullar = await schoolPrisma.school.findMany({
        where: { minPuan: { lte: yepPuan } },
        orderBy: { minPuan: "desc" },
        take: 5,
        select: { id: true, isim: true, sehir: true, minPuan: true, tur: true },
      });
    } catch {
      // Schools tablosu boşsa devam et
    }

    return { toplamTahminiDogru, toplamSoru: 90, yepPuan, dersDetay, eslesenOkullar };
  }),
});
