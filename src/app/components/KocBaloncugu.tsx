"use client";

import { useState, useRef, useEffect } from "react";
import { processStream } from "@/infrastructure/ai/streaming";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, X, Camera, ImageIcon } from "lucide-react";

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
  foto: "📷 Fotoğraf",
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
      // data:image/jpeg;base64,XXX → sadece XXX kısmını al
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
      {/* Gizli file input */}
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
          className="mx-4 my-2 relative overflow-hidden group glass-panel rounded-2xl p-4 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/20 transition-all border-2 border-violet-500/50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 pointer-events-none" />
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-violet-500/20 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 text-white shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight mb-0.5 flex flex-wrap items-center gap-1">
                AI Koç'a Sor <Sparkles className="w-3 h-3 text-yellow-500" />
              </h4>
              <p className="text-[10px] text-foreground/60 leading-snug">Yardıma mı ihtiyacın var?</p>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAcik((v) => !v)}
          className="fixed bottom-24 right-4 z-[999] w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition-all flex items-center justify-center text-2xl"
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
            className="fixed bottom-24 right-4 md:right-auto md:left-[300px] z-[999] w-[calc(100vw-32px)] sm:w-[360px] shadow-2xl bg-white dark:bg-[#0f0f13] border border-violet-500/20 rounded-3xl flex flex-col overflow-hidden"
            style={{ maxHeight: "75vh" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">AI Koç</p>
                  {topicIsim ? (
                    <p className="text-[10px] text-white/80 uppercase tracking-widest">{topicIsim}</p>
                  ) : (
                    <p className="text-[10px] text-white/80 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Çevrimiçi
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setAcik(false)}
                className="relative z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mod seçici */}
            <div className="px-4 py-2 bg-foreground/5 border-b border-foreground/10 flex gap-2 overflow-x-auto no-scrollbar">
              {(["konu", "genel", "ipucu", "foto"] as Mod[])
                .filter((m) => m !== "konu" || !!topicIsim)
                .map((m) => (
                  <button
                    key={m}
                    onClick={() => m === "foto" ? fileInputRef.current?.click() : setMod(m)}
                    className={`text-[11px] px-3 py-1.5 rounded-full font-semibold transition-colors whitespace-nowrap ${
                      mod === m
                        ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                        : "bg-background text-foreground/60 border border-foreground/10 hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    {MOD_LABEL[m]}
                  </button>
                ))}
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/50">
              {mesajlar.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <Bot className="w-12 h-12 text-violet-500 mb-3 opacity-50" />
                  <p className="text-sm font-medium">Sormak istediğin bir şey var mı?</p>
                  {mod === "foto" && (
                    <p className="text-xs mt-1 text-violet-400">📷 Fotoğraf seçtikten sonra soruyu yaz</p>
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
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      m.rol === "kullanici"
                        ? "bg-violet-600 text-white rounded-br-none"
                        : "bg-foreground/5 border border-foreground/10 text-foreground rounded-bl-none"
                    }`}
                  >
                    {m.gorsel && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.gorsel} alt="soru" className="rounded-lg mb-2 max-h-40 object-contain" />
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
              <div className="px-5 pb-3 flex flex-wrap gap-2 bg-background">
                {takipSorular.map((s) => (
                  <button
                    key={s}
                    onClick={() => gonder(s)}
                    className="text-[11px] bg-foreground/5 text-foreground/80 font-medium border border-foreground/10 rounded-full px-3 py-1.5 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 dark:hover:bg-violet-500/20 dark:hover:text-violet-300 dark:hover:border-violet-500/30 transition-all text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Gorsel önizleme */}
            {gorsel && (
              <div className="px-4 pb-1 bg-background flex items-center gap-2">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/jpeg;base64,${gorsel}`}
                    alt="seçilen"
                    className="h-14 rounded-lg object-cover border border-violet-500/30"
                  />
                  <button
                    onClick={() => setGorsel(null)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full text-white flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
                <p className="text-xs text-white/40">Fotoğraf eklendi</p>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-foreground/10 bg-background/80 backdrop-blur pb-safe">
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground/50 hover:text-violet-500 hover:border-violet-500/30 transition-colors flex-shrink-0"
                  title="Fotoğraf ekle"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={girdi}
                    onChange={(e) => setGirdi(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && gonder()}
                    placeholder={gorsel ? "Soruyu yaz..." : "Bir şey sor..."}
                    disabled={streaming}
                    className="w-full bg-foreground/5 text-sm border border-foreground/10 rounded-full pl-5 pr-12 py-3 outline-none focus:border-violet-500 focus:bg-background transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={() => gonder()}
                    disabled={!girdi.trim() || streaming}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-violet-700 transition-colors shadow-sm"
                    title="Gönder"
                  >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
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
