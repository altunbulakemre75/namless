"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../lib/trpc";
import SidebarLayout from "../components/SidebarLayout";
import { createClient } from "../../lib/supabase/client";
import { School, Search, CheckCircle2, Pencil, Clock } from "lucide-react";

export default function HedefOkulPage() {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [secilenId, setSecilenId] = useState<string | null>(null);
  const [gunlukSure, setGunlukSure] = useState(60);
  const [degistiriyorum, setDegistiriyorum] = useState(false);
  const [bildirim, setBildirim] = useState<string | null>(null);

  const { data: profil, isLoading: profilYukleniyor, refetch: profilRefetch } = trpc.learning.getProfile.useQuery();
  const { data: okullar, isLoading: okullarYukleniyor } = trpc.learning.getSchools.useQuery({});

  const setMutation = trpc.learning.setTargetSchool.useMutation({
    onSuccess: (res) => {
      setBildirim(`✓ ${res.okul} hedeflendi! Tahmini ${res.tahminiGun} gün.`);
      setDegistiriyorum(false);
      setSecilenId(null);
      profilRefetch();
      setTimeout(() => setBildirim(null), 5000);
    },
    onError: () => router.push("/auth/login"),
  });

  // Profil yüklenince günlük süreyi doldur
  useEffect(() => {
    if (profil?.dailyStudyMins) setGunlukSure(profil.dailyStudyMins);
  }, [profil]);

  // Okul yoksa doğrudan seçim paneli aç
  useEffect(() => {
    if (profil && !profil.targetSchoolId) setDegistiriyorum(true);
  }, [profil]);

  const filtrelenmis = (okullar ?? []).filter(
    (o) =>
      o.isim.toLowerCase().includes(arama.toLowerCase()) ||
      o.sehir.toLowerCase().includes(arama.toLowerCase())
  );

  async function cikisYap() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const mevcutOkul = profil?.targetSchool;

  return (
    <SidebarLayout userName={profil?.isim || "Öğrenci"} onLogout={cikisYap}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Başlık */}
        <h1 className="text-2xl font-black text-white">Hedef Okul</h1>

        {/* Başarı bildirimi */}
        {bildirim && (
          <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl px-4 py-3 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {bildirim}
          </div>
        )}

        {/* Mevcut okul kartı */}
        {mevcutOkul && !degistiriyorum && (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-2">Mevcut Hedef</p>
                <p className="text-2xl font-black text-white">{mevcutOkul.isim}</p>
                <p className="text-sm text-white/50 mt-1">{mevcutOkul.sehir}</p>
                <p className="text-xl font-bold text-indigo-400 mt-3">
                  {mevcutOkul.minPuan}
                  <span className="text-sm font-normal text-white/40 ml-1">taban puan</span>
                </p>
              </div>
              <button
                onClick={() => setDegistiriyorum(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm text-white/70 flex-shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" /> Değiştir
              </button>
            </div>
            {profil?.estimatedReadyDate && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-sm text-white/50">
                <Clock className="w-3.5 h-3.5" />
                Tahmini hazır: {new Date(profil.estimatedReadyDate).toLocaleDateString("tr-TR")}
              </div>
            )}
          </div>
        )}

        {/* Okul seçme paneli */}
        {degistiriyorum && (
          <div className="space-y-4">
            {/* Başlık */}
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-white">
                {mevcutOkul ? "Hedefi Değiştir" : "Okul Seç"}
              </p>
              {mevcutOkul && (
                <button
                  onClick={() => { setDegistiriyorum(false); setSecilenId(null); }}
                  className="text-sm text-white/40 hover:text-white transition-colors px-3 py-1 rounded-xl hover:bg-white/10"
                >
                  Vazgeç
                </button>
              )}
            </div>

            {/* Günlük süre */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Günlük çalışma süresi
              </p>
              <div className="flex gap-2">
                {[30, 60, 90, 120, 180].map((dk) => (
                  <button
                    key={dk}
                    onClick={() => setGunlukSure(dk)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      gunlukSure === dk
                        ? "bg-indigo-600 text-white"
                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10"
                    }`}
                  >
                    {dk >= 60 ? `${dk / 60}s` : `${dk}dk`}
                  </button>
                ))}
              </div>
            </div>

            {/* Arama */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="text"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Okul adı veya şehir ara..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 focus:bg-white/10"
              />
            </div>

            {/* Okul listesi */}
            <div className="space-y-2 max-h-80 overflow-y-auto rounded-xl">
              {profilYukleniyor || okullarYukleniyor ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                ))
              ) : filtrelenmis.length === 0 && okullar && okullar.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                  <School className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Veritabanında okul yok.</p>
                  <p className="text-xs mt-1">Admin panelinden okul ekle.</p>
                </div>
              ) : filtrelenmis.length === 0 ? (
                <p className="text-center py-8 text-white/30 text-sm">"{arama}" ile eşleşen okul bulunamadı</p>
              ) : (
                filtrelenmis.map((okul) => {
                  const secili = secilenId === okul.id;
                  const mevcutOkulMu = mevcutOkul?.id === okul.id;
                  return (
                    <button
                      key={okul.id}
                      onClick={() => setSecilenId(secili ? null : okul.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                        secili
                          ? "border-indigo-500 bg-indigo-500/15"
                          : mevcutOkulMu
                          ? "border-white/20 bg-white/5"
                          : "border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-white/10"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{okul.isim}</p>
                          {mevcutOkulMu && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                              Mevcut
                            </span>
                          )}
                          {secili && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                              Seçildi
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{okul.sehir} · {okul.tur}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-base font-black text-indigo-400">{okul.minPuan}</p>
                        <p className="text-[10px] text-white/30">taban</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Onayla butonu */}
            {secilenId && secilenId !== mevcutOkul?.id && (
              <button
                onClick={() => setMutation.mutate({ schoolId: secilenId, dailyStudyMins: gunlukSure })}
                disabled={setMutation.isPending}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                {setMutation.isPending ? "Hesaplanıyor..." : "Bu Okulu Hedefle →"}
              </button>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
