"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "../../lib/trpc";
import SidebarLayout from "../components/SidebarLayout";
import { ChevronLeft } from "lucide-react";

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
  MATEMATIK: "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-300",
  FEN:       "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-300",
  TURKCE:    "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-500/20 hover:border-red-300",
  SOSYAL:    "bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-500/20 hover:border-orange-300",
  DIN:       "bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-500/20 hover:border-teal-300",
  INGILIZCE: "bg-violet-50/50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-500/20 hover:border-violet-300",
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
  MATEMATIK: "text-indigo-600 dark:text-indigo-400", 
  FEN: "text-emerald-600 dark:text-emerald-400", 
  TURKCE: "text-red-600 dark:text-red-400",
  SOSYAL: "text-orange-600 dark:text-orange-400", 
  DIN: "text-teal-600 dark:text-teal-400", 
  INGILIZCE: "text-violet-600 dark:text-violet-400",
};

const DERS_BADGE: Record<string, string> = {
  MATEMATIK: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  FEN:       "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  TURKCE:    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  SOSYAL:    "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  DIN:       "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400",
  INGILIZCE: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-foreground/10" strokeWidth={stroke} />
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
    const btnClass = DERS_BTN[secilenDers] ?? "bg-[var(--ios-blue)]";
    const badgeClass = DERS_BADGE[secilenDers] ?? "bg-foreground/10 text-foreground";
    const mastery = dersMastery[secilenDers];

    return (
      <SidebarLayout>
        <div className="px-6 py-10 max-w-3xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setSecilenDers(null)}
              className="w-10 h-10 flex items-center justify-center rounded-squircle bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 bg-foreground/5 rounded-squircle flex items-center justify-center text-3xl shrink-0">
                {DERS_IKON[secilenDers]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{DERS_ISIM[secilenDers]}</h1>
                <p className="text-sm subheadline">
                  {DERS_SORU[secilenDers]} soru
                  {mastery !== undefined && (
                    <> <span className="mx-1.5 opacity-50">&middot;</span> <span className="font-semibold" style={{ color }}>%{mastery} başarı</span></>
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
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="ios-card rounded-squircle h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {topics?.map((topic) => {
                const tMastery = topicMastery[topic.id];
                return (
                  <div key={topic.id} className="ios-card rounded-squircle p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2.5">
                          <h2 className="font-semibold text-foreground text-[15px] truncate tracking-tight">{topic.isim}</h2>
                          {tMastery !== undefined && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 tracking-widest ${badgeClass}`}>
                              %{tMastery}
                            </span>
                          )}
                        </div>
                        {tMastery !== undefined ? (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-foreground/10 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${tMastery}%`, backgroundColor: color }}
                              />
                            </div>
                            <span className="text-xs subheadline font-semibold shrink-0">{topic._count.questions} soru</span>
                          </div>
                        ) : (
                          <p className="text-xs subheadline">{topic._count.questions} soru <span className="mx-1 opacity-50">&middot;</span> henüz çalışılmadı</p>
                        )}
                      </div>
                      <Link
                        href={`/calis?topicId=${topic.id}`}
                        className={`shrink-0 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${btnClass}`}
                      >
                        Çalış
                      </Link>
                    </div>

                    {topic.children.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-foreground/5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {topic.children.map((child) => {
                          const childMastery = topicMastery[child.id];
                          return (
                            <Link
                              key={child.id}
                              href={`/calis?topicId=${child.id}`}
                              className="flex items-center justify-between bg-foreground/5 rounded-xl px-4 py-3 hover:bg-foreground/10 transition-colors"
                            >
                              <span className="text-[13px] text-foreground truncate font-medium">{child.isim}</span>
                              <span className="text-xs ml-3 shrink-0 font-bold" style={{ color: childMastery !== undefined ? color : undefined }}>
                                {childMastery !== undefined ? `%${childMastery}` : `${child._count.questions} s.`}
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
                <div className="text-center py-20 subheadline">
                  <span className="text-4xl block mb-4 opacity-50">📭</span>
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
    const bg = DERS_BG[ders] ?? "bg-foreground/5 border-foreground/10";
    const textCls = DERS_TEXT[ders] ?? "text-foreground";

    return (
      <button
        onClick={() => setSecilenDers(ders)}
        className={`w-full rounded-squircle border border-transparent p-5 text-left transition-transform hover:-translate-y-1 cursor-pointer ios-card ${bg}`}
      >
        {/* Icon + Ring row */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-squircle flex items-center justify-center text-2xl bg-background border border-foreground/5 shadow-sm">
            {DERS_IKON[ders]}
          </div>
          {mastery !== undefined && (
            <ProgressRing pct={mastery} color={color} size={48} />
          )}
        </div>

        {/* Name */}
        <h2 className="font-bold text-[15px] tracking-tight text-foreground mb-1">{DERS_ISIM[ders]}</h2>
        <p className="text-xs subheadline mb-3">{DERS_SORU[ders]} soru</p>

        {/* Progress */}
        {mastery !== undefined ? (
          <>
            <div className="w-full bg-foreground/10 rounded-full h-1.5 mb-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${mastery}%`, backgroundColor: color }}
              />
            </div>
            <p className={`text-[13px] font-bold ${textCls}`}>%{mastery}</p>
          </>
        ) : (
          <p className="text-xs subheadline font-semibold uppercase tracking-widest mt-2">Başlanmadı</p>
        )}
      </button>
    );
  };

  return (
    <SidebarLayout>
      <div className="px-6 py-10 max-w-3xl mx-auto w-full space-y-10">
        {/* Başlık */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Konular</h1>
          <p className="subheadline text-base">Çalışmak istediğin dersi seç</p>
        </div>

        {/* 1. Oturum — Sözel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[var(--ios-blue)]"></div>
            <p className="text-[11px] font-semibold subheadline uppercase tracking-widest">
              1. Oturum — Sözel (50 Soru)
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {OTURUM1.map((ders) => (
              <DersCard key={ders} ders={ders} />
            ))}
          </div>
        </div>

        {/* 2. Oturum — Sayısal */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <p className="text-[11px] font-semibold subheadline uppercase tracking-widest">
              2. Oturum — Sayısal (40 Soru)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {OTURUM2.map((ders) => (
              <DersCard key={ders} ders={ders} />
            ))}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
