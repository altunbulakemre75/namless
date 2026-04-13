import { NextResponse } from "next/server";
import { prisma } from "../../../infrastructure/database/prisma";
import { MasteryCalculator } from "../../../domain/assessment/services/mastery-calculator";
import { StudyPlanGenerator } from "../../../domain/learning/services/study-plan-generator";
import { AttemptBaglam } from "../../../domain/assessment/entities/attempt";

const masteryCalc = new MasteryCalculator();
const planGenerator = new StudyPlanGenerator();

const TEST_USER_ID = "test-kotü-ogrenci-001";
const TEST_EMAIL = "kotu.ogrenci@test.com";
const LGS_TARIHI = new Date("2026-06-07");

export async function GET() {
  const log: string[] = [];
  const baslangic = Date.now();

  try {
    // 1. Test kullanıcısını oluştur / sıfırla
    log.push("1. Test kullanıcısı hazırlanıyor...");

    // Eski verileri temizle
    const eskiPlanlar = await prisma.studyPlan.findMany({ where: { userId: TEST_USER_ID }, select: { id: true } });
    if (eskiPlanlar.length > 0) {
      await prisma.dailySession.deleteMany({ where: { studyPlanId: { in: eskiPlanlar.map(p => p.id) } } });
      await prisma.studyPlan.deleteMany({ where: { userId: TEST_USER_ID } });
    }
    await prisma.mastery.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.attempt.deleteMany({ where: { userId: TEST_USER_ID } });

    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: { isim: "Kötü Öğrenci (Test)", email: TEST_EMAIL },
      create: { id: TEST_USER_ID, email: TEST_EMAIL, isim: "Kötü Öğrenci (Test)", dailyStudyMins: 60 },
    });
    log.push("   ✅ Kullanıcı hazır");

    // 2. Tüm PUBLISHED soruları çek
    log.push("2. Sorular çekiliyor...");
    const tumSorular = await prisma.question.findMany({
      where: { validationStatus: "PUBLISHED", topic: { ders: { in: ["MATEMATIK", "FEN", "TURKCE"] } } },
      include: { topic: true },
    });
    log.push(`   ✅ ${tumSorular.length} soru bulundu`);

    // 3. Kötü öğrenci profili: %20 doğru (rastgele)
    log.push("3. Kötü öğrenci cevapları simüle ediliyor (%20 başarı)...");
    const BASARI_ORANI = 0.2;
    let dogru = 0, yanlis = 0;

    for (const soru of tumSorular) {
      const dogruMu = Math.random() < BASARI_ORANI;
      const secilenSik = dogruMu
        ? soru.dogruSik
        : (soru.dogruSik + 1 + Math.floor(Math.random() * 3)) % 4;

      await prisma.attempt.create({
        data: {
          userId: TEST_USER_ID,
          questionId: soru.id,
          secilenSik,
          dogruMu,
          sureMs: 25000 + Math.random() * 30000, // 25-55 sn (yavaş düşünüyor)
          baglam: "DIAGNOSTIC" as AttemptBaglam,
        },
      });

      if (dogruMu) dogru++; else yanlis++;
    }
    log.push(`   ✅ ${tumSorular.length} cevap kaydedildi: ${dogru} doğru / ${yanlis} yanlış (%${Math.round(dogru/tumSorular.length*100)})`);

    // 4. Topic bazında mastery hesapla
    log.push("4. Mastery hesaplanıyor...");
    const attempts = await prisma.attempt.findMany({
      where: { userId: TEST_USER_ID, baglam: "DIAGNOSTIC" },
      include: { question: { include: { topic: true } } },
    });

    const topicGroups = new Map<string, typeof attempts>();
    attempts.forEach(a => {
      const tid = a.question.topicId;
      if (!topicGroups.has(tid)) topicGroups.set(tid, []);
      topicGroups.get(tid)!.push(a);
    });

    const masteries = [];
    const dersSkoru: Record<string, { dogru: number; toplam: number }> = {};

    for (const [topicId, topicAttempts] of topicGroups) {
      const ders = topicAttempts[0].question.topic.ders;
      if (!dersSkoru[ders]) dersSkoru[ders] = { dogru: 0, toplam: 0 };
      dersSkoru[ders].toplam += topicAttempts.length;
      dersSkoru[ders].dogru += topicAttempts.filter(a => a.dogruMu).length;

      const domainAttempts = topicAttempts.map(a => ({
        id: a.id, userId: a.userId, questionId: a.questionId,
        secilenSik: a.secilenSik, dogruMu: a.dogruMu,
        sureMs: a.sureMs, tarih: a.tarih, baglam: a.baglam as AttemptBaglam,
      }));
      const mastery = masteryCalc.calculate(TEST_USER_ID, topicId, domainAttempts);
      await prisma.mastery.upsert({
        where: { userId_topicId: { userId: TEST_USER_ID, topicId } },
        update: { skor: mastery.skor, guvenAraligi: mastery.guvenAraligi, sonGuncelleme: new Date() },
        create: { userId: TEST_USER_ID, topicId, skor: mastery.skor, guvenAraligi: mastery.guvenAraligi },
      });
      masteries.push(mastery);
    }

    log.push(`   ✅ ${masteries.length} konu için mastery hesaplandı`);
    log.push("   Ders bazında başarı:");
    Object.entries(dersSkoru).forEach(([ders, s]) =>
      log.push(`     ${ders}: %${Math.round(s.dogru/s.toplam*100)} (${s.dogru}/${s.toplam})`)
    );

    const ortMastery = masteries.reduce((s, m) => s + m.skor, 0) / masteries.length;
    const zayifKonular = masteries.filter(m => m.skor < 75).length;
    log.push(`   Ortalama mastery: %${Math.round(ortMastery)}`);
    log.push(`   Zayıf konu sayısı (<%75): ${zayifKonular}/${masteries.length}`);

    // 5. Çalışma planı oluştur
    log.push("5. Çalışma planı oluşturuluyor...");
    const planData = planGenerator.generate({
      userId: TEST_USER_ID,
      masteries,
      hedefTarih: LGS_TARIHI,
      gunlukDakika: 60,
    });

    await prisma.studyPlan.create({
      data: {
        userId: TEST_USER_ID,
        hedefTarih: planData.hedefTarih,
        gunlukDakika: planData.gunlukDakika,
        planVersiyonu: planData.planVersiyonu,
        sessions: {
          create: planData.sessions.slice(0, 55).map(s => ({
            tarih: s.tarih,
            hedefTopicIds: s.hedefTopicIds,
            tahminiSure: s.tahminiSure,
            durum: s.durum,
            attemptIds: [],
          })),
        },
      },
    });

    log.push(`   ✅ Plan oluşturuldu: ${planData.sessions.length} oturum planlandı`);
    log.push(`   İlk 5 oturum:`);
    planData.sessions.slice(0, 5).forEach((s, i) =>
      log.push(`     Gün ${i+1}: ${s.hedefTopicIds.length} konu, ${s.tahminiSure} dk`)
    );

    // 6. Sonuç özeti
    const sure = Date.now() - baslangic;
    log.push(`\n✅ TEST TAMAMLANDI (${sure}ms)`);

    return NextResponse.json({
      durum: "BASARILI",
      sure: `${sure}ms`,
      ozet: {
        kullanici: TEST_EMAIL,
        soruSayisi: tumSorular.length,
        dogruOrani: `%${Math.round(dogru/tumSorular.length*100)}`,
        topicSayisi: masteries.length,
        zayifKonu: zayifKonular,
        ortMastery: `%${Math.round(ortMastery)}`,
        planOturumSayisi: planData.sessions.length,
        dersSkoru: Object.fromEntries(
          Object.entries(dersSkoru).map(([d, s]) => [d, `%${Math.round(s.dogru/s.toplam*100)}`])
        ),
      },
      log,
    });

  } catch (err) {
    log.push(`❌ HATA: ${String(err)}`);
    return NextResponse.json({ durum: "HATA", log, hata: String(err) }, { status: 500 });
  }
}
