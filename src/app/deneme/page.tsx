"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { trpc } from "../../lib/trpc";
import { FileText, Timer, ChevronLeft, Lock } from "lucide-react";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", INGILIZCE: "İngilizce", DIN: "Din Kültürü",
};

interface Soru {
  id: string; ders: string; konuIsim: string; soruMetni: string; siklar: string[]; zorluk: number;
}

export default function DenemePage() {
  const [mod, setMod] = useState<"secim" | "sinav" | "sonuc">("secim");
  const [stressModu, setStressModu] = useState(false);
  const [mevcutIdx, setMevcutIdx] = useState(0);
  const [cevaplar, setCevaplar] = useState<Map<number, number>>(new Map());
  const [kalanSaniye, setKalanSaniye] = useState(0);
  const [examId, setExamId] = useState("");
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [sonuc, setSonuc] = useState<{ net: number; kocYorumu: string } | null>(null);
  const [dersSkorlar, setDersSkorlar] = useState<Record<string, { dogru: number; toplam: number }>>({});
  const [tamEkran, setTamEkran] = useState(false);

  const createMutation = trpc.learning.createMockExam.useMutation();
  const completeMutation = trpc.learning.completeMockExam.useMutation();

  // Geri sayim
  useEffect(() => {
    if (mod !== "sinav" || !stressModu || kalanSaniye <= 0) return;
    const timer = setInterval(() => {
      setKalanSaniye((s) => {
        if (s <= 1) { bitirir(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod, stressModu, kalanSaniye]);

  const basla = async (stress: boolean) => {
    setStressModu(stress);
    try {
      const data = await createMutation.mutateAsync({ stressModu: stress });
      setExamId(data.examId);
      setSorular(data.sorular);
      setKalanSaniye(data.sureDakika * 60);
      setMod("sinav");
      if (stress) {
        document.documentElement.requestFullscreen?.();
        setTamEkran(true);
      }
    } catch {
      // Auth yoksa demo mod
      setMod("sinav");
    }
  };

  const cevapSec = (soruIdx: number, sikIdx: number) => {
    setCevaplar((prev) => new Map(prev).set(soruIdx, sikIdx));
  };

  const bitirir = useCallback(async () => {
    if (tamEkran) document.exitFullscreen?.();

    if (examId) {
      try {
        const cevaplarArray = sorular.map((soru, idx) => ({
          questionId: soru.id,
          secilenSik: cevaplar.get(idx) ?? -1, // -1 = boş
        }));
        const res = await completeMutation.mutateAsync({ examId, cevaplar: cevaplarArray });
        setDersSkorlar(res.dersBazinda);
        setSonuc({ net: res.net, kocYorumu: res.kocYorumu });
      } catch {
        setSonuc({ net: 0, kocYorumu: "Sonuç kaydedilemedi. Lütfen tekrar deneyin." });
      }
    } else {
      setSonuc({ net: 0, kocYorumu: "Giriş yaparak detaylı analiz alabilirsin." });
    }

    setMod("sonuc");
  }, [sorular, cevaplar, examId, tamEkran, completeMutation]);

  // Secim ekrani
  if (mod === "secim") {
    return (
      <div className="min-h-screen bg-background text-foreground py-10 px-6">
        <div className="max-w-lg mx-auto">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ios-blue)] hover:opacity-70 transition-opacity mb-8">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Deneme Sınavı</h1>
          <p className="subheadline mb-10">LGS formatında 20 soruluk deneme</p>

          <button
            onClick={() => basla(false)}
            disabled={createMutation.isPending}
            className="w-full mb-4 p-6 rounded-squircle ios-card text-left group hover:-translate-y-1 transition-transform border border-transparent hover:border-[var(--ios-blue)]/50"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-squircle bg-[var(--ios-blue)]/10 text-[var(--ios-blue)] flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-[17px] text-foreground tracking-tight mb-0.5">Normal Deneme</p>
                <p className="text-[13px] subheadline">Süresiz, rahat tempo</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => basla(true)}
            disabled={createMutation.isPending}
            className="w-full p-6 rounded-squircle ios-card text-left group hover:-translate-y-1 transition-transform border border-transparent hover:border-red-500/50"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-squircle bg-red-500/10 text-red-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Timer className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-[17px] text-foreground tracking-tight mb-0.5">Stres Modu</p>
                <p className="text-[13px] subheadline">Tam ekran, geri sayım, gerçek sınav baskısı</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Sonuc ekrani
  if (mod === "sonuc" && sonuc) {
    return (
      <div className="min-h-screen bg-background text-foreground py-12 px-6">
        <div className="max-w-md mx-auto">
          <div className="ios-card rounded-squircle shadow-xl shadow-foreground/5 p-10 text-center mb-6">
            <p className="text-5xl mb-4">{sonuc.net >= 15 ? "🎉" : sonuc.net >= 10 ? "💪" : "📚"}</p>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Deneme Tamamlandı</h1>
            <p className="subheadline text-sm font-medium mb-6">Sonucun hesaplandı.</p>
            <div className="text-6xl font-black text-foreground mb-1 tracking-tighter">{sonuc.net.toFixed(1)}</div>
            <p className="text-xs subheadline uppercase tracking-widest font-semibold">Net Puan</p>
          </div>

          {/* Koc yorumu */}
          <div className="ios-card rounded-squircle bg-[var(--ios-blue)]/5 border-none p-6 mb-8">
            <p className="text-[11px] font-bold text-[var(--ios-blue)] uppercase tracking-widest flex items-center gap-2 mb-2">Koç Yorumu</p>
            <p className="text-[15px] font-medium leading-relaxed tracking-tight">{sonuc.kocYorumu}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="w-full text-center bg-[var(--ios-blue)] text-white py-4 rounded-squircle font-semibold hover:opacity-90 transition-opacity">
              Dashboard'a Dön
            </Link>
            <Link href="/deneme" className="w-full text-center text-[var(--ios-blue)] bg-[var(--ios-blue)]/10 py-4 rounded-squircle font-semibold hover:opacity-80 transition-opacity">
              Tekrar Dene
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Sinav ekrani (Giris yoksa veya data yoksa)
  const soru = sorular[mevcutIdx];
  if (!soru) {
    return (
      <div className="min-h-screen bg-background py-16 px-6">
        <div className="max-w-md mx-auto ios-card rounded-squircle shadow-xl shadow-foreground/5 p-10 text-center">
          <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 text-foreground/50">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Giriş Gerekli</h2>
          <p className="text-[15px] subheadline font-medium mb-8">Deneme sınavını kullanmak için giriş yapman gerekiyor.</p>
          <Link href="/auth/login" className="inline-block w-full bg-[var(--ios-blue)] text-white px-6 py-4 rounded-squircle font-semibold shadow-md hover:opacity-90 transition-opacity">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  const dakika = Math.floor(kalanSaniye / 60);
  const saniye = kalanSaniye % 60;

  return (
    <div className={`min-h-screen ${stressModu ? "bg-black text-white" : "bg-background text-foreground"} py-6 px-4 md:px-6 transition-colors duration-500`}>
      <div className="max-w-3xl mx-auto h-[calc(100vh-3rem)] flex flex-col">
        {/* Ust bar */}
        <div className={`flex items-center justify-between shrink-0 mb-6 px-2 ${stressModu ? "text-white" : "text-foreground"}`}>
          <span className="text-[15px] font-semibold tracking-tight">Soru {mevcutIdx + 1}/{sorular.length}</span>
          {stressModu && (
            <span className={`text-xl font-bold font-mono tracking-tighter ${kalanSaniye < 60 ? "text-red-500 animate-pulse" : "text-[var(--ios-blue)]"}`}>
              {String(dakika).padStart(2, "0")}:{String(saniye).padStart(2, "0")}
            </span>
          )}
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest ${stressModu ? "bg-white/10 text-white/70" : "bg-foreground/5 subheadline"}`}>
            {DERS_ISIM[soru.ders]}
          </span>
        </div>

        {/* Progress */}
        <div className={`w-full rounded-full h-1.5 mb-8 shrink-0 ${stressModu ? "bg-white/10" : "bg-foreground/5"}`}>
          <div className={`h-full rounded-full transition-all duration-300 ${stressModu ? "bg-red-500" : "bg-[var(--ios-blue)]"}`}
            style={{ width: `${((mevcutIdx + 1) / sorular.length) * 100}%` }} />
        </div>

        {/* Soru */}
        <div className={`flex-1 overflow-y-auto mb-6 px-2 ${stressModu ? "scrollbar-dark" : ""}`}>
          <p className={`text-lg md:text-xl font-medium mb-10 leading-relaxed tracking-tight ${stressModu ? "text-gray-200" : "text-foreground"}`}>
            {soru.soruMetni}
          </p>
          <div className="space-y-4">
            {soru.siklar.map((sik, idx) => {
              const secili = cevaplar.get(mevcutIdx) === idx;
              return (
                <button
                  key={idx}
                  onClick={() => cevapSec(mevcutIdx, idx)}
                  className={`w-full text-left p-5 md:p-6 rounded-2xl md:rounded-squircle transition-all border ${
                    secili
                      ? stressModu ? "bg-red-500/20 border-red-500/50 text-white" : "bg-[var(--ios-blue)]/5 border-[var(--ios-blue)]/50 text-[var(--ios-blue)] font-medium"
                      : stressModu ? "bg-white/5 border-white/5 hover:border-white/20 text-gray-300" : "bg-background border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`font-bold mt-[1px] ${
                      secili ? stressModu ? "text-red-400" : "text-[var(--ios-blue)]" : stressModu ? "text-gray-500" : "subheadline"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{sik}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigasyon */}
        <div className="flex items-center justify-between shrink-0 px-2 py-4 mt-auto">
          <button
            onClick={() => setMevcutIdx((i) => Math.max(0, i - 1))}
            disabled={mevcutIdx === 0}
            className={`px-5 py-3 rounded-full text-[15px] font-semibold disabled:opacity-30 transition-colors ${
              stressModu ? "bg-white/10 text-white hover:bg-white/20" : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
          >
            Önceki
          </button>

          {/* Soru numaralari (Masaustunde goster) */}
          <div className="hidden md:flex gap-1.5 flex-wrap justify-center max-w-[400px]">
            {sorular.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setMevcutIdx(idx)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  idx === mevcutIdx
                    ? stressModu ? "bg-red-500 text-white scale-110" : "bg-[var(--ios-blue)] text-white scale-110 shadow-sm shadow-[var(--ios-blue)]/30"
                    : cevaplar.has(idx)
                      ? stressModu ? "bg-white/20 text-white" : "bg-[var(--ios-blue)]/10 text-[var(--ios-blue)]"
                      : stressModu ? "bg-white/5 text-gray-500 hover:bg-white/10" : "bg-foreground/5 subheadline hover:bg-foreground/10 hover:text-foreground"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {mevcutIdx + 1 >= sorular.length ? (
            <button
              onClick={bitirir}
              className={`px-7 py-3 rounded-full text-[15px] font-bold transition-colors ${
                stressModu ? "bg-red-600 text-white hover:bg-red-500" : "bg-[var(--ios-blue)] text-white hover:opacity-90 shadow-md shadow-[var(--ios-blue)]/20"
              }`}
            >
              Bitir
            </button>
          ) : (
            <button
              onClick={() => setMevcutIdx((i) => i + 1)}
              className={`px-5 py-3 rounded-full text-[15px] font-semibold transition-colors ${
                stressModu ? "bg-white/10 text-white hover:bg-white/20" : "bg-[var(--ios-blue)]/10 text-[var(--ios-blue)] hover:bg-[var(--ios-blue)]/20"
              }`}
            >
              Sonraki
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
