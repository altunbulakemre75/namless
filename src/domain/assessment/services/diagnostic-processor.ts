import { MasteryCalculator } from "./mastery-calculator";
import { StudyPlanGenerator } from "../../learning/services/study-plan-generator";
import { AttemptBaglam } from "../entities/attempt";
import { PrismaClient } from "@prisma/client";

const masteryCalc = new MasteryCalculator();
const planGenerator = new StudyPlanGenerator();
const LGS_TARIHI = new Date("2026-06-07");

export async function processDiagnostic(
  prisma: PrismaClient,
  userId: string,
  gunlukDakika = 60
) {
  const attempts = await prisma.attempt.findMany({
    where: { userId, baglam: "DIAGNOSTIC" },
    include: { question: { include: { topic: true } } },
    orderBy: { tarih: "desc" },
    take: 100,
  });

  // Topic bazinda grupla
  const topicGroups = new Map<string, typeof attempts>();
  attempts.forEach((a) => {
    const tid = a.question.topicId;
    if (!topicGroups.has(tid)) topicGroups.set(tid, []);
    topicGroups.get(tid)!.push(a);
  });

  // Mastery hesapla ve upsert et
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

    await prisma.mastery.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: {
        skor: mastery.skor,
        guvenAraligi: mastery.guvenAraligi,
        sonGuncelleme: new Date(),
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

  // Eski planları sil, yenisini üret
  const eskiPlanlar = await prisma.studyPlan.findMany({
    where: { userId },
    select: { id: true },
  });
  if (eskiPlanlar.length > 0) {
    await prisma.dailySession.deleteMany({
      where: { studyPlanId: { in: eskiPlanlar.map((p) => p.id) } },
    });
    await prisma.studyPlan.deleteMany({ where: { userId } });
  }

  const planData = planGenerator.generate({
    userId,
    masteries,
    hedefTarih: LGS_TARIHI,
    gunlukDakika,
  });

  await prisma.studyPlan.create({
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

  return { masteries, topicGroups };
}
