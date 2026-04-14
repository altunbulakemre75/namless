import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { processDiagnostic } from "../../domain/assessment/services/diagnostic-processor";

export const assessmentRouter = router({
  // Seviye belirleme testi sorularini getir
  getDiagnosticQuestions: publicProcedure.query(async ({ ctx }) => {
    const questions = await ctx.prisma.question.findMany({
      where: { validationStatus: "PUBLISHED" },
      include: { topic: true },
    });

    // Ders bazinda dengeli dagitim: her dersten en fazla 5 soru
    const dersGruplari = new Map<string, typeof questions>();
    questions.forEach((q) => {
      const d = q.topic.ders;
      if (!dersGruplari.has(d)) dersGruplari.set(d, []);
      dersGruplari.get(d)!.push(q);
    });

    const secilen: typeof questions = [];
    dersGruplari.forEach((dsSorular) => {
      const karisik = [...dsSorular].sort(() => Math.random() - 0.5);
      secilen.push(...karisik.slice(0, 5));
    });

    return secilen.sort(() => Math.random() - 0.5).map((q) => ({
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
      const userId = ctx.user.id;

      // Prisma User satiri yoksa olustur
      await ctx.prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: ctx.user.email!,
          isim: (ctx.user.user_metadata?.isim as string | undefined) ?? "Öğrenci",
        },
      });

      const question = await ctx.prisma.question.findUniqueOrThrow({
        where: { id: input.questionId },
      });

      const dogruMu = question.dogruSik === input.secilenSik;

      // Attempt EVENT kaydet — asla guncellenmiyor
      const attempt = await ctx.prisma.attempt.create({
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
        attemptId: attempt.id,
      };
    }),

  // Diagnostic bitti — mastery hesapla + plan uret
  completeDiagnostic: protectedProcedure.mutation(async ({ ctx }) => {
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

    const { masteries, topicGroups } = await processDiagnostic(ctx.prisma, userId, 60);

    const dersBazindaSkor = Object.fromEntries(
      Array.from(topicGroups.entries()).map(([, att]) => {
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

  // Session tamamla: durum DONE yap + streak guncelle
  completeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Session'i DONE'a cevir
      await ctx.prisma.dailySession.update({
        where: { id: input.sessionId },
        data: { durum: "DONE" },
      });

      // Streak guncelle
      const user = await ctx.prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });

      const bugun = new Date();
      bugun.setHours(0, 0, 0, 0);
      const dun = new Date(bugun);
      dun.setDate(dun.getDate() - 1);

      let yeniStreak = user.currentStreak;

      if (user.lastStudyDate) {
        const sonCalismaTarihi = new Date(user.lastStudyDate);
        sonCalismaTarihi.setHours(0, 0, 0, 0);

        if (sonCalismaTarihi.getTime() === bugun.getTime()) {
          // Bugun zaten calisildiysa streak degismesin
          yeniStreak = user.currentStreak;
        } else if (sonCalismaTarihi.getTime() === dun.getTime()) {
          yeniStreak = user.currentStreak + 1;
        } else {
          yeniStreak = 1; // seri kirildi
        }
      } else {
        yeniStreak = 1;
      }

      const enUzun = Math.max(yeniStreak, user.longestStreak);

      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak: yeniStreak,
          longestStreak: enUzun,
          lastStudyDate: new Date(),
        },
      });

      return { streak: yeniStreak, enUzun };
    }),

  // Hata defteri — yanlış cevaplanan benzersiz sorular
  getHataDefteri: protectedProcedure
    .input(z.object({ ders: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const attempts = await ctx.prisma.attempt.findMany({
        where: {
          userId: ctx.user.id,
          dogruMu: false,
        },
        include: { question: { include: { topic: true } } },
        orderBy: { tarih: "desc" },
        take: 500,
      });

      // Her sorudan yalnızca en son yanlış attempt'i tut
      const gorulen = new Set<string>();
      let tekil = attempts.filter((a) => {
        if (gorulen.has(a.questionId)) return false;
        gorulen.add(a.questionId);
        return true;
      });

      // Ders filtresi
      if (input?.ders) {
        tekil = tekil.filter((a) => a.question.topic.ders === input.ders);
      }

      return tekil.map((a) => ({
        attemptId: a.id,
        tarih: a.tarih,
        secilenSik: a.secilenSik,
        sureMs: a.sureMs,
        question: {
          id: a.question.id,
          soruMetni: a.question.soruMetni,
          siklar: a.question.siklar,
          dogruSik: a.question.dogruSik,
          aciklama: a.question.aciklama,
          zorluk: a.question.zorluk,
          ders: a.question.topic.ders,
          konuIsim: a.question.topic.isim,
        },
      }));
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
      hedefTopicIds: session.hedefTopicIds,
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
