"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../lib/trpc";
import SidebarLayout from "../components/SidebarLayout";
import { createClient } from "../../lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Flame, Clock, CheckCircle2, Pencil, Save, X, Trophy, CalendarDays,
} from "lucide-react";

export default function ProfilPage() {
  const router = useRouter();
  const [isimDuzenle, setIsimDuzenle] = useState(false);
  const [yeniIsim, setYeniIsim] = useState("");
  const [sureDuzenle, setSureDuzenle] = useState(false);
  const [yeniSure, setYeniSure] = useState(60);
  const [basariMesaj, setBasariMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const { data: profil, refetch } = trpc.learning.getProfile.useQuery();
  const updateMutation = trpc.learning.updateProfile.useMutation({
    onSuccess: () => {
      setBasariMesaj("Profil güncellendi!");
      setIsimDuzenle(false);
      setSureDuzenle(false);
      refetch();
      setTimeout(() => setBasariMesaj(null), 3000);
    },
    onError: (e) => {
      setHata(e.message);
      setTimeout(() => setHata(null), 3000);
    },
  });

  useEffect(() => {
    if (profil) {
      setYeniIsim(profil.isim ?? "");
      setYeniSure(profil.dailyStudyMins ?? 60);
    }
  }, [profil]);

  async function cikisYap() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function kaydetIsim() {
    if (!yeniIsim.trim() || yeniIsim.trim().length < 2) {
      setHata("İsim en az 2 karakter olmalı");
      setTimeout(() => setHata(null), 3000);
      return;
    }
    updateMutation.mutate({ isim: yeniIsim.trim() });
  }

  function kaydetSure() {
    updateMutation.mutate({ dailyStudyMins: yeniSure });
  }

  const lgsGunu = Math.max(0, Math.ceil((new Date("2026-06-07").getTime() - Date.now()) / 86400000));

  return (
    <SidebarLayout onLogout={cikisYap}>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-5">
        {/* Başlık */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Profilim</h1>
            <p className="text-sm text-white/50">Bilgilerini görüntüle ve düzenle</p>
          </div>
        </div>

        {/* Bildirimler */}
        <AnimatePresence>
          {basariMesaj && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl px-4 py-3 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {basariMesaj}
            </motion.div>
          )}
          {hata && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-2xl px-4 py-3 text-sm"
            >
              <X className="w-4 h-4 flex-shrink-0" /> {hata}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar + özet istatistikler */}
        {profil && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
              {(profil.isim ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white truncate">{profil.isim}</p>
              <p className="text-sm text-white/40 truncate">{profil.email}</p>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="flex items-center gap-1 text-amber-400">
                  <Flame className="w-3.5 h-3.5" /> {profil.currentStreak} gün seri
                </span>
                <span className="flex items-center gap-1 text-white/40">
                  <CalendarDays className="w-3.5 h-3.5" /> {lgsGunu} gün kaldı
                </span>
              </div>
            </div>
          </div>
        )}

        {/* İsim düzenleme */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-white/40" />
              <span className="text-sm font-semibold text-white/60">Adın</span>
            </div>
            {!isimDuzenle ? (
              <button
                onClick={() => setIsimDuzenle(true)}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Pencil className="w-3 h-3" /> Düzenle
              </button>
            ) : (
              <button
                onClick={() => { setIsimDuzenle(false); setYeniIsim(profil?.isim ?? ""); }}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                İptal
              </button>
            )}
          </div>

          {!isimDuzenle ? (
            <p className="text-white font-medium">{profil?.isim ?? "—"}</p>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={yeniIsim}
                onChange={(e) => setYeniIsim(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && kaydetIsim()}
                maxLength={50}
                autoFocus
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
              <button
                onClick={kaydetIsim}
                disabled={updateMutation.isPending}
                className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-sm font-medium text-white transition-colors flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                Kaydet
              </button>
            </div>
          )}
        </div>

        {/* E-posta (sadece görüntüle) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-white/40" />
            <span className="text-sm font-semibold text-white/60">E-posta</span>
          </div>
          <p className="text-white/70 text-sm">{profil?.email ?? "—"}</p>
          <p className="text-xs text-white/30 mt-1">E-posta değiştirilemez (Supabase Auth)</p>
        </div>

        {/* Günlük çalışma süresi */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" />
              <span className="text-sm font-semibold text-white/60">Günlük Çalışma Süresi</span>
            </div>
            {!sureDuzenle ? (
              <button
                onClick={() => setSureDuzenle(true)}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Pencil className="w-3 h-3" /> Düzenle
              </button>
            ) : (
              <button
                onClick={() => { setSureDuzenle(false); setYeniSure(profil?.dailyStudyMins ?? 60); }}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                İptal
              </button>
            )}
          </div>

          {!sureDuzenle ? (
            <p className="text-white font-medium">
              {profil?.dailyStudyMins
                ? profil.dailyStudyMins >= 60
                  ? `${profil.dailyStudyMins / 60} saat`
                  : `${profil.dailyStudyMins} dakika`
                : "—"}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {[30, 60, 90, 120, 180].map((dk) => (
                  <button
                    key={dk}
                    onClick={() => setYeniSure(dk)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      yeniSure === dk
                        ? "bg-violet-600 text-white"
                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {dk >= 60 ? `${dk / 60} saat` : `${dk} dk`}
                  </button>
                ))}
              </div>
              <button
                onClick={kaydetSure}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-sm font-medium text-white transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Kaydet
              </button>
            </div>
          )}
        </div>

        {/* Başarılar özeti */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-white/40" />
            <span className="text-sm font-semibold text-white/60">İstatistikler</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-400">{profil?.currentStreak ?? 0}</p>
              <p className="text-xs text-white/40 mt-0.5">Mevcut seri</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-violet-400">{profil?.longestStreak ?? 0}</p>
              <p className="text-xs text-white/40 mt-0.5">En uzun seri</p>
            </div>
          </div>
        </div>

        {/* Çıkış */}
        <button
          onClick={cikisYap}
          className="w-full py-3 rounded-2xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-medium"
        >
          Çıkış Yap
        </button>
      </div>
    </SidebarLayout>
  );
}
