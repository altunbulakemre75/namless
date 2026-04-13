/**
 * Akıllı Çözüm Motoru — DeepTutor SmartSolver uyarlaması
 *
 * Tek çağrı yerine çift döngü analiz:
 *   Döngü 1 (Araştır+Not): Soruyu anla, aday açıklamaları üret
 *   Döngü 2 (Planla+Çöz+Kontrol): En iyi açıklamayı seç, yapılandır, doğrula
 *
 * Neden daha iyi?
 * - İlk geçişte bilgi toplar, ikinci geçişte sentezler
 * - Hata kategorisi + öğrenci seviyesine göre açıklama derinliği ayarlanır
 * - Çıktı: yapılandırılmış JSON (hataKategorisi + adimlar + sonuc + oneri)
 */

import { getModelForTask } from "./model-router";
import { sanitizeInput } from "../security/prompt-guard";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export type HataKategorisi =
  | "KAVRAM_EKSIK"
  | "DIKKATSIZLIK"
  | "KONU_ATLAMA"
  | "ZAMAN_BASKISI"
  | "HESAP_HATASI"
  | "BILINMIYOR";

export interface SmartSolverResult {
  hataKategorisi: HataKategorisi;
  aciklama: string;           // Öğrenciye yönelik açıklama (yapılandırılmış)
  adimlar: string[];          // Çözüm adımları
  dogru_mantik: string;       // Neden doğru cevap doğru
  yanlis_mantik: string;      // Öğrenci neden yanlış seçti
  oneri: string;              // Ne yapmalı (somut)
  guven: number;              // 0-1, analizin güven skoru
}

interface LoopOneResult {
  hataAdaylari: string[];
  soruAnalizi: string;
  konuBaglam: string;
}

/**
 * Döngü 1: Araştır + Not al
 * Soruyu analiz et, olası hata kategorilerini listele
 */
async function investigateLoop(
  soruMetni: string,
  siklar: string[],
  dogruSik: number,
  secilenSik: number,
  apiKey: string,
  model: string,
): Promise<LoopOneResult> {
  const prompt = `Sen bir LGS analiz uzmanısın. BU SORUYU DERİNLEMESİNE ANALİZ ET.

SORU: ${sanitizeInput(soruMetni, "hata_analizi")}
ŞIKLAR:
${siklar.map((s, i) => `${String.fromCharCode(65 + i)}) ${s}`).join("\n")}

ÖĞRENCİ CEVABI: ${String.fromCharCode(65 + secilenSik)}) ${siklar[secilenSik] ?? "?"}
DOĞRU CEVAP: ${String.fromCharCode(65 + dogruSik)}) ${siklar[dogruSik] ?? "?"}

GÖREV — Şunları belirle:
1. Bu sorunun temel kavramsal gereksinimleri nelerdir?
2. Öğrencinin seçtiği yanlış şıkta ne tür bir düşünce mantığı olabilir?
3. Olası hata kategorileri (KAVRAM_EKSIK, DIKKATSIZLIK, KONU_ATLAMA, HESAP_HATASI, ZAMAN_BASKISI)?
4. Bu tarz hataların kökeninde ne yatıyor?

Kısa notlar halinde yaz, JSON değil, düz metin. Türkçe.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return { hataAdaylari: ["BILINMIYOR"], soruAnalizi: "", konuBaglam: "" };
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "";

  return {
    hataAdaylari: extractCategories(text),
    soruAnalizi: text,
    konuBaglam: soruMetni.slice(0, 200),
  };
}

/**
 * Döngü 2: Planla + Çöz + Kontrol
 * Döngü 1 notlarından yapılandırılmış açıklama üret
 */
async function synthesizeLoop(
  soruMetni: string,
  siklar: string[],
  dogruSik: number,
  secilenSik: number,
  loop1: LoopOneResult,
  masterySkoru: number,
  apiKey: string,
  model: string,
): Promise<SmartSolverResult> {
  const seviye = masterySkoru < 30 ? "başlangıç" : masterySkoru < 60 ? "orta" : "ileri";

  const prompt = `Sen bir LGS öğretmenisin. Aşağıdaki analiz notlarını kullanarak YAPILANDIRILMIŞ bir açıklama üret.

SORU: ${sanitizeInput(soruMetni, "hata_analizi")}
DOĞRU CEVAP: ${String.fromCharCode(65 + dogruSik)}) ${siklar[dogruSik] ?? "?"}
ÖĞRENCİ CEVABI: ${String.fromCharCode(65 + secilenSik)}) ${siklar[secilenSik] ?? "?"}

