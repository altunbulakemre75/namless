"use client";

import { useState, useRef, useEffect } from "react";
import { processStream } from "@/infrastructure/ai/streaming";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, X, Camera } from "lucide-react";

interface Props {
  topicId?: string;
  topicIsim?: string;
  ders?: string;
  variant?: "floating" | "inline";
}

type Mod = "konu" | "genel" | "ipucu" | "foto";
type TaskType = "copilot_sohbet" | "ipucu" | "konu_anlatimi";

interface Mesaj {
  rol: "kullanici" | "koc";
  metin: string;
  gorsel?: string; // base64 önizleme
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
  foto: [
    "Bu soruyu çöz",
    "Adım adım anlat",
    "Hangi konu bu?",
  ],
};

const MOD_LABEL: Record<Mod, string> = {
  konu: "Konu",
  genel: "Genel",
  ipucu: "İpucu",
  foto: "📷 Foto",
};

const MOD_TASK: Record<Mod, TaskType> = {
  konu: "konu_anlatimi",
  genel: "copilot_sohbet",
  ipucu: "ipucu",
  foto: "copilot_sohbet",
};

export default function KocBaloncugu({ topicId, topicIsim, ders, variant = "inline" }: Props) {
  const [acik, setAcik] = useState(false);
  const [mod, setMod] = useState<Mod>(topicIsim ? "konu" : "genel");
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [girdi, setGirdi] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [takipSorular, setTakipSorular] = useState<string[]>([]);
  const [gorsel, setGorsel] = useState<string | null>(null); // base64
  const mesajSonuRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mesajSonuRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar]);

  useEffect(() => {
    setTakipSorular(STARTER_SUGGESTIONS[mod].slice(0, 3));
    setMesajlar([]);
    if (mod !== "foto") setGorsel(null);
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

    const gorselContext = gorsel ? "\n\n[Öğrenci bir soru görseli gönderdi. Görseli analiz ederek çöz.]" : "";

    return `Sen bir LGS hazırlık koçusun. 8. sınıf öğrencisine yardım ediyorsun.${konuContext}${gorselContext}${gecmis}\n\nÖğrenci: ${metin}\n\nKoç (kısa, net, Türkçe):`;
  }

  function gorselSec(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64 = result.split(",")[1];
      setGorsel(base64);
      setMod("foto");
    };
    reader.readAsDataURL(file);
  }

  async function gonder(metin?: string) {
    const soru = (metin ?? girdi).trim();
    if (!soru || streaming) return;

    setGirdi("");
    setTakipSorular([]);
    setMesajlar((prev) => [...prev, { rol: "kullanici", metin: soru, gorsel: gorsel ? `data:image/jpeg;base64,${gorsel}` : undefined }]);

    const gonderilecekGorsel = gorsel;
    setGorsel(null);

    if (!acik) setAcik(true);

    const token = await getToken();
    if (!token) {
      setMesajlar((prev) => [...prev, { rol: "koc", metin: "Lütfen önce giriş yap." }]);
      return;
    }

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
          ...(gonderilecekGorsel ? { imageBase64: gonderilecekGorsel } : {}),
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={gorselSec}
      />

      {variant === "inline" ? (
        <div
          onClick={() => setAcik(true)}
          className="mx-3 mt-4 mb-2 p-4 cursor-pointer rounded-2xl bg-[var(--ios-blue)] text-white hover:opacity-90 transition-opacity shadow-sm flex flex-col items-center gap-1.5"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="text-center">
            <h4 className="font-bold text-[13px] tracking-tight flex items-center justify-center gap-1">
              AI Koç'a Sor <Sparkles className="w-3 h-3 text-yellow-300" />
            </h4>
            <p className="text-[10px] text-white/70 font-medium">Anında detaylı cevaplar</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAcik((v) => !v)}
          className="fixed bottom-24 right-4 z-[999] w-14 h-14 rounded-full bg-[var(--ios-blue)] text-white shadow-xl shadow-[var(--ios-blue)]/30 hover:scale-105 transition-transform flex items-center justify-center text-2xl"
          title="AI Koç"
        >
          {acik ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        </button>
      )}

      <AnimatePresence>
        {acik && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 md:right-auto md:left-[300px] z-[990] w-[calc(100vw-32px)] sm:w-[380px] bg-background border border-foreground/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl shadow-black/20"
            style={{ maxHeight: "75vh" }}
          >
            {/* Header */}
            <div className="bg-foreground/5 backdrop-blur-3xl px-5 py-4 border-b border-foreground/5 flex items-center justify-between shrink-0 ios-glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--ios-blue)] text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[15px] tracking-tight text-foreground">AI Koç</p>
                  {topicIsim ? (
                    <p className="text-[11px] subheadline font-semibold tracking-widest uppercase">{topicIsim}</p>
                  ) : (
                    <p className="text-[11px] text-[var(--ios-blue)] font-semibold tracking-widest uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--ios-blue)] animate-pulse" /> Çevrimiçi
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setAcik(false)}
                className="w-8 h-8 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mod seçici */}
            <div className="px-4 py-2.5 bg-background flex gap-2 overflow-x-auto no-scrollbar shrink-0 shadow-sm border-b border-foreground/5">
              {(["konu", "genel", "ipucu", "foto"] as Mod[])
                .filter((m) => m !== "konu" || !!topicIsim)
                .map((m) => (
                  <button
                    key={m}
                    onClick={() => m === "foto" ? fileInputRef.current?.click() : setMod(m)}
                    className={`text-[12px] px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
                      mod === m
                        ? "bg-[var(--ios-blue)] text-white"
                        : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
                    }`}
                  >
                    {MOD_LABEL[m]}
                  </button>
                ))}
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-background">
              {mesajlar.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                  <Bot className="w-12 h-12 text-foreground/30 mb-3" />
                  <p className="text-[15px] font-semibold text-foreground">Size nasıl yardımcı olabilirim?</p>
                  {mod === "foto" && (
                    <p className="text-[13px] mt-1 text-[var(--ios-blue)] font-medium">Fotoğraf seçtikten sonra soruyu yaz</p>
                  )}
                </div>
              )}
              {mesajlar.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.rol === "kullanici" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[20px] px-4 py-3 text-[15px] font-medium leading-relaxed tracking-tight ${
                      m.rol === "kullanici"
                        ? "bg-[var(--ios-blue)] text-white rounded-br-[4px]"
                        : "bg-foreground/5 text-foreground rounded-bl-[4px]"
                    }`}
                  >
                    {m.gorsel && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.gorsel} alt="soru" className="rounded-xl mb-3 max-h-48 object-contain border border-foreground/10" />
                    )}
                    {m.metin || (streaming && i === mesajlar.length - 1 ? (
                      <span className="inline-flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </span>
                    ) : "—")}
                  </div>
                </motion.div>
              ))}
              <div ref={mesajSonuRef} />
            </div>

            {/* Takip soruları */}
            {takipSorular.length > 0 && !streaming && (
              <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0 bg-background">
                {takipSorular.map((s) => (
                  <button
                    key={s}
                    onClick={() => gonder(s)}
                    className="text-[12px] bg-foreground/5 text-foreground font-semibold border border-foreground/10 rounded-full px-3 py-1.5 hover:bg-foreground/10 transition-all text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Gorsel önizleme */}
            {gorsel && (
              <div className="px-4 pb-2 bg-background flex items-center gap-3 shrink-0">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/jpeg;base64,${gorsel}`}
                    alt="seçilen"
                    className="h-16 w-16 rounded-xl object-cover border border-[var(--ios-blue)]/50"
                  />
                  <button
                    onClick={() => setGorsel(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full text-white flex items-center justify-center shadow-md"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] subheadline font-bold uppercase tracking-widest">Görsel Eklendi</p>
              </div>
            )}

            {/* Input alanı */}
            <div className="p-4 bg-background border-t border-foreground/5 shrink-0 pb-safe">
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground hover:bg-[var(--ios-blue)]/10 hover:text-[var(--ios-blue)] transition-colors shrink-0"
                  title="Fotoğraf ekle"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={girdi}
                    onChange={(e) => setGirdi(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && gonder()}
                    placeholder={gorsel ? "Görsel hakkında sor..." : "Oğrenmek istediğin şey..."}
                    disabled={streaming}
                    className="w-full bg-foreground/5 text-[15px] font-medium border border-transparent rounded-full pl-5 pr-12 py-3 outline-none focus:border-[var(--ios-blue)]/50 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={() => gonder()}
                    disabled={!girdi.trim() || streaming}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--ios-blue)] text-white rounded-full flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shadow-sm"
                    title="Gönder"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
