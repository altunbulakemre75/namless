/**
 * Prompt Engine — Adaptif AI Öğretmen
 *
 * RAG context + öğrenci profili → kişiselleştirilmiş yanıt
 */

import { RAGResult } from "../rag/search";
import { getModelForTask, type TaskType } from "./model-router";
import { sanitizeInput } from "../security/prompt-guard";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface StudentProfile {
  masteryScore: number; // 0-100
  enEtkiliStil?: string | null;
  ortCozumSureMs?: number;
  recentErrors?: string[]; // son hata kategorileri
}

async function callClaudeForTask(
  taskType: TaskType,
  prompt: string,
  studentCtx?: { masterySkoru: number; hataEgilimi?: string | null; tekrarYanlisSayisi?: number }
): Promise<string> {
  const config = getModelForTask(taskType, studentCtx);
  if (config.model === "none") return "";
  return callClaude(config.model, sanitizeInput(prompt, taskType), config.maxTokens);
}

async function callClaude(
  model: string,
  prompt: string,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("buraya")) {
    return "[AI yanıtı için ANTHROPIC_API_KEY gerekli]";
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Claude API hatası (${response.status}):`, errText);
    return "[AI yanıtı üretilemedi]";
  }

  const data = await response.json();
  const block = data.content?.find((b: { type: string }) => b.type === "text");
  return block?.text ?? "[Boş yanıt]";
}

function buildRAGContext(ragResults: RAGResult[]): string {
  if (ragResults.length === 0) return "";

  return `\n\n--- MEB KITAP İÇERİĞİ ---\n${ragResults
    .map(
      (r) =>
        `[Kaynak: ${r.kaynak} — ${r.bolum}]\n${r.icerik.slice(0, 2000)}`
    )
    .join("\n\n")}
--- KITAP İÇERİĞİ SONU ---\n`;
}

function seviyeStr(mastery: number): string {
  if (mastery >= 80) return "ileri";
  if (mastery >= 50) return "orta";
  return "başlangıç";
}

// ==================== 1. KİŞİSELLEŞTİRİLMİŞ DERS ANLATIMI ====================

export async function generatePersonalizedLesson(
  topicIsim: string,
  ders: string,
  ragResults: RAGResult[],
  profile: StudentProfile
): Promise<string> {
  const seviye = seviyeStr(profile.masteryScore);
  const stil =
    profile.enEtkiliStil === "ORNEKLI"
      ? "Bol örnek ve günlük hayat bağlantısı kullan."
      : profile.enEtkiliStil === "FORMULLU"
        ? "Formül ve kural ağırlıklı anlat."
        : profile.enEtkiliStil === "ADIM_ADIM"
          ? "Adım adım, her adımı ayrı açıkla."
          : profile.enEtkiliStil === "GORSEL"
            ? "Şema, tablo ve görsel açıklamalar kullan."
            : "Örneklerle destekleyerek anlat.";

  const ragContext = buildRAGContext(ragResults);

  const prompt = `Sen bir 8. sınıf ${ders} öğretmenisin. LGS'ye hazırlanan bir öğrenciye "${topicIsim}" konusunu anlatacaksın.

ÖĞRENCİ PROFİLİ:
- Seviye: ${seviye} (mastery: ${profile.masteryScore}/100)
- Öğrenme stili tercihi: ${stil}
${profile.recentErrors?.length ? `- Son hataları: ${profile.recentErrors.join(", ")}` : ""}

${seviye === "başlangıç" ? `YAKLAŞIM: Çok basit dille başla. Günlük hayattan örnekler ver. Her kavramı tek tek açıkla. Sık yapılan hatalardan bahset.` : seviye === "orta" ? `YAKLAŞIM: Temel kavramları kısa hatırlat, ağırlığı uygulamaya ver. LGS tarzı soru çözüm stratejileri göster. Tuzak noktaları vurgula.` : `YAKLAŞIM: Derinlemesine analiz. İleri düzey problemler ve çözüm kısayolları. Farklı yaklaşımları karşılaştır. LGS'de zaman kazandıran teknikler.`}
${ragContext}

KURALLAR:
- MEB 8. sınıf müfredatına uygun ol
- ${ragResults.length > 0 ? "Yukarıdaki kitap içeriğini temel al, eksik kısımları kendi bilginle tamamla" : "MEB müfredatına göre kapsamlı anlat"}
- Markdown formatı kullan (başlıklar, listeler, kalın metin)
- Formül varsa açıkça yaz
- En az 2 çözümlü örnek ver
- Sonunda "Dikkat Edilecek Noktalar" bölümü ekle
- Türkçe yaz, 8. sınıf öğrencisinin anlayacağı dilde

Konuyu anlat:`;

  return callClaudeForTask("konu_anlatimi", prompt, { masterySkoru: profile.masteryScore });
}

// ==================== 2. YANLIŞ CEVAP ANALİZİ ====================

export interface WrongAnswerAnalysis {
  hataKategorisi: string;
  aciklama: string;
  oneri: string;
}

export async function analyzeWrongAnswer(
  soruMetni: string,
  siklar: string[],
  dogruSik: number,
  secilenSik: number,
  ragResults: RAGResult[],
  profile: StudentProfile
): Promise<WrongAnswerAnalysis> {
  const ragContext = buildRAGContext(ragResults);

  const prompt = `Bir 8. sınıf öğrencisi aşağıdaki soruyu yanlış cevapladı. Analiz et.

SORU: ${soruMetni}
ŞIKLAR:
${siklar.map((s, i) => `${String.fromCharCode(65 + i)}) ${s}`).join("\n")}

ÖĞRENCİNİN CEVABI: ${String.fromCharCode(65 + secilenSik)}) ${siklar[secilenSik]}
DOĞRU CEVAP: ${String.fromCharCode(65 + dogruSik)}) ${siklar[dogruSik]}

