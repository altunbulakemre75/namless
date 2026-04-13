/**
 * Multi-Agent Tartışma — Uzman Panel
 *
 * BettaFish ForumEngine konseptinin LGS uyarlaması.
 * 3 uzman (Konu, Pedagoji, Strateji) paralel analiz + moderatör sentezi.
 *
 * Basit mod: Tek Haiku çağrısı (ücretsiz kullanıcılar)
 * Uzman Panel: 3 paralel + 1 sentez (premium veya zor sorular)
 */

import { getModelForTask } from "./model-router";
import { sanitizeInput } from "../security/prompt-guard";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface Expert {
  name: string;
  role: string;
  systemPrompt: string;
  model: string;
}

const EXPERTS: Expert[] = [
  {
    name: "Konu Uzmanı",
    role: "subject_expert",
    systemPrompt: `Sen bir LGS konu uzmanısın. Soruyu akademik açıdan analiz et.
Kavramsal hataları tespit et. Doğru çözüm yolunu adım adım göster.
Kısa ve öz ol. Türkçe yaz.`,
    model: "claude-sonnet-4-6",
  },
  {
    name: "Pedagoji Uzmanı",
    role: "pedagogy_expert",
    systemPrompt: `Sen bir eğitim psikoloğusun. Öğrencinin neden yanlış yaptığını analiz et.
Kavram yanılgısı mı, dikkatsizlik mi, bilgi eksikliği mi tespit et.
Hata kategorisini belirle: KAVRAM_EKSIK, DIKKATSIZLIK, KONU_ATLAMA veya ZAMAN_BASKISI.
Kısa ol. Türkçe yaz.`,
    model: "claude-haiku-4-5-20251001",
  },
  {
    name: "Sınav Stratejisti",
    role: "exam_strategist",
    systemPrompt: `Sen bir LGS sınav koçusun. Bu tarz sorular sınavda nasıl çıkar?
Tuzak noktaları neler? Zaman yönetimi açısından kaç dakika ayrılmalı?
Pratik ipuçları ver. Kısa ol. Türkçe yaz.`,
    model: "claude-haiku-4-5-20251001",
  },
];

export interface ExpertOpinion {
  expert: string;
  aciklama: string;
  hataKategorisi?: string;
  onerilenAksiyon?: string;
}

export interface ExpertPanelResult {
  konuAnalizi: ExpertOpinion;
  pedagojiAnalizi: ExpertOpinion;
  stratejiAnalizi: ExpertOpinion;
  sentez: string;
  hataKategorisi: string;
  onerilenAksiyon: string;
}

async function callExpert(
  expert: Expert,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("buraya")) return "[API key gerekli]";

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: expert.model,
      max_tokens: 500,
      system: expert.systemPrompt,
      messages: [{ role: "user", content: sanitizeInput(userPrompt, expert.role) }],
    }),
  });

  if (!response.ok) return "[Uzman yanıt veremedi]";

  const data = await response.json();
  return data.content?.[0]?.text ?? "[Boş yanıt]";
}

/**
 * Uzman panelini çalıştır — 3 paralel analiz + 1 sentez
 */
export async function runExpertPanel(
  soruMetni: string,
  siklar: string[],
  dogruSik: number,
  secilenSik: number,
  studentContext?: string, // buildPromptContext çıktısı
): Promise<ExpertPanelResult> {
  const soruBaglam = `SORU: ${soruMetni}
ŞIKLAR:
${siklar.map((s, i) => `${String.fromCharCode(65 + i)}) ${s}`).join("\n")}

ÖĞRENCİNİN CEVABI: ${String.fromCharCode(65 + secilenSik)}) ${siklar[secilenSik]}
DOĞRU CEVAP: ${String.fromCharCode(65 + dogruSik)}) ${siklar[dogruSik]}
${studentContext ? `\n${studentContext}` : ""}`;

  // Adım 1: 3 uzman paralel analiz
  const [konuText, pedagojiText, stratejiText] = await Promise.all([
    callExpert(EXPERTS[0], soruBaglam),
    callExpert(EXPERTS[1], soruBaglam),
    callExpert(EXPERTS[2], soruBaglam),
  ]);

  const konuAnalizi: ExpertOpinion = { expert: "Konu Uzmanı", aciklama: konuText };
  const pedagojiAnalizi: ExpertOpinion = { expert: "Pedagoji Uzmanı", aciklama: pedagojiText };
  const stratejiAnalizi: ExpertOpinion = { expert: "Sınav Stratejisti", aciklama: stratejiText };

  // Hata kategorisini pedagoji analizinden çıkar
  const hataKategorisi = extractHataKategorisi(pedagojiText);
  pedagojiAnalizi.hataKategorisi = hataKategorisi;

  // Adım 2: Sentez — moderatör uzman görüşlerini birleştirir
  const sentezConfig = getModelForTask("uzman_panel");
  const sentez = await synthesizeOpinions(
    konuText, pedagojiText, stratejiText, sentezConfig.model
  );

  return {
    konuAnalizi,
    pedagojiAnalizi,
    stratejiAnalizi,
    sentez,
    hataKategorisi,
    onerilenAksiyon: stratejiAnalizi.onerilenAksiyon ?? "Bu konuyu tekrar çalış",
  };
}

async function synthesizeOpinions(
  konuText: string,
  pedagojiText: string,
  stratejiText: string,
  model: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("buraya")) return konuText; // fallback

  const prompt = `Üç uzman bir öğrencinin yanlış cevabını analiz etti. Sentezle.

KONU UZMANI:
${konuText}

PEDAGOJİ UZMANI:
${pedagojiText}

SINAV STRATEJİSTİ:
${stratejiText}

Bu üç görüşü sentezleyerek öğrenciye TEK bir açıklama yaz.
300 kelimeyi geçme. Türkçe, sade dil. 8. sınıf seviyesinde.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) return `${konuText}\n\n${pedagojiText}`;

  const data = await response.json();
  return data.content?.[0]?.text ?? konuText;
}

function extractHataKategorisi(text: string): string {
  if (/kavram.*(eksik|yanılgı)/i.test(text)) return "KAVRAM_EKSIK";
  if (/dikkat/i.test(text)) return "DIKKATSIZLIK";
  if (/konu.*(atlama|eksik)/i.test(text)) return "KONU_ATLAMA";
  if (/zaman|hız|süre/i.test(text)) return "ZAMAN_BASKISI";
  return "BILINMIYOR";
}

/**
 * Uzman paneli tetiklenmeli mi?
 * Premium kullanıcılar veya belirli koşullarda otomatik tetiklenir
 */
export function shouldTriggerExpertPanel(opts: {
  isPremium: boolean;
  zorluk: number;
  tekrarYanlisSayisi: number;
  manuelTetik: boolean;
}): boolean {
  if (opts.manuelTetik) return true;
  if (opts.isPremium) return true;
  if (opts.zorluk >= 3) return true;
  if (opts.tekrarYanlisSayisi >= 3) return true;
  return false;
}
