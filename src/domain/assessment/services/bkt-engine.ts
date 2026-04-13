/**
 * BKT Engine — Bayesian Knowledge Tracing
 *
 * OATutor (CHI'23) algoritması uyarlaması.
 * 4 parametre: probMastery (L0), probSlip (S), probGuess (G), probTransit (T)
 *
 * Kaynak: OATutor open-source adaptive tutoring system
 * Yayın: CHI 2023 — "OATutor: An Open-source Adaptive Tutoring System"
 */

export interface BKTParams {
  /** Başlangıç mastery olasılığı (L0) */
  probMastery: number;
  /** Bilen öğrencinin yanlış yapma olasılığı (Slip) */
  probSlip: number;
  /** Bilmeyen öğrencinin doğru yapma olasılığı (Guess) */
  probGuess: number;
  /** Her attempt sonrası öğrenme geçiş olasılığı (Transit) */
  probTransit: number;
}

/** LGS zorluk seviyelerine göre varsayılan BKT parametreleri */
export const LGS_BKT_DEFAULTS: Record<"kolay" | "orta" | "zor", BKTParams> = {
  kolay: { probMastery: 0.30, probSlip: 0.10, probGuess: 0.25, probTransit: 0.15 },
  orta:  { probMastery: 0.20, probSlip: 0.15, probGuess: 0.20, probTransit: 0.10 },
  zor:   { probMastery: 0.10, probSlip: 0.20, probGuess: 0.15, probTransit: 0.08 },
};

/**
 * LGS için mastery eşiği: OATutor'un 0.95'ine karşın LGS'de 0.80 yeterli.
 * Öğrenci bu eşiği geçerse konuyu "öğrenmiş" sayarız.
 */
export const BKT_MASTERY_THRESHOLD = 0.80;

/**
 * Tek bir attempt sonrası BKT Bayes posterior güncellemesi.
 * params parametresini yerinde (in-place) günceller.
 */
export function bktUpdate(params: BKTParams, isCorrect: boolean): void {
  const { probMastery, probSlip, probGuess, probTransit } = params;

  // P(cevap | mastery) ve P(cevap | ~mastery)
  const pCorrectGivenMastery    = 1 - probSlip;
  const pCorrectGivenNotMastery = probGuess;
  const pWrongGivenMastery      = probSlip;
  const pWrongGivenNotMastery   = 1 - probGuess;

  // Posterior: P(mastery | cevap) — Bayes teoremi
  const pCorrect = probMastery * pCorrectGivenMastery + (1 - probMastery) * pCorrectGivenNotMastery;
  const pWrong   = probMastery * pWrongGivenMastery   + (1 - probMastery) * pWrongGivenNotMastery;

  const pEvidence = isCorrect ? pCorrect : pWrong;
  if (pEvidence === 0) return; // bölme hatası önleme

  const pMasteryGivenEvidence = isCorrect
    ? (probMastery * pCorrectGivenMastery) / pEvidence
    : (probMastery * pWrongGivenMastery) / pEvidence;

  // Öğrenme geçişi: bilmeyenler transit ile öğrenebilir
  params.probMastery = pMasteryGivenEvidence + (1 - pMasteryGivenEvidence) * probTransit;

  // [0, 1] aralığında tut
  params.probMastery = Math.max(0, Math.min(1, params.probMastery));
}

export interface BKTResult {
  probMastery: number;
  /** Güncellenmiş parametreler (ileride kişiselleştirme için) */
  params: BKTParams;
}

/**
 * Birden fazla attempt dizisinden BKT mastery hesapla.
 * Attempt'ler kronolojik sırada olmalı (eski → yeni).
 */
export function calculateBKTMastery(
  attempts: Array<{ dogruMu: boolean; zorluk?: number }>,
  initialParams?: BKTParams
): BKTResult {
  if (attempts.length === 0) {
    const params = initialParams ?? { ...LGS_BKT_DEFAULTS.orta };
    return { probMastery: params.probMastery, params };
  }

  // Zorluk ağırlıklı başlangıç parametresi seç
  const avgZorluk =
    attempts.reduce((s, a) => s + (a.zorluk ?? 2), 0) / attempts.length;
  const defaultParams =
    avgZorluk <= 1.5
      ? LGS_BKT_DEFAULTS.kolay
      : avgZorluk <= 2.5
        ? LGS_BKT_DEFAULTS.orta
        : LGS_BKT_DEFAULTS.zor;

  const params: BKTParams = initialParams
    ? { ...initialParams }
    : { ...defaultParams };

  for (const attempt of attempts) {
    bktUpdate(params, attempt.dogruMu);
  }

  return { probMastery: params.probMastery, params };
}

/**
 * BKT probMastery → 0-100 mastery skoru dönüşümü.
 * Doğrusal ölçekleme, BKT_MASTERY_THRESHOLD'u %80 noktasına hizalar.
 */
export function bktToScore(probMastery: number): number {
  return Math.round(Math.max(0, Math.min(100, probMastery * 100)));
}

/**
 * Öğrenci bu konuyu öğrenmiş mi?
 */
export function isMastered(probMastery: number): boolean {
  return probMastery >= BKT_MASTERY_THRESHOLD;
}

/**
 * BKT tabanlı soru seçimi: tamamlanmamış adaylardan zorluk-uyumlu seçim.
 * Mastery düşükse kolay, yüksekse zor sorulara yönlendir.
 */
export function selectNextByBKT<T extends { id: string; zorluk: number }>(
  candidates: T[],
  completedIds: Set<string>,
  probMastery: number
): T | null {
  const remaining = candidates.filter((c) => !completedIds.has(c.id));
  if (remaining.length === 0) return null;

  // Hedef zorluk: mastery'ye göre belirle
  const targetZorluk = probMastery < 0.4 ? 1 : probMastery < 0.7 ? 2 : 3;

  // Tam eşleşme varsa tercih et, yoksa en yakın
  const exact = remaining.filter((c) => c.zorluk === targetZorluk);
  if (exact.length > 0) {
    return exact[Math.floor(Math.random() * exact.length)];
  }

  // Zorluk farkına göre sırala
  const sorted = [...remaining].sort(
    (a, b) => Math.abs(a.zorluk - targetZorluk) - Math.abs(b.zorluk - targetZorluk)
  );
  return sorted[0];
}
