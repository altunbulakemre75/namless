"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { trpc } from "../../lib/trpc";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", INGILIZCE: "İngilizce", DIN: "Din Kültürü",
};

interface Soru {
  id: string; ders: string; konuIsim: string; soruMetni: string; siklar: string[]; zorluk: number; dogruSik: number;
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

    // Sonuclari hesapla
    const dersSkr: Record<string, { dogru: number; toplam: number }> = {};
    let dogru = 0, yanlis = 0, bos = 0;

    sorular.forEach((soru, idx) => {
      const cevap = cevaplar.get(idx);
      if (!dersSkr[soru.ders]) dersSkr[soru.ders] = { dogru: 0, toplam: 0 };
      dersSkr[soru.ders].toplam++;

      if (cevap === undefined) {
        bos++;
      } else if (cevap === soru.dogruSik) {
        dogru++;
        dersSkr[soru.ders].dogru++;
      } else {
        yanlis++;
      }
    });

    setDersSkorlar(dersSkr);

    if (examId) {
      try {
        const res = await completeMutation.mutateAsync({
          examId,
          dogruSayisi: dogru,
          yanlisSayisi: yanlis,
          bosSayisi: bos,
          dersBazinda: dersSkr,
        });
        setSonuc(res);
      } catch {
        setSonuc({ net: dogru - yanlis / 3, kocYorumu: "Giriş yaparak detaylı analiz alabilirsin." });
      }
    } else {
      // examId yoksa (auth hatasi) yerel hesapla
      setSonuc({ net: dogru - yanlis / 3, kocYorumu: "Giriş yaparak detaylı analiz alabilirsin." });
    }

    setMod("sonuc");
  }, [sorular, cevaplar, examId, tamEkran, completeMutation]);

  // Secim ekrani
  if (mod === "secim") {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Deneme Sınavı</h1>
          <p className="text-gray-500 mb-6">LGS formatında 20 soruluk deneme</p>

          <button
            onClick={() => basla(false)}
            disabled={createMutation.isPending}
            className="w-full mb-4 p-5 rounded-2xl border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📝</span>
              <div>
                <p className="font-bold text-blue-900">Normal Deneme</p>
                <p className="text-blue-600 text-sm">Süresiz, rahat tempo</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => basla(true)}
            disabled={createMutation.isPending}
            className="w-full p-5 rounded-2xl border-2 border-red-400 bg-red-50 hover:bg-red-100 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">⏱️</span>
              <div>
                <p className="font-bold text-red-900">Stres Modu</p>
                <p className="text-red-600 text-sm">Tam ekran, geri sayım, gerçek sınav baskısı</p>
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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
            <p className="text-4xl mb-3">{sonuc.net >= 15 ? "🎉" : sonuc.net >= 10 ? "💪" : "📚"}</p>
            <h1 className="text-2xl font-bold mb-2">Deneme Tamamlandı!</h1>
            <div className="text-5xl font-bold text-blue-600 my-4">{sonuc.net.toFixed(1)}</div>
            <p className="text-gray-500">net puan</p>
          </div>

          {/* Koc yorumu */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-purple-800 mb-1">Koç Yorumu:</p>
            <p className="text-sm text-purple-700">{sonuc.kocYorumu}</p>
          </div>

          <div className="flex gap-3">
            <Link href="/deneme" className="flex-1 text-center border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50">
              Tekrar Dene
            </Link>
            <Link href="/dashboard" className="flex-1 text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Sinav ekrani
  const soru = sorular[mevcutIdx];
  if (!soru) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <p className="text-4xl mb-3">🔒</p>
          <h2 className="text-xl font-bold mb-2">Giriş Gerekli</h2>
          <p className="text-gray-500 mb-6 text-sm">Deneme sınavını kullanmak için giriş yapman gerekiyor.</p>
          <Link href="/auth/login" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  const dakika = Math.floor(kalanSaniye / 60);
  const saniye = kalanSaniye % 60;

  return (
    <div className={`min-h-screen ${stressModu ? "bg-gray-900" : "bg-gray-50"} py-4 px-4`}>
      <div className="max-w-2xl mx-auto">
        {/* Ust bar */}
        <div className={`flex items-center justify-between mb-4 ${stressModu ? "text-white" : "text-gray-600"}`}>
          <span className="text-sm font-medium">Soru {mevcutIdx + 1}/{sorular.length}</span>
          {stressModu && (
            <span className={`text-lg font-bold font-mono ${kalanSaniye < 60 ? "text-red-400 animate-pulse" : "text-yellow-400"}`}>
              {String(dakika).padStart(2, "0")}:{String(saniye).padStart(2, "0")}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded ${stressModu ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-600"}`}>
            {DERS_ISIM[soru.ders]}
          </span>
        </div>

        {/* Progress */}
        <div className={`w-full rounded-full h-1.5 mb-6 ${stressModu ? "bg-gray-800" : "bg-gray-200"}`}>
          <div className={`h-1.5 rounded-full transition-all ${stressModu ? "bg-red-500" : "bg-blue-600"}`}
            style={{ width: `${((mevcutIdx + 1) / sorular.length) * 100}%` }} />
        </div>

        {/* Soru */}
        <div className={`rounded-2xl p-6 mb-4 ${stressModu ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm border border-gray-200"}`}>
          <p className={`text-[17px] font-medium mb-6 leading-relaxed ${stressModu ? "text-white" : "text-gray-900"}`}>
            {soru.soruMetni}
          </p>
          <div className="space-y-3">
            {soru.siklar.map((sik, idx) => {
              const secili = cevaplar.get(mevcutIdx) === idx;
              return (
                <button
                  key={idx}
                  onClick={() => cevapSec(mevcutIdx, idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    secili
                      ? stressModu ? "border-red-500 bg-red-900/30 text-white" : "border-blue-500 bg-blue-50"
                      : stressModu ? "border-gray-700 hover:border-gray-500 text-gray-300" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <span className={`font-semibold mr-3 ${stressModu ? "text-gray-500" : "text-gray-400"}`}>
                    {String.fromCharCode(65 + idx)})
                  </span>
                  {sik}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigasyon */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMevcutIdx((i) => Math.max(0, i - 1))}
            disabled={mevcutIdx === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30 ${
              stressModu ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            ← Önceki
          </button>

          {/* Soru numaralari */}
          <div className="flex gap-1 flex-wrap justify-center max-w-[300px]">
            {sorular.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setMevcutIdx(idx)}
                className={`w-7 h-7 rounded text-xs font-medium ${
                  idx === mevcutIdx
                    ? stressModu ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                    : cevaplar.has(idx)
                      ? stressModu ? "bg-gray-700 text-green-400" : "bg-green-100 text-green-700"
                      : stressModu ? "bg-gray-800 text-gray-500" : "bg-gray-100 text-gray-500"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {mevcutIdx + 1 >= sorular.length ? (
            <button
              onClick={bitirir}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                stressModu ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Bitir →
            </button>
          ) : (
            <button
              onClick={() => setMevcutIdx((i) => i + 1)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                stressModu ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
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
