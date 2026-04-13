"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "../../lib/trpc";

// ======================== TIPLER ========================

type Asama = "konu" | "pekistirme" | "karar";
type HataKategori = "DIKKATSIZLIK" | "KAVRAM_EKSIK" | "KONU_ATLAMA" | "ZAMAN_BASKISI" | "BILINMIYOR";

interface SoruSonuc {
  soruId: string;
  attemptId: string | null;
  dogruMu: boolean;
  sure: number;
  hataKategori: HataKategori | null;
}

const KONU_SURE_DK = 25;

const HATA_ETIKET: Record<HataKategori, string> = {
  DIKKATSIZLIK: "Dikkatsizlik",
  KAVRAM_EKSIK: "Kavram Eksikliği",
  KONU_ATLAMA: "Konu Atladım",
  ZAMAN_BASKISI: "Zaman Baskısı",
  BILINMIYOR: "Bilmiyorum",
};

const HATA_RENK: Record<HataKategori, string> = {
  DIKKATSIZLIK: "bg-yellow-50 border-yellow-200 text-yellow-700",
  KAVRAM_EKSIK: "bg-red-50 border-red-200 text-red-700",
  KONU_ATLAMA: "bg-orange-50 border-orange-200 text-orange-700",
  ZAMAN_BASKISI: "bg-purple-50 border-purple-200 text-purple-700",
  BILINMIYOR: "bg-gray-50 border-gray-200 text-gray-600",
};

const ONCELIK_ETIKET: Record<string, { label: string; renk: string }> = {
  son_hafta_yanlis: { label: "Son yanlış", renk: "bg-red-100 text-red-700" },
  eski_yanlis: { label: "Önceki yanlış", renk: "bg-orange-100 text-orange-700" },
  hiç_cozulmemis: { label: "Yeni soru", renk: "bg-blue-100 text-blue-700" },
  eski_dogru: { label: "Tekrar et", renk: "bg-gray-100 text-gray-600" },
  son_hafta_dogru: { label: "Yakın doğru", renk: "bg-green-100 text-green-700" },
};

// ======================== ANA BİLEŞEN ========================

function CalisPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams.get("topicId") ?? "";

  const [asama, setAsama] = useState<Asama>("konu");
  const [kalanSn, setKalanSn] = useState(KONU_SURE_DK * 60);
  const [soruIdx, setSoruIdx] = useState(0);
  const [secilenSik, setSecilenSik] = useState<number | null>(null);
  const [cevapSonuc, setCevapSonuc] = useState<{
    dogruMu: boolean; aciklama: string; dogruSik: number; attemptId?: string;
  } | null>(null);
  const [soruSonuclari, setSoruSonuclari] = useState<SoruSonuc[]>([]);
  const [hataKategoriSecimi, setHataKategoriSecimi] = useState<string | null>(null); // attemptId
  const baslangicRef = useRef(Date.now());
  const soruBaslangicRef = useRef(Date.now());

  // tRPC sorguları
  const { data, isLoading, error } = trpc.learning.getTopicDetail.useQuery(
    { topicId }, { enabled: !!topicId }
  );
  const { data: adaptifData, isLoading: adaptifLoading } = trpc.learning.getAdaptiveQuestions.useQuery(
    { topicId, adet: 10 }, { enabled: !!topicId && asama === "pekistirme" }
  );
  const { data: gecmis } = trpc.learning.getTopicSessionHistory.useQuery(
    { topicId }, { enabled: !!topicId }
  );

  // AI sorgular
  const { data: personalizedLesson, isLoading: lessonLoading } = trpc.learning.getPersonalizedLesson.useQuery(
    { topicId }, { enabled: !!topicId && asama === "konu" }
  );
  const { data: coachComment } = trpc.learning.getCoachComment.useQuery(
    undefined, { enabled: asama === "karar" }
  );

  // Mutasyonlar
  const submitMutation = trpc.assessment.submitAnswer.useMutation();
  const recordMutation = trpc.learning.recordStudyTime.useMutation();
  const updateMasteryMutation = trpc.learning.updateMasteryFromReview.useMutation();
  const kategorizeHataMutation = trpc.learning.kategorizeHata.useMutation();
  const [aiAnalysis, setAiAnalysis] = useState<{ aciklama: string; hataKategorisi: string; oneri: string } | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

  const sorular = adaptifData?.sorular ?? [];

  // 25dk geri sayım
  useEffect(() => {
    if (asama !== "konu") return;
    const t = setInterval(() => {
      setKalanSn(s => {
        if (s <= 1) { gecPekistirme(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asama]);

  // Pekiştirme başlayınca soru sayacını sıfırla
  useEffect(() => {
    if (asama === "pekistirme") {
      soruBaslangicRef.current = Date.now();
    }
  }, [asama]);

  const gecPekistirme = useCallback(() => {
    const gecenDk = Math.max(1, Math.round((Date.now() - baslangicRef.current) / 60000));
    recordMutation.mutate({ sureDk: gecenDk, topicId, tip: "KONU" });
    baslangicRef.current = Date.now();
    setAsama("pekistirme");
  }, [topicId, recordMutation]);

  const cevapla = async () => {
    if (secilenSik === null || !sorular[soruIdx]) return;
    const soru = sorular[soruIdx];
    const sureMs = Date.now() - soruBaslangicRef.current;

    const sonuc = await submitMutation.mutateAsync({
      questionId: soru.id,
      secilenSik,
      sureMs,
      baglam: "REVIEW",
    });

    setCevapSonuc({ ...sonuc, attemptId: sonuc.attemptId });

    const yeniSonuc: SoruSonuc = {
      soruId: soru.id,
      attemptId: sonuc.attemptId ?? null,
      dogruMu: sonuc.dogruMu,
      sure: sureMs,
      hataKategori: null,
    };
    setSoruSonuclari(prev => [...prev, yeniSonuc]);

    if (!sonuc.dogruMu) {
      setHataKategoriSecimi(`${soruIdx}`);
      // AI analiz başlat
      if (sonuc.attemptId) {
        setAiAnalysisLoading(true);
        setAiAnalysis(null);
      }
    }

    soruBaslangicRef.current = Date.now();
  };

  const hataKategoriSec = (kategori: HataKategori) => {
    setSoruSonuclari(prev => prev.map((s, i) =>
      i === prev.length - 1 ? { ...s, hataKategori: kategori } : s
    ));
    setHataKategoriSecimi(null);
  };

  const sonraki = () => {
    if (soruIdx + 1 >= sorular.length) {
      // Pekiştirme bitti
      const gecenDk = Math.max(1, Math.round((Date.now() - baslangicRef.current) / 60000));
      recordMutation.mutate({ sureDk: gecenDk, topicId, tip: "SORU" });
      updateMasteryMutation.mutate({ topicId }); // mastery güncelle
      setAsama("karar");
    } else {
      setSoruIdx(i => i + 1);
      setSecilenSik(null);
      setCevapSonuc(null);
      setHataKategoriSecimi(null);
    }
  };

  const yeniKonuyaGec = () => {
    router.push("/konular");
  };

  const tekrarEt = () => {
    baslangicRef.current = Date.now();
    setSoruIdx(0);
    setSecilenSik(null);
    setCevapSonuc(null);
    setSoruSonuclari([]);
    setHataKategoriSecimi(null);
    setKalanSn(KONU_SURE_DK * 60);
    setAsama("konu");
  };

  // ======================== GUARD ========================

  if (!topicId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-4xl mb-3">📚</p>
          <h2 className="text-xl font-bold mb-2">Konu seçilmedi</h2>
          <Link href="/konular" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700">
            Konulara Git
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) return <YukleniyorSpinner />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-2xl mb-2">Konu bulunamadı</p>
          <Link href="/konular" className="text-blue-600 hover:underline">← Konulara dön</Link>
        </div>
      </div>
    );
  }

  const topic = data.topic;
  const dk = Math.floor(kalanSn / 60);
  const sn = kalanSn % 60;
  const ilerleme = Math.round(((KONU_SURE_DK * 60 - kalanSn) / (KONU_SURE_DK * 60)) * 100);
  const masterySkoru = adaptifData?.masterySkoru ?? data.mastery?.skor ?? null;

  // ======================== AŞAMA 1: KONU ========================
  if (asama === "konu") {
    return (
      <div className="min-h-screen bg-indigo-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/konular" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              ← Konular
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-indigo-100 px-3 py-1.5 rounded-full">
                <div className={`w-2 h-2 rounded-full ${kalanSn <= 300 ? "bg-red-500 animate-pulse" : "bg-indigo-500"}`} />
                <span className="text-sm font-mono font-semibold text-indigo-800">
                  {String(dk).padStart(2, "0")}:{String(sn).padStart(2, "0")}
                </span>
              </div>
              <span className="text-xs text-gray-400">konu çalışması</span>
            </div>
          </div>

          {/* Progress */}
          <div className="w-full bg-indigo-200 rounded-full h-1.5 mb-5">
            <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${ilerleme}%` }} />
          </div>

          {/* Geçmiş oturum bilgisi */}
          {gecmis && gecmis.toplamOturum > 0 && (
            <div className="bg-white/70 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
              <span className="text-lg">{gecmis.trend === "YUKSELIYOR" ? "📈" : gecmis.trend === "DUSUYOR" ? "📉" : "📊"}</span>
              <div>
                <p className="text-xs font-medium text-gray-700">
                  Bu konuyu daha önce {gecmis.toplamOturum} kez çalıştın
                </p>
                {gecmis.oturumlar.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Son oturum: %{gecmis.oturumlar[gecmis.oturumlar.length - 1].oran} başarı
                    {gecmis.trend === "YUKSELIYOR" && " · iyileşiyor!"}
                    {gecmis.trend === "DUSUYOR" && " · dikkat et!"}
                  </p>
                )}
              </div>
              {masterySkoru !== null && masterySkoru !== undefined && (
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-400">Ustalık</p>
                  <p className={`text-lg font-bold ${masterySkoru >= 70 ? "text-green-600" : masterySkoru >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                    %{masterySkoru}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Konu kartı */}
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                {topic.ders}
              </span>
              <span className="text-xs text-gray-400">Koç Döngüsü</span>
              {(gecmis?.toplamOturum ?? 0) > 0 && (
                <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                  Tekrar
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{topic.isim}</h1>

            {/* Öncelik: 1) Kişiselleştirilmiş AI anlatım 2) Statik AI anlatım 3) Manuel içerik 4) Boş mesaj */}
            {lessonLoading ? (
              <div className="bg-indigo-50 rounded-xl p-6 text-center">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-indigo-600 font-medium">Sana özel anlatım hazırlanıyor...</p>
              </div>
            ) : personalizedLesson?.anlatim ? (
              <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {personalizedLesson.anlatim}
                {personalizedLesson.ragKaynak && (
                  <p className="text-xs text-indigo-400 mt-3 italic">MEB kitap içeriğinden desteklendi</p>
                )}
              </div>
            ) : (topic as { aiAnlatim?: string | null }).aiAnlatim ? (
              <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {(topic as { aiAnlatim?: string | null }).aiAnlatim}
              </div>
            ) : topic.dersIcerigi ? (
              <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {topic.dersIcerigi}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                <p className="text-4xl mb-2">📖</p>
                <p className="font-medium">Bu konu için içerik henüz hazırlanmadı.</p>
                <p className="text-sm mt-1">Ders kitabından <strong>{topic.isim}</strong> konusunu çalış, sonra soruları çöz.</p>
                {(topic.children?.length ?? 0) > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Alt konular:</p>
                    <ul className="space-y-1">
                      {(topic.children ?? []).map((c: { id: string; isim: string }) => (
                        <li key={c.id} className="text-sm text-gray-600">• {c.isim}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {topic.questions.length > 0 ? `${topic.questions.length} soru seni bekliyor` : "Soru çözmeye hazır"}
            </p>
            <button
              onClick={gecPekistirme}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Pekiştirmeye Geç →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======================== AŞAMA 2: PEKİŞTİRME ========================
  if (asama === "pekistirme") {
    if (adaptifLoading) return <YukleniyorSpinner />;

    if (sorular.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
            <p className="text-4xl mb-3">✅</p>
            <h2 className="text-xl font-bold mb-2">Bu konuda soru yok</h2>
            <p className="text-gray-500 mb-5">Konu çalışması tamamlandı!</p>
            <button onClick={() => setAsama("karar")} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium">
              Devam Et
            </button>
          </div>
        </div>
      );
    }

    const soru = sorular[soruIdx];
    const oncelikBilgi = soru.oncelik ? ONCELIK_ETIKET[soru.oncelik] : null;
    const ilerlemePekistirme = Math.round(((soruIdx) / sorular.length) * 100);
    const dogru = soruSonuclari.filter(s => s.dogruMu).length;
    const yanlis = soruSonuclari.filter(s => !s.dogruMu).length;

    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setAsama("konu")} className="text-sm text-gray-500 hover:text-gray-700">
              ← Konuya Dön
            </button>
            <div className="flex items-center gap-3">
              {dogru > 0 && <span className="text-sm text-green-600 font-medium">✓ {dogru}</span>}
              {yanlis > 0 && <span className="text-sm text-red-500 font-medium">✗ {yanlis}</span>}
              <span className="text-sm text-gray-400">{soruIdx + 1}/{sorular.length}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-5">
            <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${ilerlemePekistirme}%` }} />
          </div>

          {/* Adaptif Öncelik Etiketi */}
          <div className="flex items-center gap-2 mb-3">
            {oncelikBilgi && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${oncelikBilgi.renk}`}>
                {oncelikBilgi.label}
              </span>
            )}
            <span className="text-xs text-gray-400">{topic.isim}</span>
            <span className="ml-auto text-xs text-gray-400">
              Zorluk: {"⭐".repeat(soru.zorluk)}
            </span>
          </div>

          {/* Soru Kartı */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
            <p className="text-base font-medium text-gray-900 mb-6 leading-relaxed">{soru.soruMetni}</p>
            <div className="space-y-2.5">
              {soru.siklar.map((sik: string, idx: number) => {
                const harf = String.fromCharCode(65 + idx);
                let stil = "border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer";
                if (cevapSonuc) {
                  if (idx === cevapSonuc.dogruSik) stil = "border-green-500 bg-green-50 cursor-default";
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
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${stil}`}
                  >
                    <span className="font-semibold text-gray-400 mr-2.5">{harf})</span>
                    <span className="text-gray-800 text-sm">{sik}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cevap Feedback */}
          {cevapSonuc && (
            <div className={`rounded-xl p-4 mb-3 border ${cevapSonuc.dogruMu ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
              <p className={`text-sm font-semibold mb-1 ${cevapSonuc.dogruMu ? "text-green-800" : "text-orange-800"}`}>
                {cevapSonuc.dogruMu ? "✓ Doğru!" : "✗ Yanlış — Açıklama:"}
              </p>
              <p className={`text-sm leading-relaxed ${cevapSonuc.dogruMu ? "text-green-700" : "text-orange-700"}`}>
                {cevapSonuc.aciklama}
              </p>
              {/* AI Detaylı Analiz */}
              {!cevapSonuc.dogruMu && aiAnalysisLoading && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-xs text-orange-500">AI analiz yapılıyor...</p>
                </div>
              )}
              {!cevapSonuc.dogruMu && aiAnalysis && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-xs font-semibold text-orange-800 mb-1">AI Analiz:</p>
                  <p className="text-xs text-orange-700">{aiAnalysis.aciklama}</p>
                  {aiAnalysis.oneri && (
                    <p className="text-xs text-orange-600 mt-1 italic">{aiAnalysis.oneri}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Hata Kategori Seçimi */}
          {hataKategoriSecimi !== null && cevapSonuc && !cevapSonuc.dogruMu && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Bu soruyu neden yanlış yaptın?</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(HATA_ETIKET) as HataKategori[]).map(k => (
                  <button
                    key={k}
                    onClick={() => hataKategoriSec(k)}
                    className={`text-xs px-3 py-2 rounded-lg border text-left transition-all hover:opacity-80 ${HATA_RENK[k]}`}
                  >
                    {HATA_ETIKET[k]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aksiyon Butonları */}
          <div className="flex justify-between items-center">
            <div>
              {cevapSonuc && hataKategoriSecimi === null && !cevapSonuc.dogruMu && (
                <button
                  onClick={() => setHataKategoriSecimi(`${soruIdx}`)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Neden yanlış yaptım?
                </button>
              )}
            </div>
            {!cevapSonuc ? (
              <button
                onClick={cevapla}
                disabled={secilenSik === null || submitMutation.isPending}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {submitMutation.isPending ? "..." : "Cevapla"}
              </button>
            ) : (
              <button
                onClick={sonraki}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all"
              >
                {soruIdx + 1 >= sorular.length ? "Sonucu Gör →" : "Sonraki →"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ======================== AŞAMA 3: KARAR ========================
  const dogru = soruSonuclari.filter(s => s.dogruMu).length;
  const yuzde = sorular.length > 0 ? Math.round((dogru / sorular.length) * 100) : 0;
  const yanlisSoruIds = soruSonuclari.filter(s => !s.dogruMu).map(s => s.soruId);

  // Hata kategorisi analizi
  const hataAnalizi: Partial<Record<HataKategori, number>> = {};
  soruSonuclari.filter(s => !s.dogruMu && s.hataKategori).forEach(s => {
    if (s.hataKategori) hataAnalizi[s.hataKategori] = (hataAnalizi[s.hataKategori] ?? 0) + 1;
  });
  const enSikHata = Object.entries(hataAnalizi).sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Skor Kartı */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-5">
          <p className="text-5xl mb-4">
            {yuzde >= 80 ? "🏆" : yuzde >= 60 ? "🎉" : yuzde >= 40 ? "💪" : "📚"}
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{topic.isim}</h2>
          <p className="text-gray-400 text-sm mb-4">Pekiştirme tamamlandı</p>

          {sorular.length > 0 && (
            <>
              <div className={`text-6xl font-bold my-4 ${yuzde >= 70 ? "text-green-600" : yuzde >= 40 ? "text-yellow-500" : "text-red-500"}`}>
                %{yuzde}
              </div>
              <p className="text-gray-500 text-sm">{dogru}/{sorular.length} doğru</p>

              {/* Mini progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 mt-3 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${yuzde >= 70 ? "bg-green-500" : yuzde >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${yuzde}%` }}
                />
              </div>
            </>
          )}

          {/* Hata Analizi */}
          {enSikHata && (
            <div className={`mt-4 rounded-xl p-3 border text-sm ${HATA_RENK[enSikHata[0] as HataKategori]}`}>
              <p className="font-medium">En sık hata: {HATA_ETIKET[enSikHata[0] as HataKategori]}</p>
              <p className="text-xs mt-0.5 opacity-80">
                {enSikHata[0] === "DIKKATSIZLIK" && "Soruları dikkatli oku, acele etme."}
                {enSikHata[0] === "KAVRAM_EKSIK" && "Bu konuyu tekrar anlat bölümünden çalış."}
                {enSikHata[0] === "KONU_ATLAMA" && "Temel konuları tamamladığından emin ol."}
                {enSikHata[0] === "ZAMAN_BASKISI" && "Daha fazla pratik yap, hız kazanırsın."}
              </p>
            </div>
          )}

          {yanlisSoruIds.length > 0 && (
            <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-xs text-orange-700">
                {yanlisSoruIds.length} yanlış cevap çalışma planına eklendi.
              </p>
            </div>
          )}
        </div>

        {/* Önceki Oturumlarla Karşılaştırma */}
        {gecmis && gecmis.oturumlar.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">Önceki Oturumlar</p>
            <div className="flex items-end gap-1 h-12">
              {gecmis.oturumlar.map((o: { oran: number; tarih: string; dogru: number; toplam: number }, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-t transition-all ${i === gecmis.oturumlar.length - 1 ? "bg-blue-500" : "bg-gray-200"}`}
                    style={{ height: `${Math.max(4, o.oran / 100 * 40)}px` }}
                  />
                  <span className="text-[9px] text-gray-400">{o.oran}%</span>
                </div>
              ))}
              <div className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t bg-green-400"
                  style={{ height: `${Math.max(4, yuzde / 100 * 40)}px` }}
                />
                <span className="text-[9px] text-green-600 font-bold">{yuzde}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Koç Yorumu */}
        {coachComment && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-purple-800 mb-1">AI Koç Yorumu</p>
            <p className="text-sm text-purple-700">{coachComment.yorum}</p>
          </div>
        )}

        {/* Karar Butonları */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={tekrarEt}
            className="p-5 rounded-2xl border-2 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-all text-left active:scale-95"
          >
            <span className="text-2xl block mb-2">↺</span>
            <p className="font-bold text-indigo-900">Bu Konuyu Tekrar Et</p>
            <p className="text-indigo-600 text-sm">Adaptif sorularla yeniden</p>
          </button>

          <button
            onClick={yeniKonuyaGec}
            disabled={false}
            className="p-5 rounded-2xl border-2 border-green-300 bg-green-50 hover:bg-green-100 transition-all text-left disabled:opacity-50 active:scale-95"
          >
            <span className="text-2xl block mb-2">→</span>
            <p className="font-bold text-green-900">Yeni Konuya Geç</p>
            <p className="text-green-600 text-sm">Konu seçimine dön</p>
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            Dashboard&apos;a dön
          </Link>
        </div>
      </div>
    </div>
  );
}

function YukleniyorSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function CalisPage() {
  return (
    <Suspense fallback={<YukleniyorSpinner />}>
      <CalisPageInner />
    </Suspense>
  );
}
