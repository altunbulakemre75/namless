"use client";

import { useState } from "react";
import { trpc } from "../../lib/trpc";
import SidebarLayout from "../components/SidebarLayout";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { BookX, ChevronDown, ChevronUp } from "lucide-react";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", DIN: "Din Kültürü", INGILIZCE: "İngilizce",
};

const DERS_HEX: Record<string, string> = {
  MATEMATIK: "#6366f1", FEN: "#10b981", TURKCE: "#ef4444",
  SOSYAL: "#f97316", DIN: "#14b8a6", INGILIZCE: "#8b5cf6",
};

const ZORLUK_LABEL = ["", "Kolay", "Orta", "Zor"];
const ZORLUK_COLOR = ["", "text-emerald-500", "text-amber-500", "text-rose-500"];

const SIKLAR = ["A", "B", "C", "D"];

export default function HataDefteri() {
  const router = useRouter();
  const [secilenDers, setSecilenDers] = useState<string | undefined>();
  const [acikSoru, setAcikSoru] = useState<string | null>(null);

  const { data: hatalar, isLoading } = trpc.assessment.getHataDefteri.useQuery(
    { ders: secilenDers }
  );

  async function cikisYap() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <SidebarLayout onLogout={cikisYap}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Başlık */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-squircle bg-rose-500/10 flex items-center justify-center shrink-0">
            <BookX className="w-7 h-7 text-rose-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-0.5">Hata Defteri</h1>
            <p className="subheadline">Yanlış cevapladığın soruları incele</p>
          </div>
        </div>

        {/* Ders filtresi */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setSecilenDers(undefined)}
            className={`px-4 py-2 rounded-full text-[13px] font-bold tracking-tight transition-all border ${
              !secilenDers
                ? "bg-foreground text-background border-foreground"
                : "bg-foreground/5 text-foreground/60 border-foreground/10 hover:border-foreground/20 hover:text-foreground hover:bg-foreground/10"
            }`}
          >
            Tümü {hatalar && <span className="opacity-70 ml-0.5">({hatalar.length})</span>}
          </button>
          {Object.keys(DERS_ISIM).map((ders) => {
            const sayi = hatalar?.filter((h) => h.question.ders === ders).length ?? 0;
            if (sayi === 0 && !hatalar?.length && !isLoading) return null; // Eğer hiç yoksa salla, ama yükleniyorsa gösteremeyiz
            if (sayi === 0 && !isLoading) return null;
            return (
              <button
                key={ders}
                onClick={() => setSecilenDers(ders === secilenDers ? undefined : ders)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold tracking-tight transition-all border ${
                  secilenDers === ders
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-foreground/5 text-foreground/60 border-foreground/10 hover:border-foreground/20 hover:text-foreground hover:bg-foreground/10"
                }`}
              >
                {DERS_ISIM[ders]} <span className="opacity-70 ml-0.5">({sayi})</span>
              </button>
            );
          })}
        </div>

        {/* İçerik */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-squircle ios-card animate-pulse" />
            ))}
          </div>
        ) : !hatalar || hatalar.length === 0 ? (
          <div className="text-center py-20 ios-card rounded-squircle border border-dashed border-foreground/10">
            <BookX className="w-12 h-12 mx-auto mb-4 text-foreground/20" />
            <p className="text-[17px] font-semibold text-foreground tracking-tight">Henüz hatalı sorun yok.</p>
            <p className="text-[13px] subheadline mt-1">Harika gidiyorsun! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hatalar.map((h, i) => {
              const renk = DERS_HEX[h.question.ders] ?? "#6366f1";
              const acik = acikSoru === h.attemptId;
              return (
                <motion.div
                  key={h.attemptId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-squircle ios-card overflow-hidden"
                >
                  {/* Soru başlığı */}
                  <button
                    onClick={() => setAcikSoru(acik ? null : h.attemptId)}
                    className="w-full text-left p-5 flex items-start gap-4 transition-colors hover:bg-foreground/[0.02]"
                  >
                    <div
                      className="w-1.5 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: renk }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                          style={{ backgroundColor: renk + "15", color: renk }}
                        >
                          {DERS_ISIM[h.question.ders]}
                        </span>
                        <span className={`text-[12px] font-bold ${ZORLUK_COLOR[h.question.zorluk]}`}>
                          {ZORLUK_LABEL[h.question.zorluk]} Seviye
                        </span>
                        <span className="text-[11px] subheadline font-semibold mx-2 opacity-50">&middot;</span>
                        <span className="text-[12px] subheadline font-medium truncate max-w-[150px]">
                          {h.question.konuIsim}
                        </span>
                      </div>
                      <p className="text-[15px] font-medium text-foreground line-clamp-2 md:line-clamp-3 leading-relaxed tracking-tight">
                        {h.question.soruMetni}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-foreground/30 mt-2 bg-foreground/5 p-1.5 rounded-full">
                      {acik ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {/* Açıklama */}
                  <AnimatePresence>
                    {acik && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden bg-foreground/[0.02]"
                      >
                        <div className="px-5 pb-5 space-y-4 border-t border-foreground/5 pt-4">
                          {/* Şıklar */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {h.question.siklar.map((sik, idx) => {
                              const dogru = idx === h.question.dogruSik;
                              const benim = idx === h.secilenSik;
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors border ${
                                    dogru
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                      : benim
                                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                      : "bg-background text-foreground/60 border-foreground/5"
                                  }`}
                                >
                                  <span className={`font-bold w-5 ${dogru ? "text-emerald-600 dark:text-emerald-400" : benim ? "text-rose-600 dark:text-rose-400" : "text-foreground/40"}`}>
                                    {SIKLAR[idx]})
                                  </span>
                                  <span className="leading-snug flex-1">{sik}</span>
                                  {dogru && <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 flex-shrink-0 shrink-0 ml-2">✓ DOĞRU</span>}
                                  {benim && !dogru && <span className="text-[11px] font-bold uppercase tracking-widest text-rose-600 flex-shrink-0 shrink-0 ml-2">✗ SENİN CEVABIN</span>}
                                </div>
                              );
                            })}
                          </div>

                          {/* Açıklama */}
                          <div className="bg-[var(--ios-blue)]/5 border border-[var(--ios-blue)]/10 rounded-2xl p-5 text-[15px] text-foreground leading-relaxed mt-2">
                            <span className="text-[11px] text-[var(--ios-blue)] font-bold uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                              Çözüm Açıklaması
                            </span>
                            {h.question.aciklama}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
