import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { prisma } from "../../infrastructure/database/prisma";

export const curriculumRouter = router({
  // Tum dersleri ve konu agacini getir
  getTopicTree: publicProcedure
    .input(z.object({ ders: z.enum(["TURKCE", "MATEMATIK", "FEN", "SOSYAL", "INGILIZCE", "DIN"]).optional() }))
    .query(async ({ input }) => {
      return prisma.topic.findMany({
        where: {
          ...(input.ders ? { ders: input.ders } : {}),
          parentId: null, // sadece ust duzey
        },
        include: {
          children: {
            include: {
              children: true, // 3 seviye derinlik
            },
          },
        },
      });
    }),

  // Bir konunun sorularini getir
  getQuestionsByTopic: publicProcedure
    .input(
      z.object({
        topicId: z.string().uuid(),
        status: z.enum(["DRAFT", "REVIEWED", "PUBLISHED", "FLAGGED"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return prisma.question.findMany({
        where: {
          topicId: input.topicId,
          ...(input.status ? { validationStatus: input.status } : {}),
        },
      });
    }),
});
