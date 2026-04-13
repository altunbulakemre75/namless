"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "../../lib/trpc";

const AKTIF_DERSLER = ["MATEMATIK", "FEN", "TURKCE"] as const;
type AktifDers = (typeof AKTIF_DERSLER)[number];

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
};
const DERS_IKON: Record<string, string> = {
  MATEMATIK: "📐", FEN: "🔬", TURKCE: "📖",
};
const DERS_RENK: Record<string, { card: string; bar: string; badge: string }> = {
  MATEMATIK: { card: "border-blue-200 bg-blue-50 hover:border-blue-400", bar: "bg-blue-500", badge: "bg-blue-100 text-blue-700" },
  FEN:       { card: "border-green-200 bg-green-50 hover:border-green-400", bar: "bg-green-500", badge: "bg-green-100 text-green-700" },
  TURKCE:    { card: "border-red-200 bg-red-50 hover:border-red-400", bar: "bg-red-500", badge: "bg-red-100 text-red-700" },
};

export default function KonularPage() {
  const [secilenDers, setSecilenDers] = useState<AktifDers | null>(null);

  const { data: masteries } = trpc.assessment.getMasteries.useQuery();
  const { data: topics, isLoading: topicsLoading } = trpc.learning.getTopicsForBrowse.useQuery(
    secilenDers ? { ders: secilenDers } : undefined,
    { enabled: !!secilenDers }
  );

  // Ders bazında mastery ortalaması
  const dersMastery: Record<string, number> = {};
  if (masteries) {
    const dersGruplari: Record<string, number[]> = {};
    masteries.forEach((m) => {
      const ders = m.topic.ders;
      if (!dersGruplari[ders]) dersGruplari[ders] = [];
      dersGruplari[ders].push(m.skor);
    });
    Object.entries(dersGruplari).forEach(([ders, skorlar]) => {
      dersMastery[ders] = Math.round(skorlar.reduce((s, x) => s + x, 0) / skorlar.length);
    });
  }

  // Topic bazında mastery map
  const topicMastery: Record<string, number> = {};
  masteries?.forEach((m) => { topicMastery[m.topicId] = Math.round(m.skor); });

  // ===================== GÖRÜNÜM 2: KONU LİSTESİ =======================
  if (secilenDers) {
    const renk = DERS_RENK[secilenDers];
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setSecilenDers(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Dersler
            </button>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
              Dashboard →
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-8 px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{DERS_IKON[secilenDers]}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{DERS_ISIM[secilenDers]}</h1>
              {dersMastery[secilenDers] !== undefined && (
                <p className="text-sm text-gray-500">
                  Genel başarın: %{dersMastery[secilenDers]}
                </p>
              )}
            </div>
          </div>

          {topicsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border h-20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {topics?.map((topic) => {
                const mastery = topicMastery[topic.id];
                return (
                  <div key={topic.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="font-semibold text-gray-900 truncate">{topic.isim}</h2>
                          {mastery !== undefined && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${renk.badge}`}>
                              %{mastery}
                            </span>
                          )}
                        </div>
                        {mastery !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${renk.bar}`}
                                style={{ width: `${mastery}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-12 text-right">
                              {topic._count.questions} soru
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            {topic._count.questions} soru · henüz çalışılmadı
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/calis?topicId=${topic.id}`}
                        className="shrink-0 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors"
                      >
                        Çalış →
                      </Link>
                    </div>

                    {topic.children.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                        {topic.children.map((child) => {
                          const childMastery = topicMastery[child.id];
                          return (
                            <Link
                              key={child.id}
                              href={`/calis?topicId=${child.id}`}
                              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-sm text-gray-700 truncate">{child.isim}</span>
                              <span className="text-xs text-gray-400 ml-2 shrink-0">
                                {childMastery !== undefined
                                  ? `%${childMastery}`
                                  : `${child._count.questions} soru`}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {topics?.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  Bu ders için henüz konu eklenmemiş.
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ===================== GÖRÜNÜM 1: DERS KARTLARI =======================
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            LGS AI Koçu
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Konular</h1>
        <p className="text-gray-500 mb-8">Çalışmak istediğin dersi seç.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {AKTIF_DERSLER.map((ders) => {
            const mastery = dersMastery[ders];
            const renk = DERS_RENK[ders];
            return (
              <button
                key={ders}
                onClick={() => setSecilenDers(ders)}
                className={`rounded-2xl border-2 p-6 text-left transition-all hover:shadow-md cursor-pointer ${renk.card}`}
              >
                <span className="text-4xl block mb-3">{DERS_IKON[ders]}</span>
                <h2 className="text-lg font-bold text-gray-900 mb-3">{DERS_ISIM[ders]}</h2>
                {mastery !== undefined ? (
                  <>
                    <div className="w-full bg-white/60 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full ${renk.bar}`}
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-600">%{mastery} tamamlandı</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Henüz çalışılmadı</p>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
