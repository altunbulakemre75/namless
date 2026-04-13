/**
 * AI Soru Üretici — DeepTutor QGen uyarlaması
 *
 * Geçmiş LGS sınavı kalıplarına bakarak yeni soru üretir.
 * Üretilen sorular DRAFT olarak kaydedilir, admin onayını bekler.
 *
 * Özellikler:
 * - Konu + zorluk + sınav yılı kalıbı bağlamı verilir
 * - JSON çıktısı: soruMetni, siklar[4], dogruSik, aciklama, ipucu
 * - Toplu üretim (adet parametresi)
 * - Her soru ayrı API çağrısı (paralel, rate-limit'e dikkat)
 */

import { getModelForTask } from "./model-router";
import { sanitizeInput } from "../security/prompt-guard";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export interface GeneratedQuestion {
  soruMetni: string;
  siklar: [string, string, string, string];
  dogruSik: number; // 0-3
  aciklama: string;
  ipucu?: string;
}

export interface QGenOptions {
  topicIsim: string;
  ders: string;
  zorluk: 1 | 2 | 3;
  adet: number;
  kazanimlar?: string[];
  gecmisSoruOrnegi?: string; // Varsa referans soru
}

const ZORLUK_TANIM: Record<number, string> = {
  1: "kolay (LGS'de ilk 10 soruda çıkar, tek adım çözüm)",
  2: "orta (LGS'de 10-25. sorular arası, 2-3 adım çözüm)",
  3: "zor (LGS'de son 10 soru, çok adımlı veya tuzak içerir)",
};

/**
 * Tek bir soru üret
 */
async function generateOne(opts: QGenOptions, apiKey: string): Promise<GeneratedQuestion | null> {
  const config = getModelForTask("soru_uretimi");

  const kazanimStr = opts.kazanimlar?.length
    ? `\nKazanımlar: ${opts.kazanimlar.join("; ")}`
    : "";

  const ornekStr = opts.gecmisSoruOrnegi
    ? `\nReferans LGS sorusu (bu stilde üret, kopyalama):\n${opts.gecmisSoruOrnegi}`
    : "";

  const prompt = `Sen bir LGS soru yazarısın. Aşağıdaki konuda gerçekçi, özgün bir çoktan seçmeli soru üret.

Konu: ${sanitizeInput(opts.topicIsim, "soru_uretimi")}
Ders: ${opts.ders}
Zorluk: ${ZORLUK_TANIM[opts.zorluk]}${kazanimStr}${ornekStr}

KURALLAR:
- Soru gerçek LGS formatında olsun (kısa, net, tek doğru cevap)
- 4 şık (A, B, C, D) — yalnızca biri doğru
- Yanlış şıklar makul görünmeli, açık yanlış olmamalı
- Türkçe, 8. sınıf seviyesinde
- Açıklama: neden doğru, neden diğerleri yanlış (2-3 cümle)

YANIT FORMATINI KESİNLİKLE KULLAN (başka bir şey yazma):
{
  "soruMetni": "...",
  "siklar": ["A şıkkı içeriği", "B şıkkı içeriği", "C şıkkı içeriği", "D şıkkı içeriği"],
  "dogruSik": 0,
  "aciklama": "...",
  "ipucu": "..."
}

dogruSik 0=A, 1=B, 2=C, 3=D indeksidir.`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text: string = data.content?.[0]?.text ?? "";

    // JSON çıkar
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as Partial<GeneratedQuestion>;

    // Validasyon
    if (
      !parsed.soruMetni ||
      !Array.isArray(parsed.siklar) ||
      parsed.siklar.length !== 4 ||
      typeof parsed.dogruSik !== "number" ||
      parsed.dogruSik < 0 ||
      parsed.dogruSik > 3 ||
      !parsed.aciklama
    ) {
      return null;
    }

    return {
      soruMetni: parsed.soruMetni,
      siklar: parsed.siklar as [string, string, string, string],
      dogruSik: parsed.dogruSik,
      aciklama: parsed.aciklama,
      ipucu: parsed.ipucu,
    };
  } catch {
    return null;
  }
}

/**
 * Toplu soru üret (paralel, max 3 eş zamanlı)
 */
export async function generateQuestions(
  opts: QGenOptions
): Promise<{ sorular: GeneratedQuestion[]; basarisizAdet: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey || apiKey.startsWith("buraya")) {
    return { sorular: [], basarisizAdet: opts.adet };
  }

  const adet = Math.min(opts.adet, 5); // max 5

  // 3'erli batch (rate limit önlemi)
  const results: GeneratedQuestion[] = [];
  let basarisiz = 0;

  for (let i = 0; i < adet; i += 3) {
    const batch = Math.min(3, adet - i);
    const promises = Array.from({ length: batch }, () => generateOne(opts, apiKey));
    const batchResults = await Promise.all(promises);

    for (const r of batchResults) {
      if (r) results.push(r);
      else basarisiz++;
    }

    // Batch'ler arası 500ms — rate limit
    if (i + 3 < adet) await new Promise((res) => setTimeout(res, 500));
  }

  return { sorular: results, basarisizAdet: basarisiz };
}
