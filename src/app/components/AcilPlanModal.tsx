"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Clock, CheckCircle2 } from "lucide-react";
import { trpc } from "../../lib/trpc";

interface Props {
  kalanGun: number;
  onerilDakika: number;
  mevcutDakika: number;
  onClose: () => void;
}

export default function AcilPlanModal({ kalanGun, onerilDakika, mevcutDakika, onClose }: Props) {
  const router = useRouter();
  const [seciliDakika, setSeciliDakika] = useState(
    Math.min(300, Math.max(30, onerilDakika))
  );
  const [basarili, setBasarili] = useState(false);

  const regenerate = trpc.learning.regeneratePlan.useMutation({
    onSuccess: () => {
      setBasarili(true);
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1500);
    },
  });

  const handleSubmit = () => {
    regenerate.mutate({ gunlukDakika: seciliDakika });
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative ios-card rounded-squircle-lg p-6 md:p-8 w-full max-w-md shadow-2xl"
        >
          {/* Kapat */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-foreground/60" />
          </button>

          {basarili ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold">Plan Hazır!</h3>
              <p className="text-sm text-foreground/60">
                Günde {seciliDakika} dk'lık LGS planın oluşturuldu.
              </p>
            </div>
          ) : (
            <>
              {/* Başlık */}
              <div className="flex items-start gap-3 mb-6">
                <div className="w-12 h-12 rounded-squircle bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Acil Plan Oluştur</h3>
                  <p className="text-sm text-foreground/60 mt-0.5">
                    LGS'ye <span className="font-semibold text-foreground">{kalanGun} gün</span> kaldı
                  </p>
                </div>
              </div>

              {/* Bilgi */}
              <div className="bg-orange-500/5 border border-orange-500/15 rounded-squircle p-4 mb-6">
                <p className="text-sm text-foreground/80">
                  Hedef okuluna yetişmek için önerilen günlük çalışma süresi:
                </p>
                <p className="text-2xl font-bold text-orange-500 mt-1">
                  {onerilDakika} dk/gün
                  {mevcutDakika > 0 && mevcutDakika !== onerilDakika && (
                    <span className="text-sm font-medium text-foreground/50 ml-2">
                      (şu an: {mevcutDakika} dk)
                    </span>
                  )}
                </p>
              </div>

              {/* Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-foreground/50" />
                    Günlük süre
                  </label>
                  <span className="text-lg font-bold text-[var(--ios-blue)]">
                    {seciliDakika} dk
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={300}
                  step={15}
                  value={seciliDakika}
                  onChange={(e) => setSeciliDakika(Number(e.target.value))}
                  className="w-full accent-[var(--ios-blue)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-foreground/40 font-semibold mt-1">
                  <span>30 dk</span>
                  <span>2.5 sa</span>
                  <span>5 sa</span>
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-squircle text-sm font-semibold bg-foreground/5 hover:bg-foreground/10 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={regenerate.isPending}
                  className="flex-1 px-4 py-3 rounded-squircle text-sm font-bold bg-[var(--ios-blue)] text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                >
                  {regenerate.isPending ? "Oluşturuluyor..." : "Planı Oluştur"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
