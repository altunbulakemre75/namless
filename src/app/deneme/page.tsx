"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { trpc } from "../../lib/trpc";
import {
  FileText, Timer, ChevronLeft, Lock, CheckCircle2,
  BarChart2, Trophy, AlertCircle, Zap, Clock
} from "lucide-react";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", INGILIZCE: "İngilizce", DIN: "Din Kültürü",
};

const DERS_RENK: Record<string, string> = {
  MATEMATIK: "#6366f1", FEN: "#10b981", TURKCE: "#ef4444",
  SOSYAL: "#f97316", DIN: "#14b8a6", INGILIZCE: "#8b5cf6",
};

const DERS_SIRA = ["TURKCE", "MATEMATIK", "FEN", "SOSYAL", "DIN", "INGILIZCE"];

interface Soru {
  id: string; ders: string; konuIsim: string; soruMetni: string; siklar: string[]; zorluk: number;
}

interface Sonuc {
  net: number;
  kocYorumu: string;
  yepPuan: number | null;
  dersBazinda: Record<string, { dogru: number; toplam: number }>;
  zayifDersler: string[];
}

export default function DenemePage() {
  const [mod, setMod] = useState<"secim" | "sinav" | "sonuc">("secim");
  const [stressModu, setStressModu] = useState(false);
  const [tamMod, setTamMod] = useState(true);
  const [mevcutIdx, setMevcutIdx] = useState(0);
  const [cevaplar, setCevaplar] = useState<Map<number, number>>(new Map());
  const [kalanSaniye, setKalanSaniye] = useState(0);
  const [examId, setExamId] = useState("");
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [tamEkran, setTamEkran] = useState(false);
  const [dersSoruSayisi, setDersSoruSayisi] = useState<Record<string, number>>({});

  const createMutation = trpc.learning.createMockExam.useMutation();
  const completeMutation = trpc.learning.completeMockExam.useMutation();

  // Geri sayım
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

  const basla = async (stress: boolean, tam: boolean) => {
    setStressModu(stress);
    setTamMod(tam);
    try {
      const data = await createMutation.mutateAsync({ stressModu: stress, tamMod: tam });
      setExamId(data.examId);
      setSorular(data.sorular);
      setDersSoruSayisi(data.dersSoruSayisi);
      setKalanSaniye(data.sureDakika * 60);
      setMod("sinav");
      if (stress) {
        document.documentElement.requestFullscreen?.();
        setTamEkran(true);
      }
    } catch {
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
          secilenSik: cevaplar.get(idx) ?? -1,
        }));
        const res = await completeMutation.mutateAsync({ examId, cevaplar: cevaplarArray });
        setSonuc({ net: res.net, kocYorumu: res.kocYorumu, yepPuan: res.yepPuan ?? null, dersBazinda: res.dersBazinda, zayifDersler: res.zayifDersler });
      } catch {
        setSonuc({ net: 0, kocYorumu: "Sonuç kaydedilemedi.", yepPuan: null, dersBazinda: {}, zayifDersler: [] });
      }
    } else {
      setSonuc({ net: 0, kocYorumu: "Giriş yaparak detaylı analiz alabilirsin.", yepPuan: null, dersBazinda: {}, zayifDersler: [] });
    }
    setMod("sonuc");
  }, [sorular, cevaplar, examId, tamEkran, completeMutation]);

  // ── Seçim ekranı ─────────────────────────────────────────────────────────
  if (mod === "secim") {
    return (
      <div className="min-h-screen bg-background text-foreground py-10 px-6">
        <div className="max-w-xl mx-auto">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ios-blue)] hover:opacity-70 transition-opacity mb-8">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Deneme Sınavı</h1>
          <p className="text-sm text-foreground/50 mb-8">LGS formatında sorularla kendinizi test edin</p>

          {/* Tam LGS Denemesi */}
          <button
            onClick={() => basla(false, true)}
            disabled={createMutation.isPending}
            className="w-full mb-4 p-6 rounded-squircle ios-card text-left group hover:-translate-y-1 transition-transform border border-transparent hover:border-[var(--ios-blue)]/40 disabled:opacity-60"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-squircle bg-[var(--ios-blue)]/10 text-[var(--ios-blue)] flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[17px] text-foreground tracking-tight mb-0.5">Tam Deneme</p>
                <p className="text-[13px] text-foreground/50">Tüm dersler, süresiz, detaylı analiz + YEP tahmini</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-[var(--ios-blue)]">74</p>
                <p className="text-[10px] text-foreground/40 font-semibold uppercase tracking-widest">Soru</p>
              </div>
            </div>
          </button>

          {/* Stres Modu */}
          <button
            onClick={() => basla(true, true)}
            disabled={createMutation.isPending}
            className="w-full mb-4 p-6 rounded-squircle ios-card text-left group hover:-translate-y-1 transition-transform border border-transparent hover:border-red-500/40 disabled:opacity-60"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-squircle bg-red-500/10 text-red-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Timer className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[17px] text-foreground tracking-tight mb-0.5">Stres Modu</p>
                <p className="text-[13px] text-foreground/50">Tam ekran, 130 dakika geri sayım, gerçek sınav baskısı</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-red-500">130</p>
                <p className="text-[10px] text-foreground/40 font-semibold uppercase tracking-widest">Dakika</p>
              </div>
            </div>
          </button>

          {/* Mini Deneme */}
          <button
            onClick={() => basla(false, false)}
            disabled={createMutation.isPending}
            className="w-full p-6 rounded-squircle ios-card text-left group hover:-translate-y-1 transition-transform border border-transparent hover:border-emerald-500/40 disabled:opacity-60"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-squircle bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[17px] text-foreground tracking-tight mb-0.5">Mini Deneme</p>
                <p className="text-[13px] text-foreground/50">Her dersten 2-4 soru, hızlı kontrol</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-emerald-500">~18</p>
                <p className="text-[10px] text-foreground/40 font-semibold uppercase tracking-widest">Soru</p>
              </div>
            </div>
          </button>

          {createMutation.isPending && (
            <p className="text-center text-sm text-foreground/50 mt-6 animate-pulse">Sorular hazırlanıyor...</p>
          )}
        </div>
      </div>
    );
  }

  // ── Sonuç ekranı ─────────────────────────────────────────────────────────
  if (mod === "sonuc" && sonuc) {
    const emoji = sonuc.net >= 60 ? "🏆" : sonuc.net >= 40 ? "🎉" : sonuc.net >= 20 ? "💪" : "📚";
    return (
      <div className="min-h-screen bg-background text-foreground py-10 px-6">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Başlık kart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="ios-card rounded-squircle-lg p-8 text-center"
          >
            <p className="text-5xl mb-3">{emoji}</p>
            <h1 className="text-2xl font-bold tracking-tight mb-4">Deneme Tamamlandı</h1>
            <div className="flex items-center justify-center gap-8">
              <div>
                <p className="text-6xl font-black tracking-tighter">{sonuc.net.toFixed(1)}</p>
                <p className="text-xs text-foreground/50 uppercase tracking-widest font-semibold mt-1">Net</p>
              </div>
              {sonuc.yepPuan && (
                <div className="border-l border-foreground/10 pl-8">
                  <p className="text-5xl font-black tracking-tighter text-[var(--ios-blue)]">{sonuc.yepPuan}</p>
                  <p className="text-xs text-[var(--ios-blue)]/60 uppercase tracking-widest font-semibold mt-1">YEP Tahmini</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Ders bazında sonuçlar */}
          {Object.keys(sonuc.dersBazinda).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="ios-card rounded-squircle-lg p-6"
            >
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/50 mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Ders Analizi
              </h2>
              <div className="space-y-3">
                {DERS_SIRA.filter((d) => sonuc.dersBazinda[d]).map((ders) => {
                  const { dogru, toplam } = sonuc.dersBazinda[ders];
                  const pct = toplam > 0 ? Math.round((dogru / toplam) * 100) : 0;
                  const renk = DERS_RENK[ders] ?? "#94a3b8";
                  const zayif = sonuc.zayifDersler.includes(ders);
                  return (
                    <div key={ders}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{DERS_ISIM[ders]}</span>
                          {zayif && <AlertCircle className="w-3.5 h-3.5 text-orange-500" />}
                        </div>
                        <span className="text-sm font-bold" style={{ color: renk }}>
                          {dogru}/{toplam} <span className="text-xs text-foreground/40 font-normal">(%{pct})</span>
                        </span>
                      </div>
                      <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: renk }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Koç yorumu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="ios-card rounded-squircle-lg p-6 bg-[var(--ios-blue)]/5"
          >
            <p className="text-[11px] font-bold text-[var(--ios-blue)] uppercase tracking-widest mb-2 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5" /> Koç Yorumu
            </p>
            <p className="text-[15px] font-medium leading-relaxed">{sonuc.kocYorumu}</p>
          </motion.div>

          {/* Butonlar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col gap-3"
          >
            <Link href="/dashboard" className="w-full text-center bg-[var(--ios-blue)] text-white py-4 rounded-squircle font-semibold hover:opacity-90 transition-opacity">
              Dashboard&apos;a Dön
            </Link>
            <button
              onClick={() => { setMod("secim"); setSorular([]); setCevaplar(new Map()); setSonuc(null); setMevcutIdx(0); }}
              className="w-full text-center text-[var(--ios-blue)] bg-[var(--ios-blue)]/10 py-4 rounded-squircle font-semibold hover:opacity-80 transition-opacity"
            >
              Tekrar Dene
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Sınav ekranı ─────────────────────────────────────────────────────────
  const soru = sorular[mevcutIdx];
  if (!soru) {
    return (
      <div className="min-h-screen bg-background py-16 px-6">
        <div className="max-w-md mx-auto ios-card rounded-squircle shadow-xl p-10 text-center">
          <Lock className="w-10 h-10 mx-auto mb-4 text-foreground/30" />
          <h2 className="text-2xl font-bold tracking-tight mb-2">Giriş Gerekli</h2>
          <p className="text-[15px] text-foreground/60 mb-8">Deneme sınavını kullanmak için giriş yapman gerekiyor.</p>
          <Link href="/auth/login" className="inline-block w-full bg-[var(--ios-blue)] text-white px-6 py-4 rounded-squircle font-semibold">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  const dakika = Math.floor(kalanSaniye / 60);
  const saniye = kalanSaniye % 60;
  const dersGrupBaslangic = sorular.findIndex((s) => s.ders === soru.ders);
  const dersGrupBitis = sorular.findLastIndex((s) => s.ders === soru.ders);
  const cevaplananSayisi = cevaplar.size;

  return (
    <div className={`min-h-screen ${stressModu ? "bg-black text-white" : "bg-background text-foreground"} transition-colors`}>
      <div className="max-w-3xl mx-auto px-4 md:px-6 h-screen flex flex-col py-6">

        {/* Üst bar */}
        <div className={`flex items-center justify-between shrink-0 mb-4 ${stressModu ? "text-white" : ""}`}>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-foreground/50">{mevcutIdx + 1}/{sorular.length}</span>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${DERS_RENK[soru.ders]}20`, color: DERS_RENK[soru.ders] }}
            >
              {DERS_ISIM[soru.ders]}
            </span>
          </div>

          {stressModu && (
            <div className={`flex items-center gap-1.5 font-mono text-xl font-bold ${kalanSaniye < 300 ? "text-red-500 animate-pulse" : ""}`}>
              <Clock className="w-4 h-4" />
              {String(dakika).padStart(2, "0")}:{String(saniye).padStart(2, "0")}
            </div>
          )}

          <button
            onClick={bitirir}
            className={`text-[13px] font-semibold px-4 py-2 rounded-full transition-colors ${
              stressModu ? "bg-white/10 text-white hover:bg-white/20" : "bg-foreground/5 hover:bg-foreground/10"
            }`}
          >
            {completeMutation.isPending ? "..." : `Bitir (${cevaplananSayisi}/${sorular.length})`}
          </button>
        </div>

        {/* İlerleme */}
        <div className={`w-full h-1 rounded-full mb-1 shrink-0 ${stressModu ? "bg-white/10" : "bg-foreground/5"}`}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((mevcutIdx + 1) / sorular.length) * 100}%`,
              backgroundColor: stressModu ? "#ef4444" : DERS_RENK[soru.ders],
            }}
          />
        </div>
        {/* Ders aralık göstergesi */}
        <p className="text-[10px] text-foreground/30 text-right mb-5 shrink-0">
          {DERS_ISIM[soru.ders]}: {mevcutIdx - dersGrupBaslangic + 1}/{dersGrupBitis - dersGrupBaslangic + 1}
        </p>

        {/* Soru */}
        <div className="flex-1 overflow-y-auto mb-4">
          <p className={`text-lg md:text-xl font-medium mb-8 leading-relaxed ${stressModu ? "text-gray-100" : ""}`}>
            {soru.soruMetni}
          </p>
          <div className="space-y-3">
            {soru.siklar.map((sik, idx) => {
              const secili = cevaplar.get(mevcutIdx) === idx;
              return (
                <button
                  key={idx}
                  onClick={() => cevapSec(mevcutIdx, idx)}
                  className={`w-full text-left p-4 md:p-5 rounded-2xl transition-all border ${
                    secili
                      ? stressModu
                        ? "bg-red-500/20 border-red-500/50 text-white"
                        : "border-[var(--ios-blue)]/50 text-[var(--ios-blue)] font-medium"
                      : stressModu
                        ? "bg-white/5 border-white/10 hover:border-white/25 text-gray-300"
                        : "border-foreground/10 hover:border-foreground/25 hover:bg-foreground/[0.02]"
                  }`}
                  style={secili && !stressModu ? { backgroundColor: `${DERS_RENK[soru.ders]}08`, borderColor: `${DERS_RENK[soru.ders]}60` } : {}}
                >
                  <div className="flex items-start gap-4">
                    <span className={`font-bold text-sm shrink-0 mt-[1px] ${secili ? stressModu ? "text-red-400" : "" : "text-foreground/30"}`}
                      style={secili && !stressModu ? { color: DERS_RENK[soru.ders] } : {}}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug text-[15px]">{sik}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigasyon */}
        <div className="shrink-0 flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => setMevcutIdx((i) => Math.max(0, i - 1))}
            disabled={mevcutIdx === 0}
            className={`px-5 py-3 rounded-full text-[15px] font-semibold disabled:opacity-30 transition-colors ${
              stressModu ? "bg-white/10 text-white" : "bg-foreground/5"
            }`}
          >
            ← Önceki
          </button>

          {/* Ders navigasyonu (masaüstü) */}
          <div className="hidden md:flex gap-1 overflow-x-auto max-w-sm">
            {DERS_SIRA.filter((d) => dersSoruSayisi[d]).map((d) => {
              const startIdx = sorular.findIndex((s) => s.ders === d);
              const isActive = soru.ders === d;
              const answeredInDers = sorular.filter((s, i) => s.ders === d && cevaplar.has(i)).length;
              const totalInDers = dersSoruSayisi[d] ?? 0;
              return (
                <button
                  key={d}
                  onClick={() => setMevcutIdx(startIdx)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                    isActive ? "text-white" : "text-foreground/50 hover:text-foreground"
                  }`}
                  style={isActive ? { backgroundColor: DERS_RENK[d] } : { backgroundColor: "transparent" }}
                  title={`${DERS_ISIM[d]}: ${answeredInDers}/${totalInDers}`}
                >
                  {d.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {mevcutIdx + 1 >= sorular.length ? (
            <button
              onClick={bitirir}
              disabled={completeMutation.isPending}
              className={`px-6 py-3 rounded-full text-[15px] font-bold transition-colors disabled:opacity-60 ${
                stressModu ? "bg-red-600 text-white" : "bg-[var(--ios-blue)] text-white"
              }`}
            >
              {completeMutation.isPending ? "Hesaplanıyor..." : "Bitir →"}
            </button>
          ) : (
            <button
              onClick={() => setMevcutIdx((i) => i + 1)}
              className={`px-5 py-3 rounded-full text-[15px] font-semibold transition-colors ${
                stressModu ? "bg-white/10 text-white" : "bg-[var(--ios-blue)]/10 text-[var(--ios-blue)]"
              }`}
            >
              Sonraki →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
