import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { MasteryCalculator } from "../../domain/assessment/services/mastery-calculator";
import { StudyPlanGenerator } from "../../domain/learning/services/study-plan-generator";
import { AttemptBaglam } from "../../domain/assessment/entities/attempt";

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

      // 1. Attempt'leri kaydet
      for (const cevap of input.cevaplar) {
        await ctx.prisma.attempt.create({
          data: {
            userId,
            questionId: cevap.questionId,
            secilenSik: cevap.secilenSik,
            dogruMu: cevap.dogruMu,
            sureMs: 30000, // ortalama tahmin
            baglam: "DIAGNOSTIC",
          },
        });
      }

      // 2. Topic bazinda mastery hesapla
      const attempts = await ctx.prisma.attempt.findMany({
        where: { userId, baglam: "DIAGNOSTIC" },
        include: { question: true },
      });

      const topicGroups = new Map<string, typeof attempts>();
      attempts.forEach((a) => {
        const tid = a.question.topicId;
        if (!topicGroups.has(tid)) topicGroups.set(tid, []);
        topicGroups.get(tid)!.push(a);
      });

      const masteries = [];
      for (const [topicId, topicAttempts] of topicGroups) {
        const domainAttempts = topicAttempts.map((a) => ({
          id: a.id,
          userId: a.userId,
          questionId: a.questionId,
          secilenSik: a.secilenSik,
          dogruMu: a.dogruMu,
          sureMs: a.sureMs,
          tarih: a.tarih,
          baglam: a.baglam as AttemptBaglam,
        }));
        const mastery = masteryCalc.calculate(userId, topicId, domainAttempts);
        await ctx.prisma.mastery.upsert({
          where: { userId_topicId: { userId, topicId } },
          update: { skor: mastery.skor, guvenAraligi: mastery.guvenAraligi, sonGuncelleme: new Date() },
          create: { userId, topicId, skor: mastery.skor, guvenAraligi: mastery.guvenAraligi },
        });
        masteries.push(mastery);
      }

      // 3. Calisma plani olustur
      const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
      const planData = planGenerator.generate({
        userId,
        masteries,
        hedefTarih: LGS_TARIHI,
        gunlukDakika: user?.dailyStudyMins ?? 60,
      });

      await ctx.prisma.studyPlan.deleteMany({ where: { userId } });
      await ctx.prisma.studyPlan.create({
        data: {
          userId,
          hedefTarih: planData.hedefTarih,
          gunlukDakika: planData.gunlukDakika,
          planVersiyonu: planData.planVersiyonu,
          sessions: {
            create: planData.sessions.slice(0, 30).map((s) => ({
              tarih: s.tarih,
              hedefTopicIds: s.hedefTopicIds,
              tahminiSure: s.tahminiSure,
              durum: s.durum,
              attemptIds: [],
            })),
          },
        },
      });

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

      // Basit tahmin: mastery ortalamasina gore
      const masteries = await ctx.prisma.mastery.findMany({
        where: { userId: ctx.user.id },
      });
      const avgMastery = masteries.length > 0
        ? masteries.reduce((s, m) => s + m.skor, 0) / masteries.length
        : 30;

      // Kalan gun ve tahmini hazir olma tarihi
      const puanFarki = Math.max(0, school.minPuan - avgMastery * 5);
      const gunlukKazanim = (input.dailyStudyMins / 60) * 2; // saat basina ~2 puan
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

      return {
        okul: school.isim,
        tahminiGun,
        estimatedDate,
      };
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
        yeniStreak = 1; // seri kirildi
      }
      // ayni gun ise degismesin
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
      // LGS formati: 20 soru, dengeli dagilim
      const sorular = await ctx.prisma.question.findMany({
        where: { validationStatus: "PUBLISHED" },
        include: { topic: true },
      });

      // Ders bazinda dengeli sec
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
        }));

      return {
        examId: exam.id,
        stressModu: input.stressModu,
        toplamSoru: secilenIds.length,
        sureDakika: input.stressModu ? Math.ceil(secilenIds.length * 1.5) : 0,
        sorular: secilenSorular,
      };
    }),

  // Sprint 6: Deneme sinavi bitir + koc yorumu
  completeMockExam: protectedProcedure
    .input(
      z.object({
        examId: z.string(),
        dogruSayisi: z.number(),
        yanlisSayisi: z.number(),
        bosSayisi: z.number(),
        dersBazinda: z.record(z.string(), z.object({ dogru: z.number(), toplam: z.number() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const net = input.dogruSayisi - input.yanlisSayisi / 3;

      // Basit koc yorumu olustur
      const zayifDersler = Object.entries(input.dersBazinda)
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
        data: {
          bitisTarihi: new Date(),
          dogruSayisi: input.dogruSayisi,
          yanlisSayisi: input.yanlisSayisi,
          bosSayisi: input.bosSayisi,
          netPuan: net,
          kocYorumu,
        },
      });

      return { net, kocYorumu };
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
    return ctx.prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      include: { targetSchool: true },
    });
  }),
});
