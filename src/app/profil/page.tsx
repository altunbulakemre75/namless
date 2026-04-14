"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../lib/trpc";
import SidebarLayout from "../components/SidebarLayout";
import { createClient } from "../../lib/supabase/client";
import { Flame, Clock, Pencil, Save, X, Trophy } from "lucide-react";

export default function ProfilPage() {
  const router = useRouter();
  const [isimDuzenle, setIsimDuzenle] = useState(false);
  const [yeniIsim, setYeniIsim] = useState("");
  const [sureDuzenle, setSureDuzenle] = useState(false);
  const [yeniSure, setYeniSure] = useState(60);
  const [bildirim, setBildirim] = useState<{ tip: "ok" | "hata"; mesaj: string } | null>(null);

  const { data: profil, isLoading, refetch } = trpc.learning.getProfile.useQuery();

  const updateMutation = trpc.learning.updateProfile.useMutation({
    onSuccess: () => {
      setBildirim({ tip: "ok", mesaj: "Kaydedildi!" });
      setIsimDuzenle(false);
      setSureDuzenle(false);
      refetch();
      setTimeout(() => setBildirim(null), 3000);
    },
    onError: (e) => {
      setBildirim({ tip: "hata", mesaj: e.message });
      setTimeout(() => setBildirim(null), 3000);
    },
  });

  useEffect(() => {
    if (profil) {
      setYeniIsim(profil.isim || "");
      setYeniSure(profil.dailyStudyMins ?? 60);
    }
  }, [profil]);

  async function cikisYap() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function kaydetIsim() {
    if (yeniIsim.trim().length < 2) {
      setBildirim({ tip: "hata", mesaj: "İsim en az 2 karakter olmalı" });
      setTimeout(() => setBildirim(null), 3000);
      return;
    }
    updateMutation.mutate({ isim: yeniIsim.trim() });
  }

  const lgsGun = Math.max(0, Math.ceil((new Date("2026-06-07").getTime() - Date.now()) / 86400000));

  return (
    <SidebarLayout userName={profil?.isim || "Öğrenci"} onLogout={cikisYap}>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">

        {/* Başlık */}
        <h1 className="text-2xl font-black text-white">Profilim</h1>

        {/* Bildirim */}
        {bildirim && (
          <div className={`px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 ${
            bildirim.tip === "ok"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
          }`}>
            {bildirim.tip === "ok" ? "✓" : "✗"} {bildirim.mesaj}
          </div>
        )}

        {isLoading ? (
          /* Skeleton */
          <div className="space-y-3">
            {[80, 64, 64, 96].map((h, i) => (
              <div key={i} className="rounded-2xl bg-white/5 animate-pulse" style={{ height: h }} />
            ))}
          </div>
        ) : (
          <>
            {/* Avatar + özet */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                {(profil?.isim || "Ö")[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-white">{profil?.isim || "Öğrenci"}</p>
                <p className="text-sm text-white/50">{profil?.email || "—"}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Flame className="w-3.5 h-3.5" /> {profil?.currentStreak ?? 0} gün seri
                  </span>
                  <span className="text-white/40">{lgsGun} gün kaldı</span>
                </div>
              </div>
            </div>

            {/* İsim düzenleme */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white/60">Ad Soyad</p>
                {!isimDuzenle ? (
                  <button
                    onClick={() => { setIsimDuzenle(true); setYeniIsim(profil?.isim || ""); }}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                  >
                    <Pencil className="w-3 h-3" /> Düzenle
                  </button>
                ) : (
                  <button onClick={() => setIsimDuzenle(false)} className="text-xs text-white/30 hover:text-white/60">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!isimDuzenle ? (
                <p className="text-white font-medium text-lg">{profil?.isim || <span className="text-white/30 italic">İsim girilmemiş</span>}</p>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={yeniIsim}
                    onChange={(e) => setYeniIsim(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && kaydetIsim()}
                    maxLength={50}
                    placeholder="Adın Soyadın"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={kaydetIsim}
                    disabled={updateMutation.isPending}
                    className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-sm font-medium text-white flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Kaydet
                  </button>
                </div>
              )}
            </div>

            {/* E-posta (sadece görüntüle) */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white/60 mb-2">E-posta</p>
              <p className="text-white font-medium">{profil?.email || "—"}</p>
              <p className="text-xs text-white/25 mt-1">Supabase Auth üzerinden değiştirilemez</p>
            </div>

            {/* Günlük çalışma süresi */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white/60 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Günlük Çalışma
                </p>
                {!sureDuzenle ? (
                  <button
                    onClick={() => setSureDuzenle(true)}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                  >
                    <Pencil className="w-3 h-3" /> Düzenle
                  </button>
                ) : (
                  <button onClick={() => setSureDuzenle(false)} className="text-xs text-white/30 hover:text-white/60">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!sureDuzenle ? (
                <p className="text-white font-medium text-lg">
                  {(profil?.dailyStudyMins ?? 60) >= 60
                    ? `${(profil?.dailyStudyMins ?? 60) / 60} saat`
                    : `${profil?.dailyStudyMins ?? 60} dakika`}
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
                        {dk >= 60 ? `${dk / 60}s` : `${dk}dk`}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => updateMutation.mutate({ dailyStudyMins: yeniSure })}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-sm font-medium text-white"
                  >
                    <Save className="w-3.5 h-3.5" /> Kaydet
                  </button>
                </div>
              )}
            </div>

            {/* Başarılar */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> İstatistikler
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Mevcut Seri", deger: profil?.currentStreak ?? 0, renk: "text-amber-400" },
                  { label: "En Uzun Seri", deger: profil?.longestStreak ?? 0, renk: "text-violet-400" },
                  { label: "LGS'ye Gün", deger: lgsGun, renk: "text-emerald-400" },
                ].map(({ label, deger, renk }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-black ${renk}`}>{deger}</p>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Çıkış */}
            <button
              onClick={cikisYap}
              className="w-full py-3 rounded-2xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-medium"
            >
              Çıkış Yap
            </button>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
