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
      <div className="max-w-xl mx-auto px-6 py-12 space-y-6">

        {/* Başlık */}
        <h1 className="text-3xl font-bold tracking-tight mb-8">Profil</h1>

        {/* Bildirim */}
        {bildirim && (
          <div className={`px-4 py-3 rounded-squircle text-sm font-medium flex items-center gap-2 ${
            bildirim.tip === "ok"
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
          }`}>
            {bildirim.tip === "ok" ? "✓" : "✗"} {bildirim.mesaj}
          </div>
        )}

        {isLoading ? (
          /* Skeleton */
          <div className="space-y-4">
            {[80, 64, 64, 96].map((h, i) => (
              <div key={i} className="rounded-squircle bg-foreground/5 animate-pulse" style={{ height: h }} />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Avatar + özet */}
            <div className="ios-card rounded-squircle p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-[var(--ios-blue)]/10 flex items-center justify-center text-[var(--ios-blue)] text-3xl font-bold flex-shrink-0 shadow-sm">
                {(profil?.isim || "Ö")[0].toUpperCase()}
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-2xl font-bold text-foreground tracking-tight">{profil?.isim || "Öğrenci"}</p>
                <p className="text-sm subheadline mt-0.5">{profil?.email || "—"}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3 text-[13px] font-medium">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                    <Flame className="w-4 h-4" /> {profil?.currentStreak ?? 0} gün seri
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 text-foreground/70 rounded-lg">
                    <Clock className="w-4 h-4" /> {lgsGun} gün kaldı
                  </span>
                </div>
              </div>
            </div>

            {/* İsim düzenleme */}
            <div className="ios-card rounded-squircle p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs tracking-widest font-semibold uppercase subheadline">Ad Soyad</p>
                {!isimDuzenle ? (
                  <button
                    onClick={() => { setIsimDuzenle(true); setYeniIsim(profil?.isim || ""); }}
                    className="flex items-center gap-1.5 text-xs text-[var(--ios-blue)] hover:opacity-70 font-semibold transition-opacity"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Düzenle
                  </button>
                ) : (
                  <button onClick={() => setIsimDuzenle(false)} className="text-xs subheadline hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!isimDuzenle ? (
                <p className="text-foreground font-medium text-lg leading-tight">{profil?.isim || <span className="subheadline italic">İsim girilmemiş</span>}</p>
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
                    className="flex-1 bg-background border border-foreground/10 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-[var(--ios-blue)] focus:ring-2 focus:ring-[var(--ios-blue)]/20 transition-all font-medium"
                  />
                  <button
                    onClick={kaydetIsim}
                    disabled={updateMutation.isPending}
                    className="px-5 py-3 bg-[var(--ios-blue)] hover:opacity-90 disabled:opacity-40 rounded-xl text-[15px] font-semibold text-white flex items-center gap-2 transition-opacity"
                  >
                    <Save className="w-4 h-4" /> Kaydet
                  </button>
                </div>
              )}
            </div>

            {/* E-posta (sadece görüntüle) */}
            <div className="ios-card rounded-squircle p-5">
              <p className="text-xs tracking-widest font-semibold uppercase subheadline mb-2">E-posta</p>
              <p className="text-foreground font-medium leading-tight">{profil?.email || "—"}</p>
              <p className="text-[11px] subheadline mt-1.5">Hesap e-postası değiştirilemez</p>
            </div>

            {/* Günlük çalışma süresi */}
            <div className="ios-card rounded-squircle p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs tracking-widest font-semibold uppercase subheadline flex items-center gap-1.5">
                  Günlük Çalışma Hedefi
                </p>
                {!sureDuzenle ? (
                  <button
                    onClick={() => setSureDuzenle(true)}
                    className="flex items-center gap-1.5 text-xs text-[var(--ios-blue)] hover:opacity-70 font-semibold transition-opacity"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Düzenle
                  </button>
                ) : (
                  <button onClick={() => setSureDuzenle(false)} className="text-xs subheadline hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!sureDuzenle ? (
                <p className="text-foreground font-medium text-lg leading-tight">
                  {(profil?.dailyStudyMins ?? 60) >= 60
                    ? `${(profil?.dailyStudyMins ?? 60) / 60} saat`
                    : `${profil?.dailyStudyMins ?? 60} dakika`}
                </p>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="flex gap-2 flex-wrap">
                    {[30, 60, 90, 120, 180].map((dk) => (
                      <button
                        key={dk}
                        onClick={() => setYeniSure(dk)}
                        className={`px-4 py-2.5 rounded-xl text-[15px] font-semibold transition-all ${
                          yeniSure === dk
                            ? "bg-[var(--ios-blue)] text-white shadow-md shadow-[var(--ios-blue)]/20"
                            : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                        }`}
                      >
                        {dk >= 60 ? `${dk / 60} saat` : `${dk} dk`}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => updateMutation.mutate({ dailyStudyMins: yeniSure })}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 w-full justify-center px-4 py-3 bg-[var(--ios-blue)] hover:opacity-90 disabled:opacity-40 rounded-xl text-[15px] font-semibold text-white transition-opacity"
                  >
                    <Save className="w-4 h-4" /> Hedefi Güncelle
                  </button>
                </div>
              )}
            </div>

            {/* Başarılar */}
            <div className="ios-card rounded-squircle p-5">
              <p className="text-xs tracking-widest font-semibold uppercase subheadline mb-4 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> İstatistikler
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Mevcut Seri", deger: profil?.currentStreak ?? 0, bg: "bg-orange-50 dark:bg-orange-900/10", text: "text-orange-600 dark:text-orange-500" },
                  { label: "En Uzun Seri", deger: profil?.longestStreak ?? 0, bg: "bg-violet-50 dark:bg-violet-900/10", text: "text-violet-600 dark:text-violet-500" },
                  { label: "LGS'ye Gün", deger: lgsGun, bg: "bg-emerald-50 dark:bg-emerald-900/10", text: "text-emerald-600 dark:text-emerald-500" },
                ].map(({ label, deger, bg, text }) => (
                  <div key={label} className={`${bg} rounded-2xl p-4 text-center border border-foreground/5 flex flex-col justify-center`}>
                    <p className={`text-2xl font-bold tracking-tight mb-1 ${text}`}>{deger}</p>
                    <p className="text-[10px] subheadline uppercase tracking-widest font-semibold leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Çıkış */}
            <button
              onClick={cikisYap}
              className="w-full py-4 mt-6 rounded-squircle border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[15px] font-semibold"
            >
              Hesaptan Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
