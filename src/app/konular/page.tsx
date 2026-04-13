"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "../../lib/trpc";
import SidebarLayout from "../components/SidebarLayout";

// ─── Sabitler ───────────────────────────────────────────────────────────────

const AKTIF_DERSLER = ["TURKCE", "MATEMATIK", "FEN", "SOSYAL", "DIN", "INGILIZCE"] as const;
type AktifDers = (typeof AKTIF_DERSLER)[number];

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", DIN: "Din Kültürü", INGILIZCE: "İngilizce",
};

const DERS_IKON: Record<string, string> = {
  MATEMATIK: "📐", FEN: "🔬", TURKCE: "📖",
  SOSYAL: "🌍", DIN: "☪️", INGILIZCE: "🇬🇧",
};

const DERS_SORU: Record<string, number> = {
  TURKCE: 20, MATEMATIK: 20, FEN: 20, SOSYAL: 10, DIN: 10, INGILIZCE: 10,
};

const DERS_HEX: Record<string, string> = {
  MATEMATIK: "#6366f1", FEN: "#10b981", TURKCE: "#ef4444",
  SOSYAL: "#f97316", DIN: "#14b8a6", INGILIZCE: "#8b5cf6",
};

const DERS_BG: Record<string, string> = {
  MATEMATIK: "bg-indigo-50 border-indigo-100 hover:border-indigo-300",
  FEN:       "bg-emerald-50 border-emerald-100 hover:border-emerald-300",
  TURKCE:    "bg-red-50 border-red-100 hover:border-red-300",
  SOSYAL:    "bg-orange-50 border-orange-100 hover:border-orange-300",
  DIN:       "bg-teal-50 border-teal-100 hover:border-teal-300",
  INGILIZCE: "bg-violet-50 border-violet-100 hover:border-violet-300",
};

const DERS_BTN: Record<string, string> = {
  MATEMATIK: "bg-indigo-600 hover:bg-indigo-700",
  FEN:       "bg-emerald-600 hover:bg-emerald-700",
  TURKCE:    "bg-red-600 hover:bg-red-700",
  SOSYAL:    "bg-orange-600 hover:bg-orange-700",
  DIN:       "bg-teal-600 hover:bg-teal-700",
  INGILIZCE: "bg-violet-600 hover:bg-violet-700",
};

const DERS_TEXT: Record<string, string> = {
  MATEMATIK: "text-indigo-700", FEN: "text-emerald-700", TURKCE: "text-red-700",
  SOSYAL: "text-orange-700", DIN: "text-teal-700", INGILIZCE: "text-violet-700",
};

const DERS_BADGE: Record<string, string> = {
  MATEMATIK: "bg-indigo-100 text-indigo-700",
  FEN:       "bg-emerald-100 text-emerald-700",
  TURKCE:    "bg-red-100 text-red-700",
  SOSYAL:    "bg-orange-100 text-orange-700",
  DIN:       "bg-teal-100 text-teal-700",
  INGILIZCE: "bg-violet-100 text-violet-700",
};

const OTURUM1: AktifDers[] = ["TURKCE", "SOSYAL", "DIN", "INGILIZCE"];
const OTURUM2: AktifDers[] = ["MATEMATIK", "FEN"];

// ─── SVG Halka ───────────────────────────────────────────────────────────────

function ProgressRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const stroke = 5;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export default function KonularPage() {
  const [secilenDers, setSecilenDers] = useState<AktifDers | null>(null);

  const { data: masteries } = trpc.assessment.getMasteries.useQuery();
  const { data: topics, isLoading: topicsLoading } = trpc.learning.getTopicsForBrowse.useQuery(
    secilenDers ? { ders: secilenDers } : undefined,
    { enabled: !!secilenDers }
  );

  // Ders bazında mastery
  const dersMastery: Record<string, number> = {};
  if (masteries) {
    const gruplar: Record<string, number[]> = {};
    masteries.forEach((m) => {
      const ders = m.topic.ders;
      if (!gruplar[ders]) gruplar[ders] = [];
      gruplar[ders].push(m.skor);
    });
    Object.entries(gruplar).forEach(([ders, skorlar]) => {
      dersMastery[ders] = Math.round(skorlar.reduce((s, x) => s + x, 0) / skorlar.length);
    });
  }

  const topicMastery: Record<string, number> = {};
  masteries?.forEach((m) => { topicMastery[m.topicId] = Math.round(m.skor); });

  // ── Görünüm 2: Konu Listesi ───────────────────────────────────────────────

  if (secilenDers) {
    const color = DERS_HEX[secilenDers] ?? "#6366f1";
    const btnClass = DERS_BTN[secilenDers] ?? "bg-gray-700";
    const badgeClass = DERS_BADGE[secilenDers] ?? "bg-gray-100 text-gray-700";
    const mastery = dersMastery[secilenDers];

    return (
      <SidebarLayout>
        <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSecilenDers(null)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all"
            >
              ←
            </button>
            <div className="flex items-center gap-3 flex-1">
              <span className="text-3xl">{DERS_IKON[secilenDers]}</span>
              <div>
                <h1 className="text-xl font-black text-gray-900">{DERS_ISIM[secilenDers]}</h1>
                <p className="text-xs text-gray-500">
                  {DERS_SORU[secilenDers]} soru
                  {mastery !== undefined && (
                    <> · <span className="font-semibold" style={{ color }}>%{mastery} başarı</span></>
                  )}
                </p>
              </div>
            </div>
            {mastery !== undefined && (
              <div className="shrink-0">
                <ProgressRing pct={mastery} color={color} size={52} />
              </div>
            )}
          </div>

          {/* Konu Listesi */}
          {topicsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {topics?.map((topic) => {
                const tMastery = topicMastery[topic.id];
                return (
                  <div key={topic.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="font-bold text-gray-900 text-sm truncate">{topic.isim}</h2>
                          {tMastery !== undefined && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${badgeClass}`}>
                              %{tMastery}
                            </span>
                          )}
                        </div>
                        {tMastery !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{ width: `${tMastery}%`, backgroundColor: color }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{topic._count.questions} soru</span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">{topic._count.questions} soru · henüz çalışılmadı</p>
                        )}
                      </div>
                      <Link
                        href={`/calis?topicId=${topic.id}`}
                        className={`shrink-0 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${btnClass}`}
                      >
                        Çalış →
                      </Link>
                    </div>

                    {topic.children.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-2">
                        {topic.children.map((child) => {
                          const childMastery = topicMastery[child.id];
                          return (
                            <Link
                              key={child.id}
                              href={`/calis?topicId=${child.id}`}
                              className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 hover:bg-slate-100 transition-colors"
                            >
                              <span className="text-xs text-gray-700 truncate font-medium">{child.isim}</span>
                              <span className="text-xs ml-2 shrink-0 font-bold" style={{ color: childMastery !== undefined ? color : undefined }}>
                                {childMastery !== undefined ? `%${childMastery}` : `${child._count.questions}s`}
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
                <div className="text-center py-16 text-gray-400">
                  <span className="text-4xl block mb-3">📭</span>
                  Bu ders için henüz konu eklenmemiş.
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarLayout>
    );
  }

  // ── Görünüm 1: Ders Kartları ─────────────────────────────────────────────

  const DersCard = ({ ders }: { ders: AktifDers }) => {
    const mastery = dersMastery[ders];
    const color = DERS_HEX[ders] ?? "#94a3b8";
    const bg = DERS_BG[ders] ?? "bg-gray-50 border-gray-200";
    const textCls = DERS_TEXT[ders] ?? "text-gray-700";

    return (
      <button
        onClick={() => setSecilenDers(ders)}
        className={`w-full rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md cursor-pointer ${bg}`}
      >
        {/* Icon + Ring row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-3xl">{DERS_IKON[ders]}</span>
          {mastery !== undefined && (
            <ProgressRing pct={mastery} color={color} size={52} />
          )}
        </div>

        {/* Name */}
        <h2 className="font-black text-gray-900 text-sm mb-0.5">{DERS_ISIM[ders]}</h2>
        <p className="text-xs text-gray-400 mb-2">{DERS_SORU[ders]} soru</p>

        {/* Progress */}
        {mastery !== undefined ? (
          <>
            <div className="w-full bg-white/70 rounded-full h-1.5 mb-1">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${mastery}%`, backgroundColor: color }}
              />
            </div>
            <p className={`text-sm font-black ${textCls}`}>%{mastery}</p>
          </>
        ) : (
          <p className="text-xs text-gray-400 font-medium">Başlanmadı</p>
        )}
      </button>
    );
  };

  return (
    <SidebarLayout>
      <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto w-full">
        {/* Başlık */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Konular</h1>
          <p className="text-gray-500 text-sm mt-1">Çalışmak istediğin dersi seç</p>
        </div>

        {/* 1. Oturum — Sözel */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              1. Oturum — Sözel (50 soru)
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {OTURUM1.map((ders) => (
              <DersCard key={ders} ders={ders} />
            ))}
          </div>
        </div>

        {/* 2. Oturum — Sayısal */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              2. Oturum — Sayısal (40 soru)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {OTURUM2.map((ders) => (
              <DersCard key={ders} ders={ders} />
            ))}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