ANALİZ NOTLARI (Döngü 1):
${loop1.soruAnalizi}

ÖĞRENCİ SEVİYESİ: ${seviye} (mastery: ${masterySkoru}/100)

GÖREV: Aşağıdaki JSON formatında yapılandırılmış açıklama üret.
${seviye === "başlangıç" ? "Dil çok sade olsun, adım adım anlat." : seviye === "orta" ? "Kavramsal bağlantıları göster." : "Derinlemesine kavramsal analiz yap."}

SADECE JSON yaz, başka hiçbir şey:
{
  "hataKategorisi": "KAVRAM_EKSIK|DIKKATSIZLIK|KONU_ATLAMA|HESAP_HATASI|ZAMAN_BASKISI|BILINMIYOR",
  "aciklama": "Öğrenciye yönelik ana açıklama (2-3 cümle)",
  "adimlar": ["1. adım", "2. adım", "3. adım"],
  "dogru_mantik": "Neden doğru cevap doğru (1 cümle)",
  "yanlis_mantik": "Öğrenci neden bu şıkkı seçmiş olabilir (1 cümle)",
  "oneri": "Somut öneri: ne çalışmalı, nasıl pratik yapmalı",
  "guven": 0.85
}`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return buildFallback(loop1.hataAdaylari[0] ?? "BILINMIYOR");
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return buildFallback(loop1.hataAdaylari[0] ?? "BILINMIYOR");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      hataKategorisi: (parsed.hataKategorisi ?? "BILINMIYOR") as HataKategorisi,
      aciklama: parsed.aciklama ?? "Soruyu tekrar incele.",
      adimlar: Array.isArray(parsed.adimlar) ? parsed.adimlar : [],
      dogru_mantik: parsed.dogru_mantik ?? "",
      yanlis_mantik: parsed.yanlis_mantik ?? "",
      oneri: parsed.oneri ?? "Bu konuyu tekrar çalış.",
      guven: typeof parsed.guven === "number" ? parsed.guven : 0.7,
    };
  } catch {
    return buildFallback(loop1.hataAdaylari[0] ?? "BILINMIYOR");
  }
}

/**
 * Ana giriş noktası — çift döngü analiz
 */
export async function analyzeWithSmartSolver(opts: {
  soruMetni: string;
  siklar: string[];
  dogruSik: number;
  secilenSik: number;
  masterySkoru: number;
}): Promise<SmartSolverResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey || apiKey.startsWith("buraya")) {
    return buildFallback("BILINMIYOR");
  }

  const { model } = getModelForTask("hata_analizi", {
    masterySkoru: opts.masterySkoru,
    tekrarYanlisSayisi: 0,
  });

  // Döngü 1
  const loop1 = await investigateLoop(
    opts.soruMetni,
    opts.siklar,
    opts.dogruSik,
    opts.secilenSik,
    apiKey,
    model,
  );

  // Döngü 2
  const result = await synthesizeLoop(
    opts.soruMetni,
    opts.siklar,
    opts.dogruSik,
    opts.secilenSik,
    loop1,
    opts.masterySkoru,
    apiKey,
    model,
  );

  return result;
}

// --- Yardımcılar ---

function extractCategories(text: string): string[] {
  const cats: string[] = [];
  if (/kavram/i.test(text)) cats.push("KAVRAM_EKSIK");
  if (/dikkat/i.test(text)) cats.push("DIKKATSIZLIK");
  if (/konu.*(atlama|eksik)/i.test(text)) cats.push("KONU_ATLAMA");
  if (/hesap/i.test(text)) cats.push("HESAP_HATASI");
  if (/zaman|hız|süre/i.test(text)) cats.push("ZAMAN_BASKISI");
  return cats.length ? cats : ["BILINMIYOR"];
}

function buildFallback(hata: string): SmartSolverResult {
  return {
    hataKategorisi: (hata as HataKategorisi) ?? "BILINMIYOR",
    aciklama: "Soruyu tekrar inceleyin ve doğru cevabın neden doğru olduğunu düşünün.",
    adimlar: ["Soruyu dikkatlice oku", "Her şıkkı kontrol et", "Doğru cevabı anlayarak geç"],
    dogru_mantik: "Doğru cevap temel kavramı doğru uygular.",
    yanlis_mantik: "Seçilen şık yaygın bir kavram yanılgısını yansıtıyor olabilir.",
    oneri: "Bu konuyu bir kez daha çalış ve benzer sorular çöz.",
    guven: 0,
  };
}
