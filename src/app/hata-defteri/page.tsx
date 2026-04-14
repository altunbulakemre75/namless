"use client";

import { useState } from "react";
import { trpc } from "../../lib/trpc";
import SidebarLayout from "../components/SidebarLayout";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { BookX, ChevronDown, ChevronUp, Filter } from "lucide-react";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", DIN: "Din Kültürü", INGILIZCE: "İngilizce",
};

const DERS_HEX: Record<string, string> = {
  MATEMATIK: "#6366f1", FEN: "#10b981", TURKCE: "#ef4444",
  SOSYAL: "#f97316", DIN: "#14b8a6", INGILIZCE: "#8b5cf6",
};

const ZORLUK_LABEL = ["", "Kolay", "Orta", "Zor"];
const ZORLUK_COLOR = ["", "text-emerald-400", "text-amber-400", "text-rose-400"];

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

  const gruplanmis = hatalar?.reduce<Record<string, typeof hatalar>>((acc, h) => {
    const ders = h.question.ders;
    if (!acc[ders]) acc[ders] = [];
    acc[ders].push(h);
    return acc;
  }, {}) ?? {};

  return (
    <SidebarLayout onLogout={cikisYap}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Başlık */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center">
            <BookX className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Hata Defteri</h1>
            <p className="text-sm text-white/50">Yanlış cevapladığın sorular</p>
          </div>
        </div>

        {/* Ders filtresi */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setSecilenDers(undefined)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              !secilenDers
                ? "bg-white/20 text-white border-white/30"
                : "bg-white/5 text-white/50 border-white/10 hover:border-white/20"
            }`}
          >
            Tümü {hatalar && `(${hatalar.length})`}
          </button>
          {Object.keys(DERS_ISIM).map((ders) => {
            const sayi = hatalar?.filter((h) => h.question.ders === ders).length ?? 0;
            if (sayi === 0) return null;
            return (
              <button
                key={ders}
                onClick={() => setSecilenDers(ders === secilenDers ? undefined : ders)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  secilenDers === ders
                    ? "bg-white/20 text-white border-white/30"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/20"
                }`}
              >
                {DERS_ISIM[ders]} ({sayi})
              </button>
            );
          })}
        </div>

        {/* İçerik */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !hatalar || hatalar.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <BookX className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Henüz hatalı sorun yok — aferin!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hatalar.map((h, i) => {
              const renk = DERS_HEX[h.question.ders] ?? "#6366f1";
              const acik = acikSoru === h.attemptId;
              return (
                <motion.div
                  key={h.attemptId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                >
                  {/* Soru başlığı */}
                  <button
                    onClick={() => setAcikSoru(acik ? null : h.attemptId)}
                    className="w-full text-left p-4 flex items-start gap-3"
                  >
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: renk }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: renk + "22", color: renk }}
                        >
                          {DERS_ISIM[h.question.ders]}
                        </span>
                        <span className={`text-xs ${ZORLUK_COLOR[h.question.zorluk]}`}>
                          {ZORLUK_LABEL[h.question.zorluk]}
                        </span>
                        <span className="text-xs text-white/30 ml-auto">
                          {h.question.konuIsim}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 line-clamp-2 leading-relaxed">
                        {h.question.soruMetni}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-white/30 mt-1">
                      {acik ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Açıklama */}
                  <AnimatePresence>
                    {acik && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                          {/* Şıklar */}
                          <div className="grid grid-cols-1 gap-1.5">
                            {h.question.siklar.map((sik, idx) => {
                              const dogru = idx === h.question.dogruSik;
                              const benim = idx === h.secilenSik;
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                                    dogru
                                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                      : benim
                                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                      : "text-white/40"
                                  }`}
                                >
                                  <span className="font-bold w-5">{SIKLAR[idx]})</span>
                                  <span>{sik}</span>
                                  {dogru && <span className="ml-auto text-xs">✓ Doğru</span>}
                                  {benim && !dogru && <span className="ml-auto text-xs">✗ Senin cevabın</span>}
                                </div>
                              );
                            })}
                          </div>

                          {/* Açıklama */}
                          <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70 leading-relaxed">
                            <span className="text-white/40 text-xs font-medium block mb-1">Açıklama</span>
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
