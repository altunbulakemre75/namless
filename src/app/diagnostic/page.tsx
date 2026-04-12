"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "../../lib/trpc";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik",
  FEN: "Fen Bilimleri",
  TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler",
  INGILIZCE: "İngilizce",
  DIN: "Din Kültürü",
};

export default function DiagnosticPage() {
  const router = useRouter();
  const [baslamis, setBaslamis] = useState(false);
  const [mevcutIdx, setMevcutIdx] = useState(0);
  const [secilenSik, setSecilenSik] = useState<number | null>(null);
  const [gosterAciklama, setGosterAciklama] = useState(false);
  const [sonuc, setSonuc] = useState<{ dogruMu: boolean; dogruSik: number; aciklama: string } | null>(null);
  const [bitmis, setBitmis] = useState(false);
  const [dogru, setDogru] = useState(0);
  const [dersBazinda, setDersBazinda] = useState<Record<string, number>>({});
  const [baslangic] = useState(Date.now());

  const { data: sorular, isLoading } = trpc.assessment.getDiagnosticQuestions.useQuery(
    undefined,
    { enabled: baslamis }
  );

  const submitMutation = trpc.assessment.submitAnswer.useMutation();
  const completeMutation = trpc.assessment.completeDiagnostic.useMutation();

  const soru = sorular?.[mevcutIdx];

  const cevapla = async () => {
    if (secilenSik === null || !soru) return;

    const sure = Date.now() - baslangic;

    try {
      const result = await submitMutation.mutateAsync({
        questionId: soru.id,
        secilenSik,
        sureMs: sure,
        baglam: "DIAGNOSTIC",
      });

      setSonuc(result);
      setGosterAciklama(true);
      if (result.dogruMu) setDogru((d) => d + 1);
    } catch {
      // Auth yoksa local fallback
      const mockDogru = secilenSik === 0;
      setSonuc({ dogruMu: mockDogru, dogruSik: 0, aciklama: "Lütfen giriş yaparak devam edin." });
      setGosterAciklama(true);
    }
  };

  const sonraki = async () => {
    if (!sorular) return;

    if (mevcutIdx + 1 >= sorular.length) {
      // Diagnostic bitti
      try {
        const tamamSonuc = await completeMutation.mutateAsync();
        setDersBazinda(tamamSonuc.dersBazindaSkor);
      } catch {
        // Auth yoksa demo sonuc
      }
      setBitmis(true);
    } else {
      setMevcutIdx((i) => i + 1);
      setSecilenSik(null);
      setGosterAciklama(false);
      setSonuc(null);
    }
  };

  // Sonuc ekrani
  if (bitmis && sorular) {
    const yuzde = Math.round((dogru / sorular.length) * 100);
    const seviye = yuzde >= 80 ? "İleri Seviye" : yuzde >= 50 ? "Orta Seviye" : "Başlangıç Seviye";

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Seviye Belirleme Tamamlandı!
            </h1>
            <div className="my-8">
              <div className="text-6xl font-bold text-blue-600">%{yuzde}</div>
              <p className="text-gray-500 mt-2">{dogru}/{sorular.length} doğru</p>
            </div>
            <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {seviye}
            </span>
          </div>

          {/* Ders bazinda sonuclar */}
          {Object.keys(dersBazinda).length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Ders Bazında Sonuçlar</h2>
              <div className="space-y-3">
                {Object.entries(dersBazinda).map(([ders, skor]) => (
                  <div key={ders} className="flex items-center gap-3">
                    <span className="w-36 text-sm font-medium text-gray-700">
                      {DERS_ISIM[ders] ?? ders}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          skor >= 70 ? "bg-green-500" : skor >= 40 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${skor}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">%{skor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
            Kişisel çalışma planın oluşturuldu! Zayıf konularından başlayarak seni LGS&apos;ye hazırlayacağız.
          </div>

          <Link
            href="/dashboard"
            className="block text-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Çalışma Planımı Gör
          </Link>
        </div>
      </div>
    );
  }

  // Baslama ekrani
  if (!baslamis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            📊
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Seviye Belirleme Testi</h1>
          <p className="text-gray-600 mb-2">
            Tüm derslerden sorularla seviyeni belirleyeceğiz.
          </p>
          <ul className="text-sm text-gray-500 mb-6 space-y-1">
            <li>• Tahmini süre: ~10 dakika</li>
            <li>• Her sorudan sonra açıklama gösterilir</li>
            <li>• Sonuçlar kişisel planını oluşturur</li>
          </ul>
          <button
            onClick={() => setBaslamis(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Teste Başla
          </button>
        </div>
      </div>
    );
  }

  // Yuklenme
  if (isLoading || !soru) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Sorular hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  // Soru ekrani
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Soru {mevcutIdx + 1}/{sorular?.length ?? "?"}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
              {DERS_ISIM[soru.ders] ?? soru.ders} — {soru.konuIsim}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((mevcutIdx + 1) / (sorular?.length ?? 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Soru */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <p className="text-lg font-medium text-gray-900 mb-6">{soru.soruMetni}</p>

          <div className="space-y-3">
            {soru.siklar.map((sik, idx) => {
              const harf = String.fromCharCode(65 + idx);
              let stil = "border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer";

              if (gosterAciklama && sonuc) {
                if (idx === sonuc.dogruSik) stil = "border-green-500 bg-green-50 cursor-default";
                else if (idx === secilenSik) stil = "border-red-400 bg-red-50 cursor-default";
                else stil = "border-gray-200 opacity-40 cursor-default";
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
        {gosterAciklama && sonuc && (
          <div className={`rounded-xl p-4 mb-4 border ${
            sonuc.dogruMu ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
          }`}>
            <p className={`text-sm font-semibold mb-1 ${sonuc.dogruMu ? "text-green-800" : "text-orange-800"}`}>
              {sonuc.dogruMu ? "Doğru!" : "Yanlış — Açıklama:"}
            </p>
            <p className={`text-sm ${sonuc.dogruMu ? "text-green-700" : "text-orange-700"}`}>
              {sonuc.aciklama}
            </p>
          </div>
        )}

        {/* Buton */}
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
              disabled={completeMutation.isPending}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {completeMutation.isPending
                ? "Plan oluşturuluyor..."
                : mevcutIdx + 1 >= (sorular?.length ?? 0)
                  ? "Sonuçları Gör"
                  : "Sonraki Soru"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
