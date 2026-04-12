"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "../../../lib/trpc";
import { createClient } from "../../../lib/supabase/client";

const DERS_RENK: Record<string, string> = {
  MATEMATIK: "bg-blue-500",
  FEN: "bg-green-500",
  TURKCE: "bg-red-500",
  SOSYAL: "bg-yellow-500",
  INGILIZCE: "bg-purple-500",
  DIN: "bg-orange-500",
};

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik",
  FEN: "Fen Bilimleri",
  TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler",
  INGILIZCE: "İngilizce",
  DIN: "Din Kültürü",
};

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
}

export default function DashboardClient({ userId, userName }: Props) {
  const router = useRouter();
  const { data: masteries, isLoading } = trpc.assessment.getMasteries.useQuery();

  const cikisYap = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Ders bazinda gruplama
  const dersBazinda = masteries?.reduce(
    (acc, m) => {
      const ders = m.topic.ders;
      if (!acc[ders]) acc[ders] = [];
      acc[ders].push(m);
      return acc;
    },
    {} as Record<string, typeof masteries>
  ) ?? {};

  const genelOrtalama = masteries && masteries.length > 0
    ? Math.round(masteries.reduce((s, m) => s + m.skor, 0) / masteries.length)
    : null;

  // LGS'ye kalan gun
  const lgs = new Date("2026-06-07");
  const kalanGun = Math.max(0, Math.ceil((lgs.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            LGS AI Kocu
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Merhaba, {userName}</span>
            <button
              onClick={cikisYap}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {/* Ozet kartlari */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">LGS&apos;ye Kalan</p>
            <p className="text-3xl font-bold text-blue-600">{kalanGun}</p>
            <p className="text-sm text-gray-500">gün (7 Haziran 2026)</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Genel Başarı</p>
            <p className="text-3xl font-bold text-green-600">
              {genelOrtalama !== null ? `%${genelOrtalama}` : "—"}
            </p>
            <p className="text-sm text-gray-500">ortalama ustalık</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Takip Edilen Konu</p>
            <p className="text-3xl font-bold text-purple-600">
              {masteries?.length ?? "—"}
            </p>
            <p className="text-sm text-gray-500">konu</p>
          </div>
        </div>

        {/* Seviye belirleme CTA */}
        {!isLoading && (!masteries || masteries.length === 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Seviyeni henüz belirlemedin</h3>
              <p className="text-sm text-blue-700 mt-1">
                10 dakikada seviyeni belirle, kişisel çalışma planın oluşturulsun.
              </p>
            </div>
            <Link
              href="/diagnostic"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Seviye Belirle
            </Link>
          </div>
        )}

        {/* Gunluk oturum */}
        {masteries && masteries.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Bugünkü Çalışma</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Zayıf konularından 15 soru seni bekliyor.
            </p>
            <Link
              href="/session"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Çalışmaya Başla
            </Link>
          </div>
        )}

        {/* Konu ustaligi */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-3 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : masteries && masteries.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold mb-4">Konu Ustalığı</h2>
            <div className="space-y-4">
              {Object.entries(dersBazinda).map(([ders, konular]) => (
                <div key={ders} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${DERS_RENK[ders] ?? "bg-gray-400"}`} />
                    <h3 className="font-semibold">{DERS_ISIM[ders] ?? ders}</h3>
                  </div>
                  <div className="space-y-2.5">
                    {konular.sort((a, b) => a.skor - b.skor).map((m) => (
                      <div key={m.topicId} className="flex items-center gap-3">
                        <span className="w-44 text-sm text-gray-600 truncate">
                          {m.topic.isim}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${
                              m.skor >= 70
                                ? "bg-green-500"
                                : m.skor >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${m.skor}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10 text-right text-gray-700">
                          %{Math.round(m.skor)}
                        </span>
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
