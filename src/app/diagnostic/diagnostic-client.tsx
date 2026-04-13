"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "../../lib/trpc";
import { createClient } from "../../lib/supabase/client";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik",
  FEN: "Fen Bilimleri",
  TURKCE: "Türkçe",
};

const DERS_RENK: Record<string, string> = {
  MATEMATIK: "border-blue-400 bg-blue-50 hover:bg-blue-100",
  FEN: "border-green-400 bg-green-50 hover:bg-green-100",
  TURKCE: "border-red-400 bg-red-50 hover:bg-red-100",
};

const DERS_IKON: Record<string, string> = {
  MATEMATIK: "📐",
  FEN: "🔬",
  TURKCE: "📖",
};

interface Soru {
  id: string;
  ders: string;
  konuIsim: string;
  soruMetni: string;
  siklar: string[];
  dogruSik: number;
  aciklama: string;
  zorluk: number;
}

interface Props {
  sorular: Soru[];
  secilenDers: string | null;
  modSecim: boolean;
}

interface CevapSonuc {
  dogruMu: boolean;
  aciklama: string;
  dogruSik: number;
}

export default function DiagnosticClient({ sorular, secilenDers, modSecim }: Props) {
  const router = useRouter();
  const [mevcutIdx, setMevcutIdx] = useState(0);
  const [secilenSik, setSecilenSik] = useState<number | null>(null);
  const [cevapSonuc, setCevapSonuc] = useState<CevapSonuc | null>(null);
  const [dogru, setDogru] = useState(0);
  const [bitmis, setBitmis] = useState(false);
  const [dersSkorlar, setDersSkorlar] = useState<Record<string, { dogru: number; toplam: number }>>({});
  const [cevaplar, setCevaplar] = useState<Array<{ questionId: string; secilenSik: number; dogruMu: boolean; ders: string; konuIsim: string }>>([]);
  const [girisDurumu, setGirisDurumu] = useState<"kontrol" | "giris" | "misafir">("kontrol");
  const [planOlusturuluyor, setPlanOlusturuluyor] = useState(false);
  const transferMutation = trpc.learning.transferDiagnostic.useMutation();

  const soru = sorular[mevcutIdx];

  // Test bitince: localStorage'a kaydet + auth durumunu kontrol et
  useEffect(() => {
    if (!bitmis || cevaplar.length === 0) return;

    localStorage.setItem("lgs_diagnostic_result", JSON.stringify({
      cevaplar,
      dersSkorlar,
      tarih: new Date().toISOString(),
      toplamDogru: dogru,
      toplamSoru: sorular.length,
    }));

    // Kullanici zaten giris yapmis mi?
    createClient().auth.getUser().then(({ data }) => {
      setGirisDurumu(data.user ? "giris" : "misafir");
    });
  }, [bitmis, cevaplar, dersSkorlar, dogru, sorular.length]);

  const planOlustur = async () => {
    setPlanOlusturuluyor(true);
    try {
      await transferMutation.mutateAsync({ cevaplar });
      localStorage.removeItem("lgs_diagnostic_result");
      router.push("/dashboard");
    } catch (err) {
      console.error("Plan oluşturulamadı:", err);
      setPlanOlusturuluyor(false);
    }
  };

  // ==================== DERS SECIM EKRANI ====================
  if (modSecim) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Ana Sayfa
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
              Nasıl çalışmak istersin?
            </h1>
            <p className="text-gray-500">Tek ders veya genel LGS hazırlığı seç</p>
          </div>

          {/* LGS Genel */}
          <Link
            href="/diagnostic?ders=genel"
            className="block w-full mb-6 p-5 rounded-2xl border-2 border-blue-500 bg-blue-600 text-white hover:bg-blue-700 transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🎯</span>
              <div>
                <p className="font-bold text-lg">LGS Genel Hazırlık</p>
                <p className="text-blue-200 text-sm">Tüm derslerden dengeli soru, seviyeni belirle</p>
              </div>
              <span className="ml-auto text-2xl">→</span>
            </div>
          </Link>

          {/* Ders secimi */}
          <p className="text-sm font-medium text-gray-500 mb-3">veya tek bir ders seç:</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DERS_ISIM).map(([key, isim]) => (
              <Link
                key={key}
                href={`/diagnostic?ders=${key}`}
                className={`block p-4 rounded-xl border-2 transition-all text-left ${DERS_RENK[key]}`}
              >
                <span className="text-2xl block mb-1">{DERS_IKON[key]}</span>
                <span className="font-semibold text-gray-800">{isim}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== SORU YOK ====================
  if (sorular.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <p className="text-4xl mb-3">📭</p>
          <h2 className="text-xl font-bold mb-2">Bu ders için henüz soru yok</h2>
          <p className="text-gray-500 mb-5 text-sm">Yakında eklenecek. Başka bir ders seçebilirsin.</p>
          <Link
            href="/diagnostic"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700"
          >
            Ders Seçimine Dön
          </Link>
        </div>
      </div>
    );
  }

  // ==================== SONUC EKRANI ====================
  if (bitmis) {
    const yuzde = Math.round((dogru / sorular.length) * 100);
    const seviye = yuzde >= 80 ? "İleri Seviye" : yuzde >= 50 ? "Orta Seviye" : "Başlangıç Seviye";
    const seviyeRenk = yuzde >= 80 ? "text-green-600" : yuzde >= 50 ? "text-yellow-600" : "text-red-600";

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-5">
            <p className="text-4xl mb-3">{yuzde >= 70 ? "🎉" : yuzde >= 40 ? "💪" : "📚"}</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {secilenDers ? `${DERS_ISIM[secilenDers]} Testi Bitti!` : "Seviye Belirleme Bitti!"}
            </h1>
            <div className="my-6">
              <div className={`text-6xl font-bold ${seviyeRenk}`}>%{yuzde}</div>
              <p className="text-gray-500 mt-1">{dogru}/{sorular.length} doğru</p>
            </div>
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 ${seviyeRenk}`}>
              {seviye}
            </span>
          </div>

          {/* Ders bazinda detay */}
          {Object.keys(dersSkorlar).length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
              <h2 className="font-semibold mb-4">Ders Bazında Sonuç</h2>
              <div className="space-y-3">
                {Object.entries(dersSkorlar).map(([ders, { dogru: d, toplam }]) => {
                  const pct = Math.round((d / toplam) * 100);
                  return (
                    <div key={ders} className="flex items-center gap-3">
                      <span className="text-lg">{DERS_IKON[ders]}</span>
                      <span className="w-28 text-sm font-medium text-gray-700">{DERS_ISIM[ders]}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">%{pct}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Zayif konular ozeti */}
          {(() => {
            const zayiflar = Object.entries(dersSkorlar)
              .filter(([, v]) => Math.round((v.dogru / v.toplam) * 100) < 70)
              .map(([ders]) => DERS_ISIM[ders] ?? ders);
            if (zayiflar.length > 0) {
              return (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
                  <p className="text-sm font-semibold text-orange-800 mb-1">Geliştirilmesi gereken dersler:</p>
                  <p className="text-sm text-orange-700">{zayiflar.join(", ")}</p>
                  <p className="text-xs text-orange-500 mt-2">Kayıt olduğunda bu konulara özel çalışma planı oluşturulacak.</p>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex flex-col gap-3">
            {girisDurumu === "giris" ? (
              <button
                onClick={planOlustur}
                disabled={planOlusturuluyor}
                className="block w-full text-center bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-lg disabled:opacity-50"
              >
                {planOlusturuluyor ? "Plan oluşturuluyor..." : "Çalışma Planımı Oluştur →"}
              </button>
            ) : girisDurumu === "misafir" ? (
              <>
                <Link
                  href="/auth/register"
                  className="block text-center bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-lg"
                >
                  Kayıt Ol → Çalışma Planını Al
                </Link>
                <div className="flex gap-3">
                  <Link
                    href="/diagnostic"
                    className="flex-1 text-center border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Tekrar Dene
                  </Link>
                  <Link
                    href="/auth/login"
                    className="flex-1 text-center border border-blue-300 text-blue-700 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    Zaten Üyeyim
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 text-sm py-3">Kontrol ediliyor...</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== TEST EKRANI ====================
  const ilerleme = Math.round(((mevcutIdx + 1) / sorular.length) * 100);

  const cevapla = () => {
    if (secilenSik === null || !soru) return;
    const dogruMu = secilenSik === soru.dogruSik;
    if (dogruMu) setDogru((d) => d + 1);

    // Cevabi kaydet
    setCevaplar((prev) => [...prev, {
      questionId: soru.id,
      secilenSik,
      dogruMu,
      ders: soru.ders,
      konuIsim: soru.konuIsim,
    }]);

    setDersSkorlar((prev) => {
      const mevcut = prev[soru.ders] ?? { dogru: 0, toplam: 0 };
      return {
        ...prev,
        [soru.ders]: {
          dogru: mevcut.dogru + (dogruMu ? 1 : 0),
          toplam: mevcut.toplam + 1,
        },
      };
    });

    setCevapSonuc({ dogruMu, aciklama: soru.aciklama, dogruSik: soru.dogruSik });
  };

  const sonraki = () => {
    if (mevcutIdx + 1 >= sorular.length) {
      setBitmis(true);
    } else {
      setMevcutIdx((i) => i + 1);
      setSecilenSik(null);
      setCevapSonuc(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Üst bar */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/diagnostic" className="text-sm text-gray-500 hover:text-gray-700">
            ← Çık
          </Link>
          <span className="text-sm font-medium text-gray-600">
            {mevcutIdx + 1} / {sorular.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${ilerleme}%` }}
          />
        </div>

        {/* Ders & konu etiketi */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{DERS_IKON[soru.ders] ?? "📝"}</span>
          <span className="text-sm text-gray-500">
            {DERS_ISIM[soru.ders]} — {soru.konuIsim}
          </span>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
            soru.zorluk === 1 ? "bg-green-100 text-green-700" :
            soru.zorluk === 2 ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}>
            {soru.zorluk === 1 ? "Kolay" : soru.zorluk === 2 ? "Orta" : "Zor"}
          </span>
        </div>

        {/* Soru kartı */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
          <p className="text-[17px] font-medium text-gray-900 mb-6 leading-relaxed">
            {soru.soruMetni}
          </p>

          <div className="space-y-3">
            {soru.siklar.map((sik, idx) => {
              const harf = String.fromCharCode(65 + idx);
              let stil = "border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer";

              if (cevapSonuc) {
                if (idx === soru.dogruSik) stil = "border-green-500 bg-green-50 cursor-default";
                else if (idx === secilenSik) stil = "border-red-400 bg-red-50 cursor-default";
                else stil = "border-gray-100 opacity-40 cursor-default";
              } else if (secilenSik === idx) {
                stil = "border-blue-500 bg-blue-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => !cevapSonuc && setSecilenSik(idx)}
                  disabled={!!cevapSonuc}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${stil}`}
                >
                  <span className="font-semibold text-gray-400 mr-3">{harf})</span>
                  <span className="text-gray-800">{sik}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Açıklama */}
        {cevapSonuc && (
          <div className={`rounded-xl p-4 mb-4 border ${
            cevapSonuc.dogruMu
              ? "bg-green-50 border-green-200"
              : "bg-orange-50 border-orange-200"
          }`}>
            <p className={`text-sm font-semibold mb-1 ${cevapSonuc.dogruMu ? "text-green-800" : "text-orange-800"}`}>
              {cevapSonuc.dogruMu ? "✓ Doğru!" : "✗ Yanlış — Açıklama:"}
            </p>
            <p className={`text-sm leading-relaxed ${cevapSonuc.dogruMu ? "text-green-700" : "text-orange-700"}`}>
              {cevapSonuc.aciklama}
            </p>
          </div>
        )}

        {/* Aksiyon butonu */}
        <div className="flex justify-end">
          {!cevapSonuc ? (
            <button
              onClick={cevapla}
              disabled={secilenSik === null}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cevapla
            </button>
          ) : (
            <button
              onClick={sonraki}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              {mevcutIdx + 1 >= sorular.length ? "Sonuçları Gör →" : "Sonraki →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
