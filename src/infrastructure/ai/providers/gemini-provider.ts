/**
 * Gemini Provider — Google AI entegrasyonu
 *
 * LearnHouse LLM provider adaptörü uyarlaması.
 * REST API (fetch tabanlı) — SDK bağımlılığı yok.
 *
 * Desteklenen modeller:
 *   - gemini-2.5-flash: Hızlı görevler (soru açıklama, ipucu, koç yorumu)
 *   - gemini-2.5-pro:   Kaliteli çıktı (konu anlatımı, rapor)
 */

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export const GEMINI_MODELS = {
  flash: "gemini-2.5-flash",
  pro:   "gemini-2.5-pro",
} as const;

export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

export interface GeminiCallConfig {
  model: string;
  maxTokens: number;
  temperature?: number;
}

interface GeminiContent {
  parts: Array<{ text: string }>;
  role: "user" | "model";
}

interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: { parts: Array<{ text: string }> };
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
}

/**
 * Gemini API key var mı?
 */
export function isGeminiAvailable(): boolean {
  const key = process.env.GEMINI_API_KEY ?? "";
  return key.length > 0 && !key.startsWith("buraya");
}

/**
 * Tek seferlik Gemini çağrısı — tam metin döndür.
 */
export async function callGemini(
  prompt: string,
  config: GeminiCallConfig,
  systemPrompt?: string
): Promise<string> {
  if (!isGeminiAvailable()) {
    return "[AI yanıtı için GEMINI_API_KEY gerekli]";
  }

  const apiKey = process.env.GEMINI_API_KEY!;
  const url = `${GEMINI_BASE_URL}/models/${config.model}:generateContent?key=${apiKey}`;

  const body: GeminiRequest = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: config.maxTokens,
      temperature: config.temperature ?? 0.7,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Gemini API hatası (${response.status}):`, errText);
    return "[GEMINI_ERROR]";
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text ?? "";
  return text || "[Boş Gemini yanıtı]";
}

/**
 * Streaming Gemini çağrısı — SSE için AsyncGenerator.
 * Server-Sent Events endpoint'lerinde kullanılır.
 */
export async function* callGeminiStream(
  prompt: string,
  config: GeminiCallConfig,
  systemPrompt?: string
): AsyncGenerator<string> {
  if (!isGeminiAvailable()) {
    yield "[AI yanıtı için GEMINI_API_KEY gerekli]";
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY!;
  const url = `${GEMINI_BASE_URL}/models/${config.model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const body: GeminiRequest = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: config.maxTokens,
      temperature: config.temperature ?? 0.7,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("Gemini stream bağlantı hatası:", err);
    yield "[GEMINI_ERROR]";
    return;
  }

  if (!response.ok || !response.body) {
    const errText = await response.text();
    console.error(`Gemini stream hatası (${response.status}):`, errText);
    yield "[GEMINI_ERROR]";
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") return;

      try {
        const chunk = JSON.parse(jsonStr);
        const parts: Array<{ text?: string; thought?: boolean }> =
          chunk.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          // Gemini 2.5 düşünce (thinking) parçalarını atla
          if (part.thought) continue;
          if (part.text) yield part.text;
        }
      } catch {
        // Geçersiz JSON satırı — atla
      }
    }
  }
}
