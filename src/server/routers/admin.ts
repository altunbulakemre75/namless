import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";

// Admin middleware: Prisma'dan rol kontrolü
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const dbUser = await ctx.prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { rol: true },
  });
  if (!dbUser || dbUser.rol !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin yetkisi gerekli" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // İstatistikler
  getStats: adminProcedure.query(async ({ ctx }) => {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    const [kullaniciSayisi, soruSayisi, konuSayisi, denemeSayisi, bugunAktif] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.question.count(),
      ctx.prisma.topic.count(),
      ctx.prisma.mockExam.count(),
      ctx.prisma.studySession.count({ where: { tarih: { gte: bugun } } }),
    ]);

    const yayinlanmisSoru = await ctx.prisma.question.count({
      where: { validationStatus: "PUBLISHED" },
    });

    return {
      kullaniciSayisi,
      soruSayisi,
      yayinlanmisSoru,
      konuSayisi,
      denemeSayisi,
      bugunAktif,
    };
  }),

  // Kullanıcı listesi
  getUsers: adminProcedure
    .input(
      z.object({
        tier: z.enum(["FREE", "BASIC", "PREMIUM"]).optional(),
        sayfa: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = 20;
      const users = await ctx.prisma.user.findMany({
        where: input.tier ? { subscriptionTier: input.tier } : {},
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: input.sayfa * limit,
        select: {
          id: true,
          email: true,
          isim: true,
          rol: true,
          subscriptionTier: true,
          currentStreak: true,
          createdAt: true,
          _count: { select: { attempts: true, mockExams: true } },
        },
      });
      const toplam = await ctx.prisma.user.count({
        where: input.tier ? { subscriptionTier: input.tier } : {},
      });
      return { users, toplam, sayfaSayisi: Math.ceil(toplam / limit) };
    }),

  // Kullanıcı tier güncelle
  updateUserTier: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tier: z.enum(["FREE", "BASIC", "PREMIUM"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { subscriptionTier: input.tier },
      });
      return { basarili: true };
    }),

  // Soru listesi
  getQuestions: adminProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "REVIEWED", "PUBLISHED", "FLAGGED"]).optional(),
        topicId: z.string().optional(),
        sayfa: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = 25;
      const where: Record<string, unknown> = {};
      if (input.status) where.validationStatus = input.status;
      if (input.topicId) where.topicId = input.topicId;

      const [questions, toplam] = await Promise.all([
        ctx.prisma.question.findMany({
          where,
          include: { topic: { select: { isim: true, ders: true } } },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: input.sayfa * limit,
        }),
        ctx.prisma.question.count({ where }),
      ]);

      return { questions, toplam };
    }),

  // Yeni soru ekle
  createQuestion: adminProcedure
    .input(
      z.object({
        topicId: z.string(),
        kaynak: z.enum(["CIKMIS", "AI_URETIM", "OGRETMEN"]),
        kaynakYili: z.number().optional(),
        zorluk: z.number().min(1).max(3),
        soruMetni: z.string().min(10),
        siklar: z.array(z.string()).length(4),
        dogruSik: z.number().min(0).max(3),
        aciklama: z.string().min(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const soru = await ctx.prisma.question.create({
        data: {
          topicId: input.topicId,
          kaynak: input.kaynak,
          kaynakYili: input.kaynakYili,
          zorluk: input.zorluk,
          soruMetni: input.soruMetni,
          siklar: input.siklar,
          dogruSik: input.dogruSik,
          aciklama: input.aciklama,
          validationStatus: "DRAFT",
        },
      });
      return { id: soru.id };
    }),

  // Soru güncelle
  updateQuestion: adminProcedure
    .input(
      z.object({
        id: z.string(),
        soruMetni: z.string().min(10).optional(),
        siklar: z.array(z.string()).length(4).optional(),
        dogruSik: z.number().min(0).max(3).optional(),
        aciklama: z.string().min(5).optional(),
        zorluk: z.number().min(1).max(3).optional(),
        validationStatus: z.enum(["DRAFT", "REVIEWED", "PUBLISHED", "FLAGGED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await ctx.prisma.question.update({ where: { id }, data });
      return { basarili: true };
    }),

  // Soru yayınla (DRAFT → PUBLISHED)
  publishQuestion: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.question.update({
        where: { id: input.id },
        data: { validationStatus: "PUBLISHED" },
      });
      return { basarili: true };
    }),

  // Konu listesi
  getTopics: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.topic.findMany({
      include: {
        _count: { select: { questions: true, children: true } },
        parent: { select: { isim: true } },
      },
      orderBy: [{ ders: "asc" }, { isim: "asc" }],
    });
  }),

  // Yeni konu ekle
  createTopic: adminProcedure
    .input(
      z.object({
        isim: z.string().min(2),
        ders: z.enum(["TURKCE", "MATEMATIK", "FEN", "SOSYAL", "INGILIZCE", "DIN"]),
        parentId: z.string().optional(),
        dersIcerigi: z.string().optional(),
        kazanimlar: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const konu = await ctx.prisma.topic.create({
        data: {
          isim: input.isim,
          ders: input.ders,
          parentId: input.parentId,
          dersIcerigi: input.dersIcerigi,
          kazanimlar: input.kazanimlar,
        },
      });
      return { id: konu.id };
    }),

  // Konu sil (sadece soru yoksa)
  deleteTopic: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const konu = await ctx.prisma.topic.findUniqueOrThrow({
        where: { id: input.id },
        include: { _count: { select: { questions: true, children: true } } },
      });
      if (konu._count.questions > 0 || konu._count.children > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Bu konuya bağlı ${konu._count.questions} soru ve ${konu._count.children} alt konu var. Önce onları sil.`,
        });
      }
      await ctx.prisma.topic.delete({ where: { id: input.id } });
      return { basarili: true };
    }),

  // Konu içeriği güncelle
  updateTopicContent: adminProcedure
    .input(
      z.object({
        id: z.string(),
        dersIcerigi: z.string(),
        kazanimlar: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.topic.update({
        where: { id: input.id },
        data: {
          dersIcerigi: input.dersIcerigi,
          ...(input.kazanimlar ? { kazanimlar: input.kazanimlar } : {}),
        },
      });
      return { basarili: true };
    }),

  // AI soru üretimi (stub — gerçek AI bağlantısı sonra)
  generateAIQuestion: adminProcedure
    .input(
      z.object({
        topicId: z.string(),
        zorluk: z.number().min(1).max(3),
        adet: z.number().min(1).max(5).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const topic = await ctx.prisma.topic.findUniqueOrThrow({
        where: { id: input.topicId },
        select: { isim: true, ders: true, kazanimlar: true },
      });

      // TODO: Gerçek AI entegrasyonu (claude-3-haiku)
      // Şimdilik örnek soru üret
      const ornekSoru = {
        topicId: input.topicId,
        kaynak: "AI_URETIM" as const,
        zorluk: input.zorluk,
        soruMetni: `[AI TASLAK] ${topic.isim} konusuyla ilgili soru ${Date.now()}`,
        siklar: ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
        dogruSik: 0,
        aciklama: "AI tarafından oluşturuldu. Lütfen kontrol edin.",
        validationStatus: "DRAFT" as const,
        aiModel: "stub-v1",
      };

      const olusturulanlar = [];
      for (let i = 0; i < input.adet; i++) {
        const soru = await ctx.prisma.question.create({ data: ornekSoru });
        olusturulanlar.push(soru.id);
      }

      return {
        olusturulanIds: olusturulanlar,
        uyari: `${topic.isim} için ${input.adet} taslak soru oluşturuldu. AI entegrasyonu henüz aktif değil — lütfen soruları manuel olarak düzenleyin.`,
      };
    }),
});
