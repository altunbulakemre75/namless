/**
 * Mastery Tahmin Motoru — Kronos MasteryPredictor uyarlaması
 *
 * Mastery trend verilerinden LGS'ye kadar tahmini skor hesaplar.
 * Yöntem: Basit lineer regresyon (OLS) — zaman serisi üzerinde
 *
 * Çıktı:
 *   - Mevcut mastery skoru
 *   - LGS'deki tahmini skor (0-100)
 *   - Hedefe ulaşma olasılığı (0-1)
 *   - Gerekli günlük çalışma süresi tahmini
 */

export interface MasteryDataPoint {
  tarih: Date;
  skor: number; // 0-100
}

export interface PredictionResult {
  mevcutSkor: number;
  tahminiLgsSkor: number;
  hedefe_ulasma_olasiligi: number; // 0-1
  gerekliGunlukDk: number;
  trend: "yukselis" | "duslus" | "duragan";
  guven: number; // 0-1, veri yeterliliğine göre
  lgsDaysLeft: number;
}

const LGS_TARIH = new Date("2026-06-07");
const HEDEF_MASTERY = 70; // %70 mastery = LGS için "hazır"

/**
 * Lineer regresyon (OLS) — y = a + b*x
 * x: gün sayısı (ilk noktadan), y: mastery skor
 */
function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  r2: number; // determinasyon katsayısı
} {
  const n = points.length;
  if (n < 2) {
    return { slope: 0, intercept: points[0]?.y ?? 0, r2: 0 };
  }

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² hesapla
  const meanY = sumY / n;
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (intercept + slope * p.x)) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2: Math.max(0, r2) };
}

/**
 * Mastery tahmin et
 */
export function predictMastery(
  dataPoints: MasteryDataPoint[],
  mevcutSkor?: number,
): PredictionResult {
  const bugun = new Date();
  const lgsDaysLeft = Math.ceil(
    (LGS_TARIH.getTime() - bugun.getTime()) / 86400000
  );

  // Mevcut skor (en son data point veya verilen değer)
  const sonSkor =
    mevcutSkor ??
    (dataPoints.length > 0
      ? dataPoints.sort((a, b) => b.tarih.getTime() - a.tarih.getTime())[0].skor
      : 0);

  // Yeterli veri yoksa basit tahmin
  if (dataPoints.length < 3) {
    return buildSimplePrediction(sonSkor, lgsDaysLeft);
  }

  // Zaman serisini x-y noktalarına çevir
  const ilkTarih = dataPoints.reduce(
    (min, d) => (d.tarih < min ? d.tarih : min),
    dataPoints[0].tarih
  );

  const points = dataPoints.map((d) => ({
    x: Math.floor((d.tarih.getTime() - ilkTarih.getTime()) / 86400000),
    y: d.skor,
  }));

  const { slope, intercept, r2 } = linearRegression(points);

  // LGS'deki gün sayısı (ilk noktadan)
  const sonGun = points[points.length - 1].x;
  const lgsGun = sonGun + lgsDaysLeft;

  // Tahmini skor
  const tahminiSkor = Math.min(100, Math.max(0, intercept + slope * lgsGun));

  // Trend
  const trend: "yukselis" | "duslus" | "duragan" =
    slope > 0.1 ? "yukselis" : slope < -0.1 ? "duslus" : "duragan";

  // Hedefe ulaşma olasılığı
  const olasilik = computeProbability(tahminiSkor, HEDEF_MASTERY, r2);

  // Gerekli günlük dakika tahmini
  const gerekliGunlukDk = computeRequiredDaily(sonSkor, HEDEF_MASTERY, lgsDaysLeft, slope);

  // Güven skoru: R² + veri sayısına göre
  const guven = Math.min(1, r2 * 0.7 + Math.min(dataPoints.length / 10, 1) * 0.3);

  return {
    mevcutSkor: Math.round(sonSkor),
    tahminiLgsSkor: Math.round(tahminiSkor),
    hedefe_ulasma_olasiligi: Math.round(olasilik * 100) / 100,
    gerekliGunlukDk,
    trend,
    guven: Math.round(guven * 100) / 100,
    lgsDaysLeft,
  };
}

