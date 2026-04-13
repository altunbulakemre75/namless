/**
 * Mastery Calculator v2 — BKT + Ağırlıklı Hibrit
 *
 * v1'in basit ağırlıklı ortalamasını BKT ile güçlendirir.
 * Veri miktarına göre BKT ağırlığı dinamik olarak artar:
 *   < 3 attempt  → %0 BKT (yeterli veri yok)
 *   3-10 attempt → %30 BKT
 *   10+ attempt  → %70 BKT
 *
 * Kaynak: OATutor CHI'23 + Hermes mastery_engine.py uyarlaması
 */

import { Attempt } from "../entities/attempt";
import { Mastery } from "../entities/mastery";
import { calculateBKTMastery, bktToScore } from "./bkt-engine";

const RECENCY_WEIGHT = 0.7;
const MIN_ATTEMPTS_FOR_CONFIDENCE = 5;

/** BKT'nin aktif olmaya başladığı minimum attempt sayısı */
const BKT_MIN_ATTEMPTS = 3;

export class MasteryCalculator {
  /**
   * Attempt event'lerinden hibrit mastery skoru hesaplar.
   * BKT + ağırlıklı ortalama hibrit: veri arttıkça BKT ağırlığı yükselir.
   */
  calculate(userId: string, topicId: string, attempts: Attempt[]): Mastery {
    if (attempts.length === 0) {
      return {
        userId,
        topicId,
        skor: 0,
        guvenAraligi: 25,
        sonGuncelleme: new Date(),
        versiyon: 2,
      };
    }

    // Kronolojik sıralama (eski → yeni)
    const sorted = [...attempts].sort(
      (a, b) => a.tarih.getTime() - b.tarih.getTime()
    );

    // --- Ağırlıklı Ortalama (v1 yöntemi) ---
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

    const weightedScore = Math.round((agirlikliDogru / toplamAgirlik) * 100);

    // --- BKT Skoru ---
    const bktAttempts = sorted.map((a) => ({
      dogruMu: a.dogruMu,
      zorluk: (a as Attempt & { zorluk?: number }).zorluk,
    }));
    const { probMastery } = calculateBKTMastery(bktAttempts);
    const bktScore = bktToScore(probMastery);

    // --- Hibrit Ağırlıklandırma ---
    // Attempt sayısı arttıkça BKT'ye daha çok güven
    const bktWeight =
      attempts.length < BKT_MIN_ATTEMPTS
        ? 0
        : Math.min(0.7, attempts.length / 15);
    const finalScore = Math.round(
      bktWeight * bktScore + (1 - bktWeight) * weightedScore
    );

    // Güven aralığı: veri arttıkça daralır
    const guvenAraligi = Math.max(
      5,
      Math.round(25 / Math.sqrt(attempts.length / MIN_ATTEMPTS_FOR_CONFIDENCE))
    );

    return {
      userId,
      topicId,
      skor: Math.max(0, Math.min(100, finalScore)),
      guvenAraligi,
      sonGuncelleme: new Date(),
      versiyon: 2,
    };
  }
}
