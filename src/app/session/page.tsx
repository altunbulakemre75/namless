"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "../../lib/trpc";

interface Soru {
  id: string;
  ders: string;
  konuIsim: string;
  soruMetni: string;
  siklar: string[];
  zorluk: number;
}

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik",
  FEN: "Fen Bilimleri",
  TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler",
  INGILIZCE: "İngilizce",
  DIN: "Din Kültürü",
};

function ZorlukBadge({ zorluk }: { zorluk: number }) {
  const config = {
    1: { label: "Kolay", cls: "bg-green-100 text-green-700" },
    2: { label: "Orta", cls: "bg-yellow-100 text-yellow-700" },
    3: { label: "Zor", cls: "bg-red-100 text-red-700" },
  }[zorluk] ?? { label: "?", cls: "bg-gray-100 text-gray-700" };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.cls}`}>
      {config.label}
    </span>
  );
}

export default function SessionPage() {
  const [mevcutIdx, setMevcutIdx] = useState(0);
  const [secilenSik, setSecilenSik] = useState<number | null>(null);
  const [gosterAciklama, setGosterAciklama] = useState(false);
  const [sonuclar, setSonuclar] = useState<{ dogruMu: boolean; dogruSik: number; aciklama: string } | null>(null);
  const [bitmis, setBitmis] = useState(false);
  const [dogru, setDogru] = useState(0);
  const [baslangic] = useState(Date.now());

  const { data: session, isLoading } = trpc.assessment.getTodaySession.useQuery();
  const submitMutation = trpc.assessment.submitAnswer.useMutation();

  const sorular: Soru[] = session?.questions ?? [];
  const soru = sorular[mevcutIdx];

  const cevapla = async () => {
    if (secilenSik === null || !soru) return;

    const sure = Date.now() - baslangic;
    const sonuc = await submitMutation.mutateAsync({
      questionId: soru.id,
      secilenSik,
      sureMs: sure,
      baglam: "DAILY",
    });

    setSonuclar(sonuc);
    setGosterAciklama(true);
    if (sonuc.dogruMu) setDogru((d) => d + 1);
  };

  const sonraki = () => {
    if (mevcutIdx + 1 >= sorular.length) {
      setBitmis(true);
    } else {
      setMevcutIdx((i) => i + 1);
      setSecilenSik(null);
      setGosterAciklama(false);
      setSonuclar(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Sorular hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (!session || sorular.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <p className="text-2xl mb-3">Tebrikler!</p>
          <h2 className="text-xl font-bold mb-2">Bugünkü çalışman bitti</h2>
          <p className="text-gray-500 mb-6">Yarın yeni sorularla devam edebilirsin.</p>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700"
          >
            Dashboard&apos;a Dön
          </Link>
        </div>
      </div>
    );
  }

  if (bitmis) {
    const yuzde = Math.round((dogru / sorular.length) * 100);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">
            {yuzde >= 70 ? "🎉" : yuzde >= 40 ? "💪" : "📚"}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oturum Tamamlandı!</h2>
          <div className="text-5xl font-bold text-blue-600 my-6">%{yuzde}</div>
          <p className="text-gray-500 mb-6">
            {dogru}/{sorular.length} doğru cevap
          </p>
          <Link
            href="/dashboard"
            className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Dashboard&apos;a Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            ← Dashboard
          </Link>
          <span className="text-sm text-gray-500">
            {mevcutIdx + 1}/{sorular.length}
          </span>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((mevcutIdx + 1) / sorular.length) * 100}%` }}
          />
        </div>

        {/* Soru Kart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">
              {DERS_ISIM[soru.ders] ?? soru.ders} — {soru.konuIsim}
            </span>
            <ZorlukBadge zorluk={soru.zorluk} />
          </div>

          <p className="text-lg font-medium text-gray-900 mb-6">
            {soru.soruMetni}
          </p>

          <div className="space-y-3">
            {soru.siklar.map((sik, idx) => {
              const harf = String.fromCharCode(65 + idx);
              let stil =
                "border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer";

              if (gosterAciklama && sonuclar) {
                if (idx === sonuclar.dogruSik) {
                  stil = "border-green-500 bg-green-50 cursor-default";
                } else if (idx === secilenSik) {
                  stil = "border-red-400 bg-red-50 cursor-default";
                } else {
                  stil = "border-gray-200 opacity-40 cursor-default";
                }
              } else if (secilenSik === idx) {
                stil = "border-blue-500 bg-blue-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => !gosterAciklama && setSecilenSik(idx)}
                  disabled={gosterAciklama}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${stil}`}
                >
                  <span className="font-semibold text-gray-400 mr-3">{harf})</span>
                  {sik}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aciklama */}
        {gosterAciklama && sonuclar && (
          <div
            className={`rounded-xl p-4 mb-4 border ${
              sonuclar.dogruMu
                ? "bg-green-50 border-green-200"
                : "bg-orange-50 border-orange-200"
            }`}
          >
            <p className={`text-sm font-semibold mb-1 ${sonuclar.dogruMu ? "text-green-800" : "text-orange-800"}`}>
              {sonuclar.dogruMu ? "Doğru!" : "Yanlış — Açıklama:"}
            </p>
            <p className={`text-sm ${sonuclar.dogruMu ? "text-green-700" : "text-orange-700"}`}>
              {sonuclar.aciklama}
            </p>
          </div>
        )}

        {/* Aksiyon */}
        <div className="flex justify-end">
          {!gosterAciklama ? (
            <button
              onClick={cevapla}
              disabled={secilenSik === null || submitMutation.isPending}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitMutation.isPending ? "Kaydediliyor..." : "Cevapla"}
            </button>
          ) : (
            <button
              onClick={sonraki}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {mevcutIdx + 1 >= sorular.length ? "Sonuçları Gör" : "Sonraki Soru"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