/**
 * Birden fazla konu için tahmin — özet döndürür
 */
export function predictOverallReadiness(
  konuTahminleri: PredictionResult[]
): {
  hazirlikSkoru: number; // 0-100
  zayifKonuSayisi: number;
  lgsTahminiNet: number; // tahmini LGS neti (40 soru bazlı)
  oneriler: string[];
} {
  if (konuTahminleri.length === 0) {
    return { hazirlikSkoru: 0, zayifKonuSayisi: 0, lgsTahminiNet: 0, oneriler: [] };
  }

  const ortTahmin =
    konuTahminleri.reduce((s, k) => s + k.tahminiLgsSkor, 0) / konuTahminleri.length;

  const zayiflar = konuTahminleri.filter((k) => k.tahminiLgsSkor < 50);

  // LGS neti: tahmini başarı oranı × 40 soru
  const lgsTahminiNet = Math.round((ortTahmin / 100) * 40 * 0.85); // %85 doğruluk oranı

  const oneriler: string[] = [];
  if (zayiflar.length > 0) {
    oneriler.push(`${zayiflar.length} konuda tahmini skor %50 altında — bu konulara öncelik ver`);
  }
  if (ortTahmin < 60) {
    oneriler.push("Genel mastery düşük — günlük çalışma süresini artır");
  }
  const dususKonular = konuTahminleri.filter((k) => k.trend === "duslus");
  if (dususKonular.length > 0) {
    oneriler.push(`${dususKonular.length} konuda düşüş trendi var — bu konuları gözden geçir`);
  }

  return {
    hazirlikSkoru: Math.round(ortTahmin),
    zayifKonuSayisi: zayiflar.length,
    lgsTahminiNet,
    oneriler,
  };
}

// --- Yardımcılar ---

function buildSimplePrediction(sonSkor: number, lgsDaysLeft: number): PredictionResult {
  // Veri yetersiz → muhafazakâr tahmin (düz çizgi)
  return {
    mevcutSkor: Math.round(sonSkor),
    tahminiLgsSkor: Math.round(sonSkor),
    hedefe_ulasma_olasiligi: sonSkor >= HEDEF_MASTERY ? 0.7 : 0.3,
    gerekliGunlukDk: sonSkor < HEDEF_MASTERY ? 45 : 30,
    trend: "duragan",
    guven: 0.2,
    lgsDaysLeft,
  };
}

function computeProbability(tahminiSkor: number, hedef: number, r2: number): number {
  if (tahminiSkor >= hedef + 10) return 0.85 * (0.5 + r2 * 0.5);
  if (tahminiSkor >= hedef) return 0.65 * (0.5 + r2 * 0.5);
  if (tahminiSkor >= hedef - 10) return 0.4 * (0.5 + r2 * 0.5);
  return 0.15 * (0.5 + r2 * 0.5);
}

function computeRequiredDaily(
  mevcutSkor: number,
  hedefSkor: number,
  lgsDaysLeft: number,
  gunlukArtis: number, // puan/gün (regresyon slope)
): number {
  if (mevcutSkor >= hedefSkor) return 30; // Zaten yeterli — bakım modu

  const fark = hedefSkor - mevcutSkor;
  const tahminiGunlukArtis = Math.max(0.1, gunlukArtis);
  const gerekliGun = fark / tahminiGunlukArtis;

  if (gerekliGun <= lgsDaysLeft) {
    // Şu an ki tempo yeterli
    return 45;
  }

  // Tempo artışı gerekli — kaba tahmin
  const oranArtis = gerekliGun / lgsDaysLeft;
  return Math.min(120, Math.round(45 * oranArtis));
}
