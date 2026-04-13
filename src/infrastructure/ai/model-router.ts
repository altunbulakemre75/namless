/**
 * Akıllı Model Yönlendirme
 *
 * Görev tipine ve öğrenci bağlamına göre en uygun modeli seçer.
 * Kaynak: Hermes agent/smart_model_routing.py uyarlaması
 */

export type TaskType =
  | "konu_anlatimi"   // Sonnet — kaliteli, detaylı
  | "soru_aciklama"   // Haiku — hızlı, kısa
  | "uzman_panel"     // Sonnet (sentez) + Haiku (uzmanlar)
  | "soru_uretimi"    // Sonnet — yaratıcı
  | "koc_yorumu"      // Haiku — motivasyonel, kısa
  | "hata_analizi"    // Haiku — sınıflandırma
  | "ipucu"           // Haiku — kısa yönlendirme
  | "rapor_sentez"    // Sonnet — haftalık rapor sentezi
  | "plan_olusturma"; // Hesaplama — AI gereksiz

export interface ModelConfig {
  model: string;
  maxTokens: number;
}

export interface StudentContext {
  masterySkoru: number;
  hataEgilimi?: string | null;
  tekrarYanlisSayisi?: number; // aynı konuda kaç kez yanlış
}

const SONNET = "claude-sonnet-4-6";
const HAIKU = "claude-haiku-4-5-20251001";

const MODEL_MAP: Record<TaskType, ModelConfig> = {
  konu_anlatimi:  { model: SONNET, maxTokens: 3000 },
  soru_aciklama:  { model: HAIKU,  maxTokens: 500 },
  uzman_panel:    { model: SONNET, maxTokens: 1000 },
  soru_uretimi:   { model: SONNET, maxTokens: 1024 },
  koc_yorumu:     { model: HAIKU,  maxTokens: 300 },
  hata_analizi:   { model: HAIKU,  maxTokens: 200 },
  ipucu:          { model: HAIKU,  maxTokens: 200 },
  rapor_sentez:   { model: SONNET, maxTokens: 1500 },
  plan_olusturma: { model: "none", maxTokens: 0 },
};

/**
 * Öğrenci bağlamına göre modeli yükseltmeli mi?
 */
function shouldUpgradeModel(
  taskType: TaskType,
  ctx?: StudentContext
): boolean {
  if (!ctx) return false;

  // Mastery %25 altında → daha detaylı açıklama gerekli → Sonnet'e yükselt
  if (taskType === "soru_aciklama" && ctx.masterySkoru < 25) return true;

  // Aynı konuda 3+ yanlış → kavram eksikliği → Sonnet'e yükselt
  if (taskType === "soru_aciklama" && (ctx.tekrarYanlisSayisi ?? 0) >= 3) return true;

  // Kavram eksikliği eğilimi → daha derinlemesine analiz
  if (taskType === "hata_analizi" && ctx.hataEgilimi === "KAVRAM_EKSIK") return true;

  return false;
}

/**
 * Görev tipi ve öğrenci bağlamına göre model + maxTokens döndür
 */
export function getModelForTask(
  taskType: TaskType,
  studentContext?: StudentContext
): ModelConfig {
  const base = MODEL_MAP[taskType];

  if (base.model === "none") return base;

  if (shouldUpgradeModel(taskType, studentContext)) {
    return { model: SONNET, maxTokens: base.maxTokens * 2 };
  }

  return base;
}

/**
 * Tahmini maliyet hesapla (USD)
 */
export function estimateTaskCost(taskType: TaskType): number {
  const config = MODEL_MAP[taskType];
  if (config.model === "none") return 0;

  const isSonnet = config.model === SONNET;
  const inputCost = isSonnet ? 3 / 1_000_000 : 0.25 / 1_000_000;
  const outputCost = isSonnet ? 15 / 1_000_000 : 1.25 / 1_000_000;

  // Ortalama input: maxTokens * 2 (prompt + context)
  const estimatedInput = config.maxTokens * 2;
  return estimatedInput * inputCost + config.maxTokens * outputCost;
}
