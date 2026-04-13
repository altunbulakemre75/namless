/**
 * Akıllı Model Yönlendirme v2 — Multi-Provider
 *
 * Claude + Gemini destekli görev yönlendirme.
 * Görev tipine göre provider ve model seçilir.
 *
 * Claude primary: konu_anlatimi, uzman_panel, soru_uretimi, rapor_sentez
 * Gemini primary: soru_aciklama, koc_yorumu, hata_analizi, ipucu, copilot_sohbet
 *
 * Kaynak: Hermes agent/smart_model_routing.py + LearnHouse LLM provider uyarlaması
 */

export type Provider = "claude" | "gemini" | "none";

export type TaskType =
  | "konu_anlatimi"   // Claude Sonnet — kaliteli, detaylı
  | "soru_aciklama"   // Gemini Flash — hızlı, kısa
  | "uzman_panel"     // Claude Sonnet — sentez
  | "soru_uretimi"    // Claude Sonnet — yaratıcı
  | "koc_yorumu"      // Gemini Flash — motivasyonel, kısa
  | "hata_analizi"    // Gemini Flash — sınıflandırma
  | "ipucu"           // Gemini Flash — kısa yönlendirme
  | "rapor_sentez"    // Claude Sonnet — haftalık rapor
  | "plan_olusturma"  // Hesaplama — AI gereksiz
  | "copilot_sohbet"; // Gemini Flash — serbest sohbet

export interface ModelConfig {
  provider: Provider;
  model: string;
  maxTokens: number;
  /** Gemini kullanılamıyorsa fallback */
  fallbackProvider?: Provider;
  fallbackModel?: string;
}

export interface StudentContext {
  masterySkoru: number;
  hataEgilimi?: string | null;
  tekrarYanlisSayisi?: number;
}

// Claude modelleri
const CLAUDE_SONNET = "claude-sonnet-4-6";
const CLAUDE_HAIKU = "claude-haiku-4-5-20251001";

// Gemini modelleri
const GEMINI_FLASH = "gemini-2.5-flash";
const GEMINI_PRO = "gemini-2.5-pro";

const TASK_CONFIG: Record<TaskType, ModelConfig> = {
  // Claude primary görevler (kalite kritik)
  konu_anlatimi:  {
    provider: "claude", model: CLAUDE_SONNET, maxTokens: 3000,
    fallbackProvider: "gemini", fallbackModel: GEMINI_PRO,
  },
  uzman_panel:    {
    provider: "claude", model: CLAUDE_SONNET, maxTokens: 1000,
    fallbackProvider: "gemini", fallbackModel: GEMINI_PRO,
  },
  soru_uretimi:   {
    provider: "claude", model: CLAUDE_SONNET, maxTokens: 1024,
    fallbackProvider: "gemini", fallbackModel: GEMINI_PRO,
  },
  rapor_sentez:   {
    provider: "claude", model: CLAUDE_SONNET, maxTokens: 1500,
    fallbackProvider: "gemini", fallbackModel: GEMINI_PRO,
  },

  // Gemini primary görevler (hız + maliyet kritik)
  soru_aciklama:  {
    provider: "gemini", model: GEMINI_FLASH, maxTokens: 500,
    fallbackProvider: "claude", fallbackModel: CLAUDE_HAIKU,
  },
  koc_yorumu:     {
    provider: "gemini", model: GEMINI_FLASH, maxTokens: 300,
    fallbackProvider: "claude", fallbackModel: CLAUDE_HAIKU,
  },
  hata_analizi:   {
    provider: "gemini", model: GEMINI_FLASH, maxTokens: 200,
    fallbackProvider: "claude", fallbackModel: CLAUDE_HAIKU,
  },
  ipucu:          {
    provider: "gemini", model: GEMINI_FLASH, maxTokens: 200,
    fallbackProvider: "claude", fallbackModel: CLAUDE_HAIKU,
  },
  copilot_sohbet: {
    provider: "gemini", model: GEMINI_FLASH, maxTokens: 800,
    fallbackProvider: "claude", fallbackModel: CLAUDE_HAIKU,
  },

  // Hesaplama — AI yok
  plan_olusturma: { provider: "none", model: "none", maxTokens: 0 },
};

