"use client";

import { trpc } from "../../lib/trpc";
import SidebarLayout from "../components/SidebarLayout";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { motion } from "framer-motion";
import { Target, TrendingUp, School, BookOpen, AlertCircle } from "lucide-react";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", DIN: "Din Kültürü", INGILIZCE: "İngilizce",
};
const DERS_HEX: Record<string, string> = {
  MATEMATIK: "#6366f1", FEN: "#10b981", TURKCE: "#ef4444",
  SOSYAL: "#f97316", DIN: "#14b8a6", INGILIZCE: "#8b5cf6",
};

function puanRengi(puan: number) {
  if (puan >= 450) return "text-emerald-400";
  if (puan >= 380) return "text-amber-400";
  if (puan >= 300) return "text-orange-400";
  return "text-rose-400";
}

function puanYorumu(puan: number) {
  if (puan >= 480) return "Çok güçlü — top liselere ulaşabilirsin!";
  if (puan >= 440) return "İyi seviyedesin — biraz daha çalış!";
  if (puan >= 380) return "Ortalama seviye — zayıf konulara odaklan.";
  if (puan >= 300) return "Geliştirme gerekiyor — tutarlı çalışma şart.";
  return "Temel konuları pekiştir — baştan başla.";
}

// SVG Gösterge
function PuanGostergesi({ puan }: { puan: number }) {
  const min = 100, max = 500;
  const oran = (puan - min) / (max - min);
  const angle = -135 + oran * 270; // -135° → +135°

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-52 h-32">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          {/* Arka plan yay */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none" stroke="#ffffff10" strokeWidth="16" strokeLinecap="round"
          />
          {/* Renkli yay */}
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none" stroke="url(#gaugeGrad)"
            strokeWidth="16" strokeLinecap="round"
            strokeDasharray={`${oran * 251.2} 251.2`}
          />
          {/* İbre */}
          <g transform={`translate(100, 100) rotate(${angle})`}>
            <line x1="0" y1="0" x2="0" y2="-68" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="5" fill="white" />
          </g>
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <p className={`text-4xl font-black tabular-nums ${puanRengi(puan)}`}>{puan}</p>
          <p className="text-xs text-white/40 mt-0.5">YEP Tahmini</p>
        </div>
      </div>
    </div>
  );
}

export default function LgsTahmin() {
  const router = useRouter();
  const { data, isLoading } = trpc.learning.getLgsPuanTahmini.useQuery();

  async function cikisYap() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const DERS_SIRA = ["TURKCE", "MATEMATIK", "FEN", "SOSYAL", "DIN", "INGILIZCE"];

  return (
    <SidebarLayout onLogout={cikisYap}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Başlık */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">LGS Puan Tahmini</h1>
            <p className="text-sm text-white/50">Mastery skorlarına göre YEP tahmini</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-white/40">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Tahmin için yeterli veri yok.</p>
            <p className="text-xs mt-1">Önce biraz soru çöz!</p>
          </div>
        ) : (
          <>
            {/* Gösterge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center space-y-2"
            >
              <PuanGostergesi puan={data.yepPuan} />
              <p className="text-sm text-white/60 mt-2">{puanYorumu(data.yepPuan)}</p>
              <div className="flex justify-center gap-4 pt-2 text-sm">
                <span className="text-white/50">Tahmini doğru: <span className="text-white font-semibold">{data.toplamTahminiDogru}</span>/{data.toplamSoru}</span>
              </div>
            </motion.div>

            {/* Ders kırılımı */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Ders Bazında Tahmin
              </h2>
              <div className="space-y-3">
                {DERS_SIRA.map((ders) => {
                  const d = data.dersDetay[ders];
                  if (!d) return null;
                  const renk = DERS_HEX[ders];
                  const oran = (d.tahminiDogru / d.soruSayisi) * 100;
                  return (
                    <div key={ders}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white/70">{DERS_ISIM[ders]}</span>
                        <span className="text-xs text-white/50">
                          ~{d.tahminiDogru}/{d.soruSayisi} doğru
                          <span className="ml-2 text-white/30">(%{d.mastery} hakimiyet)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${oran}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: renk }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Eşleşen okullar */}
            {data.eslesenOkullar.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                  <School className="w-4 h-4" /> Ulaşabileceğin Okullar
                </h2>
                <div className="space-y-2">
                  {data.eslesenOkullar.map((okul) => (
                    <div key={okul.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm text-white font-medium">{okul.isim}</p>
                        <p className="text-xs text-white/40">{okul.sehir} · {okul.tur}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">{okul.minPuan}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {data.eslesenOkullar.length === 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300/80 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Sistemde kayıtlı okul yok. Admin panelinden okul eklenince burada görünür.</span>
              </div>
            )}

            {/* Uyarı */}
            <p className="text-center text-xs text-white/25 pb-2">
              Bu tahmin, mastery skorlarına dayalı bir hesaplamadır. Gerçek sınav puanı farklı olabilir.
            </p>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
