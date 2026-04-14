"use client";

import { useState } from "react";
import { trpc } from "../../lib/trpc";
import SidebarLayout from "../components/SidebarLayout";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { motion } from "framer-motion";
import { Users, UserPlus, Flame, CheckCircle2, BarChart2, CalendarDays } from "lucide-react";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Mat", FEN: "Fen", TURKCE: "Türkçe",
  SOSYAL: "Sosyal", DIN: "Din", INGILIZCE: "İng",
};
const DERS_HEX: Record<string, string> = {
  MATEMATIK: "#6366f1", FEN: "#10b981", TURKCE: "#ef4444",
  SOSYAL: "#f97316", DIN: "#14b8a6", INGILIZCE: "#8b5cf6",
};

function gunFarki(tarih: Date | null): string {
  if (!tarih) return "Hiç çalışmadı";
  const fark = Math.floor((Date.now() - new Date(tarih).getTime()) / 86400000);
  if (fark === 0) return "Bugün çalıştı";
  if (fark === 1) return "Dün çalıştı";
  return `${fark} gün önce`;
}

export default function VeliPaneli() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [bildirim, setBildirim] = useState<string | null>(null);

  const { data: cocuklar, isLoading, refetch } = trpc.learning.getVeliDashboard.useQuery();
  const veliBagla = trpc.learning.veliBagla.useMutation({
    onSuccess: (d) => {
      setBildirim(`${d.cocukIsim} başarıyla bağlandı!`);
      setEmail("");
      refetch();
      setTimeout(() => setBildirim(null), 4000);
    },
    onError: (e) => {
      setBildirim(`Hata: ${e.message}`);
      setTimeout(() => setBildirim(null), 4000);
    },
  });

  async function cikisYap() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <SidebarLayout onLogout={cikisYap}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Başlık */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Veli Paneli</h1>
            <p className="text-sm text-white/50">Çocuğunuzun ilerlemesini takip edin</p>
          </div>
        </div>

        {/* Öğrenci bağla */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Öğrenci Ekle
          </h2>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Öğrencinin e-posta adresi"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
            />
            <button
              onClick={() => email && veliBagla.mutate({ cocukEmail: email })}
              disabled={!email || veliBagla.isPending}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-sm font-medium text-white transition-colors"
            >
              {veliBagla.isPending ? "Bağlanıyor..." : "Bağla"}
            </button>
          </div>
          {bildirim && (
            <p className={`mt-2 text-xs ${bildirim.startsWith("Hata") ? "text-rose-400" : "text-emerald-400"}`}>
              {bildirim}
            </p>
          )}
        </div>

        {/* Çocuklar listesi */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : !cocuklar || cocuklar.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Henüz bağlı öğrenci yok.</p>
            <p className="text-xs mt-1">Yukarıdan öğrencinin e-postasını girerek bağlayın.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cocuklar.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4"
              >
                {/* Üst satır */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{c.isim}</p>
                    <p className="text-xs text-white/40">{c.email}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Flame className="w-4 h-4" />
                      {c.currentStreak} gün
                    </span>
                    <span className="flex items-center gap-1 text-white/40 text-xs">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {gunFarki(c.lastStudyDate)}
                    </span>
                  </div>
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-white/40 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Başarı Oranı
                    </p>
                    <p className="text-2xl font-bold text-white">{c.basariYuzdesi}%</p>
                    <p className="text-xs text-white/30">{c.toplamAttempt} soru çözüldü</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-white/40 mb-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> En Uzun Seri
                    </p>
                    <p className="text-2xl font-bold text-white">{c.longestStreak}</p>
                    <p className="text-xs text-white/30">gün</p>
                  </div>
                </div>

                {/* Ders mastery barları */}
                <div>
                  <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
                    <BarChart2 className="w-3.5 h-3.5" /> Ders Hakimiyeti
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(DERS_ISIM).map(([ders, isim]) => {
                      const skor = c.dersMastery[ders] ?? 0;
                      const renk = DERS_HEX[ders];
                      return (
                        <div key={ders} className="flex items-center gap-2">
                          <span className="text-xs text-white/50 w-14">{isim}</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${skor}%`, backgroundColor: renk }}
                            />
                          </div>
                          <span className="text-xs text-white/50 w-8 text-right">{Math.round(skor)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