/**
 * Provider kullanılabilirlik durumu
 */
export function getProviderStatus(): {
  claude: boolean;
  gemini: boolean;
  primaryProvider: Provider;
} {
  const claude = !!(
    process.env.ANTHROPIC_API_KEY &&
    !process.env.ANTHROPIC_API_KEY.startsWith("buraya")
  );
  const gemini = !!(
    process.env.GEMINI_API_KEY &&
    !process.env.GEMINI_API_KEY.startsWith("buraya")
  );

  const primaryProvider: Provider = gemini ? "gemini" : claude ? "claude" : "none";

  return { claude, gemini, primaryProvider };
}

/**
 * Öğrenci bağlamına göre modeli yükseltmeli mi?
 */
function shouldUpgradeModel(taskType: TaskType, ctx?: StudentContext): boolean {
  if (!ctx) return false;

  // Mastery %25 altında → daha detaylı açıklama
  if (taskType === "soru_aciklama" && ctx.masterySkoru < 25) return true;

  // Aynı konuda 3+ yanlış → kavram eksikliği → kaliteli model
  if (taskType === "soru_aciklama" && (ctx.tekrarYanlisSayisi ?? 0) >= 3) return true;

  // Kavram eksikliği → derin analiz
  if (taskType === "hata_analizi" && ctx.hataEgilimi === "KAVRAM_EKSIK") return true;

  return false;
}

/**
 * Görev tipi ve öğrenci bağlamına göre aktif provider + model döndür.
 * Birincil provider kullanılamazsa fallback'e geç.
 */
export function getModelForTask(
  taskType: TaskType,
  studentContext?: StudentContext
): ModelConfig {
  const base = TASK_CONFIG[taskType];
  if (base.provider === "none") return base;

  const { claude, gemini } = getProviderStatus();

  // Upgrade: yüksek kaliteli modele geç
  if (shouldUpgradeModel(taskType, studentContext)) {
    // Gemini primary görevini Claude'a yükselt
    if (base.provider === "gemini" && claude) {
      return {
        provider: "claude",
        model: CLAUDE_SONNET,
        maxTokens: base.maxTokens * 2,
      };
    }
    // Claude primary — zaten en iyisi
    if (base.provider === "claude" && claude) {
      return { ...base, maxTokens: base.maxTokens * 2 };
    }
  }

  // Birincil provider aktif mi?
  const primaryOk =
    (base.provider === "claude" && claude) ||
    (base.provider === "gemini" && gemini);

  if (primaryOk) return base;

  // Fallback
  if (base.fallbackProvider && base.fallbackModel) {
    const fallbackOk =
      (base.fallbackProvider === "claude" && claude) ||
      (base.fallbackProvider === "gemini" && gemini);

    if (fallbackOk) {
      return {
        provider: base.fallbackProvider,
        model: base.fallbackModel,
        maxTokens: base.maxTokens,
      };
    }
  }

  // Hiç provider yok
  return { provider: "none", model: "none", maxTokens: 0 };
}

/**
 * Tahmini maliyet hesapla (USD)
 */
export function estimateTaskCost(taskType: TaskType): number {
  const config = TASK_CONFIG[taskType];
  if (config.provider === "none") return 0;

  const isFlash = config.model === GEMINI_FLASH;
  const isSonnet = config.model === CLAUDE_SONNET;
  const isPro = config.model === GEMINI_PRO;

  let inputCost: number;
  let outputCost: number;

  if (isSonnet) {
    inputCost = 3 / 1_000_000;
    outputCost = 15 / 1_000_000;
  } else if (isPro) {
    inputCost = 3.5 / 1_000_000;
    outputCost = 10.5 / 1_000_000;
  } else if (isFlash) {
    inputCost = 0.15 / 1_000_000;
    outputCost = 0.6 / 1_000_000;
  } else {
    // Haiku
    inputCost = 0.25 / 1_000_000;
    outputCost = 1.25 / 1_000_000;
  }

  const estimatedInput = config.maxTokens * 2;
  return estimatedInput * inputCost + config.maxTokens * outputCost;
}