ÖĞRENCİ PROFİLİ:
- Seviye: ${seviyeStr(profile.masteryScore)}
- Ortalama çözüm süresi: ${Math.round((profile.ortCozumSureMs ?? 30000) / 1000)}sn
${ragContext}

Şu JSON formatında yanıt ver:
{
  "hataKategorisi": "KAVRAM_EKSIK" veya "DIKKATSIZLIK" veya "KONU_ATLAMA" veya "ZAMAN_BASKISI",
  "aciklama": "Öğrenciye yönelik, 8. sınıf seviyesinde açıklama. Neden yanlış yaptığını ve doğru çözümü adım adım anlat.",
  "oneri": "Kısa bir öneri cümlesi (Bu konuyu tekrar çalış / Dikkat et, kavramı biliyorsun / vb.)"
}

Sadece JSON döndür, başka bir şey yazma.`;

  const text = await callClaudeForTask("hata_analizi", prompt, {
    masterySkoru: profile.masteryScore,
    hataEgilimi: profile.recentErrors?.[0] ?? null,
  });

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Parse hatası
  }

  return {
    hataKategorisi: "BILINMIYOR",
    aciklama: text,
    oneri: "Bu konuyu tekrar gözden geçir.",
  };
}

// ==================== 3. İPUCU ÜRETİCİ ====================

export async function generateHint(
  soruMetni: string,
  profile: StudentProfile
): Promise<string> {
  const prompt = `Bir 8. sınıf öğrencisi aşağıdaki soruda takıldı. Cevabı söylemeden yönlendir.

SORU: ${soruMetni}

ÖĞRENCİ SEVİYESİ: ${seviyeStr(profile.masteryScore)}

KURALLAR:
- Cevabı kesinlikle söyleme
- Doğru düşünme yolunu göster
- 2-3 cümle, kısa ve net
- 8. sınıf seviyesinde

İpucu:`;

  return callClaudeForTask("ipucu", prompt, { masterySkoru: profile.masteryScore });
}

// ==================== 4. KOÇ YORUMU ====================

export interface CoachCommentData {
  toplamSoru: number;
  dogruOrani: number;
  streak: number;
  enCokHata: string;
  zayifDersler: string[];
  gucluDersler: string[];
  masteryDegisim: Record<string, number>; // ders → değişim
}

export async function generateCoachComment(
  data: CoachCommentData
): Promise<string> {
  const prompt = `Sen bir LGS hazırlık koçusun. Öğrencinin son haftalık performansını değerlendir.

HAFTALIK İSTATİSTİKLER:
- Çözülen soru: ${data.toplamSoru}
- Doğru oranı: %${Math.round(data.dogruOrani * 100)}
- Çalışma serisi: ${data.streak} gün
- En sık hata türü: ${data.enCokHata}
- Zayıf dersler: ${data.zayifDersler.join(", ") || "Yok"}
- Güçlü dersler: ${data.gucluDersler.join(", ") || "Henüz belirlenmedi"}
- Mastery değişimleri: ${Object.entries(data.masteryDegisim)
    .map(([d, v]) => `${d}: ${v > 0 ? "+" : ""}${v}`)
    .join(", ") || "Veri yok"}

KURALLAR:
- 3-4 cümle, samimi ve motive edici
- Somut bir aksiyon öner ("Bugün şunu çalış", "Bu hafta şuna odaklan")
- Başarıları takdir et, ama dürüst ol
- Emoji kullanabilirsin
- Öğrenciye "sen" diye hitap et
- LGS'ye kaç gün kaldığını hatırlat (${Math.ceil((new Date("2026-06-07").getTime() - Date.now()) / 86400000)} gün)

Koç yorumu:`;

  return callClaudeForTask("koc_yorumu", prompt);
}
