"use client";

/**
 * KocBaloncugu — Kayan AI Koç Baloncuğu
 *
 * LearnHouse CopilotBubble adaptörü.
 * Ekranın sağ alt köşesinde sabit konumlu FAB butonu.
 * SSE streaming ile gerçek zamanlı AI yanıtları.
 *
 * Modlar:
 *   konu   — Seçili konu hakkında soru sor
 *   genel  — LGS genel soru/motivasyon
 *   ipucu  — Kısa çözüm ipucu
 */

import { useState, useRef, useEffect } from "react";
import { processStream } from "@/infrastructure/ai/streaming";
import { createClient } from "@/lib/supabase/client";

interface Props {
  topicId?: string;
  topicIsim?: string;
  ders?: string;
}

type Mod = "konu" | "genel" | "ipucu";
type TaskType = "copilot_sohbet" | "ipucu" | "konu_anlatimi";

interface Mesaj {
  rol: "kullanici" | "koc";
  metin: string;
}

const STARTER_SUGGESTIONS: Record<Mod, string[]> = {
  konu: [
    "Bu konuyu özetler misin?",
    "En sık yapılan hatalar neler?",
    "LGS'de bu konudan ne çıkar?",
    "Pratik bir örnek ver",
  ],
  genel: [
    "Bu hafta nasıl çalışmalıyım?",
    "LGS'ye nasıl hazırlanmalıyım?",
    "Motivasyonum düştü, ne yapayım?",
    "Hangi konuya odaklanmalıyım?",
  ],
  ipucu: [
    "Bu soruyu nasıl çözebilirim?",
    "Hangi formülü kullanmalıyım?",
    "Nerede yanılıyorum?",
  ],
};

const MOD_LABEL: Record<Mod, string> = {
  konu: "Konu",
  genel: "Genel",
  ipucu: "İpucu",
};

const MOD_TASK: Record<Mod, TaskType> = {
  konu: "konu_anlatimi",
  genel: "copilot_sohbet",
  ipucu: "ipucu",
};

export default function KocBaloncugu({ topicId, topicIsim, ders }: Props) {
  const [acik, setAcik] = useState(false);
  const [mod, setMod] = useState<Mod>(topicIsim ? "konu" : "genel");
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [girdi, setGirdi] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [takipSorular, setTakipSorular] = useState<string[]>([]);
  const mesajSonuRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Yeni mesaj gelince scroll
  useEffect(() => {
    mesajSonuRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar]);

  // Mod değişince takip soruları sıfırla
  useEffect(() => {
    setTakipSorular(STARTER_SUGGESTIONS[mod].slice(0, 3));
    setMesajlar([]);
  }, [mod]);

  async function getToken(): Promise<string | null> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  function buildPrompt(metin: string): string {
    const konuContext = topicIsim
      ? `\n\nKonu: ${topicIsim}${ders ? ` (${ders})` : ""}${topicId ? ` [ID: ${topicId}]` : ""}`
      : "";

    const gecmis =
      mesajlar.length > 0
        ? "\n\nSohbet geçmişi:\n" +
          mesajlar
            .slice(-4)
            .map((m) => `${m.rol === "kullanici" ? "Öğrenci" : "Koç"}: ${m.metin}`)
            .join("\n")
        : "";

    return `Sen bir LGS hazırlık koçusun. 8. sınıf öğrencisine yardım ediyorsun.${konuContext}${gecmis}\n\nÖğrenci: ${metin}\n\nKoç (kısa, net, Türkçe):`;
  }

  async function gonder(metin?: string) {
    const soru = (metin ?? girdi).trim();
    if (!soru || streaming) return;

    setGirdi("");
    setTakipSorular([]);
    setMesajlar((prev) => [...prev, { rol: "kullanici", metin: soru }]);

    const token = await getToken();
    if (!token) {
      setMesajlar((prev) => [
        ...prev,
        { rol: "koc", metin: "Lütfen önce giriş yap." },
      ]);
      return;
    }

    // Koç yanıtı için boş yer aç
    setMesajlar((prev) => [...prev, { rol: "koc", metin: "" }]);
    setStreaming(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: buildPrompt(soru),
          topicId,
          mode: MOD_TASK[mod],
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        setMesajlar((prev) => {
          const arr = [...prev];
          arr[arr.length - 1] = { rol: "koc", metin: "Yanıt alınamadı. Tekrar dene." };
          return arr;
        });
        return;
      }

      await processStream(response, {
        onChunk: (text) => {
          setMesajlar((prev) => {
            const arr = [...prev];
            arr[arr.length - 1] = {
              rol: "koc",
              metin: arr[arr.length - 1].metin + text,
            };
            return arr;
          });
        },
        onDone: () => {
          // Takip soruları üret
          setTakipSorular(STARTER_SUGGESTIONS[mod].slice(0, 2));
        },
        onError: (msg) => {
          setMesajlar((prev) => {
            const arr = [...prev];
            arr[arr.length - 1] = { rol: "koc", metin: `Hata: ${msg}` };
            return arr;
          });
        },
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMesajlar((prev) => {
        const arr = [...prev];
        arr[arr.length - 1] = { rol: "koc", metin: "Bağlantı hatası." };
        return arr;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <>
      {/* FAB Butonu */}
      <button
        onClick={() => setAcik((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center text-2xl"
        title="AI Koç"
        aria-label="AI Koç aç/kapat"
      >
        {acik ? "✕" : "🤖"}
      </button>

      {/* Panel */}
      {acik && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "70vh" }}
        >
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 text-white flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">AI Koç</p>
              {topicIsim && (
                <p className="text-xs text-indigo-200 truncate">{topicIsim}</p>
              )}
            </div>
            {/* Mod seçici */}
            <div className="flex gap-1">
              {(["konu", "genel", "ipucu"] as Mod[])
                .filter((m) => m !== "konu" || !!topicIsim)
                .map((m) => (
                  <button
                    key={m}
                    onClick={() => setMod(m)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                      mod === m
                        ? "bg-white text-indigo-700 font-semibold"
                        : "text-indigo-200 hover:text-white"
                    }`}
                  >
                    {MOD_LABEL[m]}
                  </button>
                ))}
            </div>
          </div>

          {/* Mesajlar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {mesajlar.length === 0 && (
              <p className="text-xs text-gray-400 text-center pt-4">
                Sormak istediğin bir şey var mı?
              </p>
            )}
            {mesajlar.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.rol === "kullanici" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.rol === "kullanici"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {m.metin || (streaming && i === mesajlar.length - 1 ? (
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                    </span>
                  ) : "—")}
                </div>
              </div>
            ))}
            <div ref={mesajSonuRef} />
          </div>

          {/* Takip soruları */}
          {takipSorular.length > 0 && !streaming && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-gray-50">
              {takipSorular.map((s) => (
                <button
                  key={s}
                  onClick={() => gonder(s)}
                  className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 hover:bg-indigo-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
            <input
              type="text"
              value={girdi}
              onChange={(e) => setGirdi(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && gonder()}
              placeholder="Bir şey sor..."
              disabled={streaming}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 disabled:bg-gray-50"
            />
            <button
              onClick={() => gonder()}
              disabled={!girdi.trim() || streaming}
              className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700 transition-colors shrink-0"
              title="Gönder"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
