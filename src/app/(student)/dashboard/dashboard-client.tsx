"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "../../../lib/trpc";
import { createClient } from "../../../lib/supabase/client";

const DERS_RENK: Record<string, string> = {
  MATEMATIK: "bg-blue-500", FEN: "bg-green-500", TURKCE: "bg-red-500",
  SOSYAL: "bg-yellow-500", INGILIZCE: "bg-purple-500", DIN: "bg-orange-500",
};
const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", INGILIZCE: "İngilizce", DIN: "Din Kültürü",
};

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
}

export default function DashboardClient({ userName }: Props) {
  const router = useRouter();
  const { data: masteries, isLoading: masteriesLoading } = trpc.assessment.getMasteries.useQuery();
  const { data: profile } = trpc.learning.getProfile.useQuery();

  const cikisYap = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Ders bazinda gruplama
  const dersBazinda = masteries?.reduce((acc, m) => {
    const ders = m.topic.ders;
    if (!acc[ders]) acc[ders] = [];
    acc[ders].push(m);
    return acc;
  }, {} as Record<string, typeof masteries>) ?? {};

  const genelOrtalama = masteries && masteries.length > 0
    ? Math.round(masteries.reduce((s, m) => s + m.skor, 0) / masteries.length)
    : null;

  // LGS'ye kalan gun
  const lgs = new Date("2026-06-07");
  const kalanGun = Math.max(0, Math.ceil((lgs.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const streak = profile?.currentStreak ?? 0;
  const hedefOkul = profile?.targetSchool;
  const tahminiTarih = profile?.estimatedReadyDate;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">LGS AI Koçu</Link>
          <div className="flex items-center gap-4">
            {streak > 0 && (
              <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-medium">
                🔥 {streak} gün seri
              </span>
            )}
            <span className="text-sm text-gray-500">{userName}</span>
            <button onClick={cikisYap} className="text-sm text-gray-400 hover:text-gray-700">Çıkış</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {/* Hedef okul banner */}
        {hedefOkul ? (
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">Hedef Okul</p>
                <p className="text-xl font-bold">{hedefOkul.isim}</p>
                <p className="text-sm text-blue-200">{hedefOkul.sehir} · Taban: {hedefOkul.minPuan} puan</p>
              </div>
              <div className="text-right">
                {tahminiTarih && (
                  <>
                    <p className="text-3xl font-bold">
                      {Math.max(0, Math.ceil((new Date(tahminiTarih).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                    </p>
                    <p className="text-sm text-blue-200">tahmini gün</p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/hedef-okul"
            className="block bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-dashed border-indigo-300 rounded-2xl p-6 mb-6 hover:border-indigo-400 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🎯</span>
              <div>
                <p className="font-semibold text-indigo-900">Hedef Okul Belirle</p>
                <p className="text-sm text-indigo-600">Hedef okulunu seç, sana özel yol haritası oluşturalım</p>
              </div>
              <span className="ml-auto text-indigo-400 text-xl">→</span>
            </div>
          </Link>
        )}

        {/* Ozet kartlari */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">LGS&apos;ye Kalan</p>
            <p className="text-2xl font-bold text-blue-600">{kalanGun}</p>
            <p className="text-xs text-gray-400">gün</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Genel Başarı</p>
            <p className="text-2xl font-bold text-green-600">{genelOrtalama !== null ? `%${genelOrtalama}` : "—"}</p>
            <p className="text-xs text-gray-400">ortalama</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Seri</p>
            <p className="text-2xl font-bold text-orange-600">{streak > 0 ? `${streak} 🔥` : "—"}</p>
            <p className="text-xs text-gray-400">ardışık gün</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Konu</p>
            <p className="text-2xl font-bold text-purple-600">{masteries?.length ?? "—"}</p>
            <p className="text-xs text-gray-400">takip edilen</p>
          </div>
        </div>

        {/* Seviye belirleme CTA */}
        {!masteriesLoading && (!masteries || masteries.length === 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Seviyeni henüz belirlemedin</h3>
              <p className="text-sm text-blue-700 mt-1">Seviyeni belirle, kişisel çalışma planın oluşturulsun.</p>
            </div>
            <Link href="/diagnostic" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap">
              Seviye Belirle
            </Link>
          </div>
        )}

        {/* Hizli aksiyonlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/session" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all">
            <span className="text-2xl block mb-2">📝</span>
            <p className="font-semibold text-gray-900">Günlük Çalışma</p>
            <p className="text-sm text-gray-500">Planına göre 15 soru çöz</p>
          </Link>
          <Link href="/deneme" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-red-300 transition-all">
            <span className="text-2xl block mb-2">⏱️</span>
            <p className="font-semibold text-gray-900">Deneme Sınavı</p>
            <p className="text-sm text-gray-500">LGS formatında deneme</p>
          </Link>
          <Link href="/konular" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-green-300 transition-all">
            <span className="text-2xl block mb-2">📚</span>
            <p className="font-semibold text-gray-900">Konulara Göz At</p>
            <p className="text-sm text-gray-500">Serbest mod — istediğin konuyu çalış</p>
          </Link>
        </div>

        {/* Konu ustaligi */}
        {masteriesLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                <div className="space-y-3">{[1, 2].map((j) => <div key={j} className="h-3 bg-gray-100 rounded" />)}</div>
              </div>
            ))}
          </div>
        ) : masteries && masteries.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold mb-4">Konu Ustalığı</h2>
            <div className="space-y-4">
              {Object.entries(dersBazinda).map(([ders, konular]) => (
                <div key={ders} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${DERS_RENK[ders] ?? "bg-gray-400"}`} />
                    <h3 className="font-semibold text-sm">{DERS_ISIM[ders] ?? ders}</h3>
                  </div>
                  <div className="space-y-2">
                    {konular.sort((a, b) => a.skor - b.skor).map((m) => (
                      <div key={m.topicId} className="flex items-center gap-3">
                        <span className="w-40 text-sm text-gray-600 truncate">{m.topic.isim}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${m.skor >= 70 ? "bg-green-500" : m.skor >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${m.skor}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-8 text-right text-gray-600">%{Math.round(m.skor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
