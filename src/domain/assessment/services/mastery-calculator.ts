import { Attempt } from "../entities/attempt";
import { Mastery } from "../entities/mastery";

const RECENCY_WEIGHT = 0.7; // son cevaplar daha agir basar
const MIN_ATTEMPTS_FOR_CONFIDENCE = 5;

export class MasteryCalculator {
  /**
   * Attempt event'lerinden mastery skoru hesaplar.
   * Bayesian-weighted: son cevaplar daha etkili.
   */
  calculate(userId: string, topicId: string, attempts: Attempt[]): Mastery {
    if (attempts.length === 0) {
      return {
        userId,
        topicId,
        skor: 0,
        guvenAraligi: 25,
        sonGuncelleme: new Date(),
        versiyon: 1,
      };
    }

    // Zamana gore sirala (eskiden yeniye)
    const sorted = [...attempts].sort(
      (a, b) => a.tarih.getTime() - b.tarih.getTime()
    );

    // Agirlikli ortalama: son cevaplara daha fazla agirlik
    let toplamAgirlik = 0;
    let agirlikliDogru = 0;

    sorted.forEach((attempt, index) => {
      const pozisyonOrani = (index + 1) / sorted.length;
      const agirlik = Math.pow(pozisyonOrani, RECENCY_WEIGHT);
      toplamAgirlik += agirlik;
      if (attempt.dogruMu) {
        agirlikliDogru += agirlik;
      }
    });

    const skor = Math.round((agirlikliDogru / toplamAgirlik) * 100);

    // Guven araligi: veri arttikca daralir
    const guvenAraligi = Math.max(
      5,
      Math.round(25 / Math.sqrt(attempts.length / MIN_ATTEMPTS_FOR_CONFIDENCE))
    );

    return {
      userId,
      topicId,
      skor,
      guvenAraligi,
      sonGuncelleme: new Date(),
      versiyon: 1,
    };
  }
}
