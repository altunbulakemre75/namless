import { StudyPlan, DailySession, SessionDurum } from "../entities/study-plan";
import { Mastery } from "../../assessment/entities/mastery";

interface PlanInput {
  userId: string;
  masteries: Mastery[];
  hedefTarih: Date;
  gunlukDakika: number;
}

const SORU_BASI_DAKIKA = 2; // ortalama
const MIN_TOPIC_SKOR_ESIGI = 75; // bu skor ustundeki konular atlanir

export class StudyPlanGenerator {
  /**
   * Mastery skorlarina gore kisiye ozel calisma plani uretir.
   * Zayif konulara daha fazla zaman ayirir (spaced repetition mantigi).
   */
  generate(input: PlanInput): Omit<StudyPlan, "id"> {
    const { userId, masteries, hedefTarih, gunlukDakika } = input;
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    const gunSayisi = Math.max(
      1,
      Math.ceil(
        (hedefTarih.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    // Zayif konulari bul ve onceliklendir
    const zayifKonular = masteries
      .filter((m) => m.skor < MIN_TOPIC_SKOR_ESIGI)
      .sort((a, b) => a.skor - b.skor); // en zayiftan en iyiye

    if (zayifKonular.length === 0) {
      // Hepsi iyi, sadece tekrar plani
      return this.tekrarPlani(userId, hedefTarih, gunlukDakika, masteries, gunSayisi);
    }

    const sessions: DailySession[] = [];
    const konuRotasyonu = this.konuRotasyonuOlustur(zayifKonular, gunSayisi);

    for (let gun = 0; gun < gunSayisi; gun++) {
      const tarih = new Date(bugun);
      tarih.setDate(bugun.getDate() + gun);

      const bugunKonular = konuRotasyonu[gun] || [];
      const soruSayisi = Math.floor(gunlukDakika / SORU_BASI_DAKIKA);
      const topicBasiSoru = Math.max(
        3,
        Math.floor(soruSayisi / Math.max(bugunKonular.length, 1))
      );

      sessions.push({
        tarih,
        hedefTopicIds: bugunKonular.map((m) => m.topicId),
        tahminiSure: bugunKonular.length * topicBasiSoru * SORU_BASI_DAKIKA,
        durum: SessionDurum.PENDING,
        gercekAttemptIds: [],
      });
    }

    return {
      userId,
      hedefTarih,
      gunlukDakika,
      planVersiyonu: 1,
      sessions,
      olusturmaTarihi: new Date(),
    };
  }

  /**
   * Konulari gunlere dagitir.
   * Zayif konu = daha sik gorunur.
   */
  private konuRotasyonuOlustur(
    masteries: Mastery[],
    gunSayisi: number
  ): Mastery[][] {
    const rotasyon: Mastery[][] = Array.from({ length: gunSayisi }, () => []);

    // Her konuyu kac gunde bir tekrar etmeli?
    masteries.forEach((mastery) => {
      // Skor 0-25: her gun, 25-50: 2 gunde bir, 50-75: 3 gunde bir
      const aralik = mastery.skor < 25 ? 1 : mastery.skor < 50 ? 2 : 3;
      const konuBasinaMaxGunPerGun = 3; // bir günde max 3 konu
      let count = 0;

      for (let gun = 0; gun < gunSayisi; gun += aralik) {
        if (rotasyon[gun].length < konuBasinaMaxGunPerGun) {
          rotasyon[gun].push(mastery);
          count++;
        }
        if (count > gunSayisi / aralik) break;
      }
    });

    return rotasyon;
  }

  private tekrarPlani(
    userId: string,
    hedefTarih: Date,
    gunlukDakika: number,
    masteries: Mastery[],
    gunSayisi: number
  ): Omit<StudyPlan, "id"> {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    const sessions: DailySession[] = Array.from({ length: gunSayisi }, (_, i) => {
      const tarih = new Date(bugun);
      tarih.setDate(bugun.getDate() + i);

      // Sirali rotasyon
      const startIdx = (i * 2) % masteries.length;
      const bugunTopics = masteries.slice(startIdx, startIdx + 2).map((m) => m.topicId);

      return {
        tarih,
        hedefTopicIds: bugunTopics,
        tahminiSure: gunlukDakika,
        durum: SessionDurum.PENDING,
        gercekAttemptIds: [],
      };
    });

    return {
      userId,
      hedefTarih,
      gunlukDakika,
      planVersiyonu: 1,
      sessions,
      olusturmaTarihi: new Date(),
    };
  }
}
