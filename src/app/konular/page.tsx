"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "../../lib/trpc";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", INGILIZCE: "İngilizce", DIN: "Din Kültürü",
};
const DERS_IKON: Record<string, string> = {
  MATEMATIK: "📐", FEN: "🔬", TURKCE: "📖", SOSYAL: "🏛️", INGILIZCE: "🌍", DIN: "☪️",
};
const DERS_RENK: Record<string, string> = {
  MATEMATIK: "border-blue-300 bg-blue-50", FEN: "border-green-300 bg-green-50",
  TURKCE: "border-red-300 bg-red-50", SOSYAL: "border-yellow-300 bg-yellow-50",
  INGILIZCE: "border-purple-300 bg-purple-50", DIN: "border-orange-300 bg-orange-50",
};

export default function KonularPage() {
  const [secilenDers, setSecilenDers] = useState<string | null>(null);

  const { data: topics, isLoading } = trpc.learning.getTopicsForBrowse.useQuery(
    secilenDers ? { ders: secilenDers } : undefined
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">LGS AI Koçu</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">Dashboard →</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Konular</h1>
        <p className="text-gray-500 mb-6">Ders ve konu seç, soru çöz veya ders içeriğini incele.</p>

        {/* Ders filtreleri */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setSecilenDers(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !secilenDers ? "bg-gray-900 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Tümü
          </button>
          {Object.entries(DERS_ISIM).map(([key, isim]) => (
            <button
              key={key}
              onClick={() => setSecilenDers(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                secilenDers === key ? "bg-gray-900 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {DERS_IKON[key]} {isim}
            </button>
          ))}
        </div>

        {/* Konu listesi */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {topics?.map((topic) => (
              <div key={topic.id} className={`rounded-xl border-2 p-5 ${DERS_RENK[topic.ders] ?? "border-gray-200 bg-white"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{DERS_IKON[topic.ders]}</span>
                  <h2 className="font-semibold text-gray-900">{topic.isim}</h2>
                  <span className="ml-auto text-xs text-gray-500">
                    {topic._count.questions} soru
                  </span>
                </div>

                {topic.children.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {topic.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/diagnostic?ders=${topic.ders}`}
                        className="flex items-center justify-between bg-white/70 rounded-lg px-4 py-3 hover:bg-white transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">{child.isim}</span>
                        <span className="text-xs text-gray-400">{child._count.questions} soru →</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {topics?.length === 0 && (
              <div className="text-center py-12 text-gray-400">Bu ders için henüz konu eklenmemiş.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
