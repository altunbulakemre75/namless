import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { MasteryCalculator } from "../../domain/assessment/services/mastery-calculator";
import { StudyPlanGenerator } from "../../domain/learning/services/study-plan-generator";
import { AttemptBaglam } from "../../domain/assessment/entities/attempt";

const masteryCalc = new MasteryCalculator();
const planGenerator = new StudyPlanGenerator();

export const assessmentRouter = router({
  // Seviye belirleme testi sorularini getir
  getDiagnosticQuestions: publicProcedure.query(async ({ ctx }) => {
    const questions = await ctx.prisma.question.findMany({
      where: { validationStatus: "PUBLISHED" },
      include: { topic: true },
      take: 30,
    });

    // Ders bazinda dengeli dagitim
    const shuffled = questions.sort(() => Math.random() - 0.5);

    return shuffled.map((q) => ({
      id: q.id,
      ders: q.topic.ders,
      konuIsim: q.topic.isim,
      soruMetni: q.soruMetni,
      siklar: q.siklar,
      zorluk: q.zorluk,
    }));
  }),

  // Cevap gonder (event olarak kaydedilir)
  submitAnswer: protectedProcedure
    .input(
      z.object({
        questionId: z.string().uuid(),
        secilenSik: z.number().min(0).max(3),
        sureMs: z.number().positive(),
        baglam: z.enum(["DIAGNOSTIC", "DAILY", "REVIEW", "MOCK_EXAM"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const question = await ctx.prisma.question.findUniqueOrThrow({
        where: { id: input.questionId },
      });

      const dogruMu = question.dogruSik === input.secilenSik;

      // Attempt EVENT kaydet — asla guncellenmiyor
      await ctx.prisma.attempt.create({
        data: {
          userId: ctx.user.id,
          questionId: input.questionId,
          secilenSik: input.secilenSik,
          dogruMu,
          sureMs: input.sureMs,
          baglam: input.baglam,
        },
      });

      return {
        dogruMu,
        dogruSik: question.dogruSik,
        aciklama: question.aciklama,
      };
    }),

  // Diagnostic bitti — mastery hesapla + plan uret
  completeDiagnostic: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Son diagnostic attempt'leri getir
    const attempts = await ctx.prisma.attempt.findMany({
      where: { userId, baglam: "DIAGNOSTIC" },
      include: { question: { include: { topic: true } } },
      orderBy: { tarih: "desc" },
      take: 50,
    });

    // Topic bazinda grupla ve mastery hesapla
    const topicGroups = new Map<string, typeof attempts>();
    attempts.forEach((a) => {
      const tid = a.question.topicId;
      if (!topicGroups.has(tid)) topicGroups.set(tid, []);
      topicGroups.get(tid)!.push(a);
    });

    // Mastery upsert
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
        update: {
          skor: mastery.skor,
          guvenAraligi: mastery.guvenAraligi,
          sonGuncelleme: mastery.sonGuncelleme,
        },
        create: {
          userId,
          topicId,
          skor: mastery.skor,
          guvenAraligi: mastery.guvenAraligi,
        },
      });

      masteries.push(mastery);
    }

    // Calisma plani uret (LGS = Haziran 2025 ikinci hafta)
    const lgsGunu = new Date("2026-06-07");
    const planData = planGenerator.generate({
      userId,
      masteries,
      hedefTarih: lgsGunu,
      gunlukDakika: 60,
    });

    // Eski plani sil, yenisini kaydet
    await ctx.prisma.studyPlan.deleteMany({ where: { userId } });
    await ctx.prisma.studyPlan.create({
      data: {
        userId,
        hedefTarih: planData.hedefTarih,
        gunlukDakika: planData.gunlukDakika,
        planVersiyonu: planData.planVersiyonu,
        sessions: {
          create: planData.sessions.map((s) => ({
            tarih: s.tarih,
            hedefTopicIds: s.hedefTopicIds,
            tahminiSure: s.tahminiSure,
            durum: s.durum,
            attemptIds: [],
          })),
        },
      },
    });

    // Ozet donus
    const dersBazindaSkor = Object.fromEntries(
      Array.from(topicGroups.entries()).map(([topicId, att]) => {
        const ders = att[0].question.topic.ders;
        const dogru = att.filter((a) => a.dogruMu).length;
        return [ders, Math.round((dogru / att.length) * 100)];
      })
    );

    return {
      masteriSayisi: masteries.length,
      dersBazindaSkor,
      planOlusturuldu: true,
    };
  }),

  // Kullanici mastery skorlari
  getMasteries: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.mastery.findMany({
      where: { userId: ctx.user.id },
      include: { topic: true },
      orderBy: { skor: "asc" },
    });
  }),

  // Bugunun oturumu
  getTodaySession: protectedProcedure.query(async ({ ctx }) => {
    const plan = await ctx.prisma.studyPlan.findFirst({
      where: { userId: ctx.user.id },
      include: {
        sessions: {
          where: {
            durum: { not: "DONE" },
          },
          orderBy: { tarih: "asc" },
          take: 1,
          include: {
            studyPlan: false,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!plan || plan.sessions.length === 0) return null;

    const session = plan.sessions[0];

    // Konuya ait sorulari getir
    const questions = await ctx.prisma.question.findMany({
      where: {
        topicId: { in: session.hedefTopicIds },
        validationStatus: "PUBLISHED",
      },
      include: { topic: true },
      take: 15,
    });

    return {
      sessionId: session.id,
      tarih: session.tarih,
      tahminiSure: session.tahminiSure,
      questions: questions
        .sort(() => Math.random() - 0.5)
        .map((q) => ({
          id: q.id,
          ders: q.topic.ders,
          konuIsim: q.topic.isim,
          soruMetni: q.soruMetni,
          siklar: q.siklar,
          zorluk: q.zorluk,
        })),
    };
  }),
});
