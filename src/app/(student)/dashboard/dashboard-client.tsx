"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "../../../lib/trpc";
import { createClient } from "../../../lib/supabase/client";
import SidebarLayout from "../../components/SidebarLayout";

// ─── Sabitler ───────────────────────────────────────────────────────────────

const LGS_SORU_SAYISI: Record<string, number> = {
  TURKCE: 20, MATEMATIK: 20, FEN: 20, SOSYAL: 10, DIN: 10, INGILIZCE: 10,
};

const DERS_SIRA = ["TURKCE", "MATEMATIK", "FEN", "SOSYAL", "DIN", "INGILIZCE"] as const;

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", DIN: "Din Kültürü", INGILIZCE: "İngilizce",
};

const DERS_IKON: Record<string, string> = {
  MATEMATIK: "📐", FEN: "🔬", TURKCE: "📖",
  SOSYAL: "🌍", DIN: "☪️", INGILIZCE: "🇬🇧",
};

const DERS_HEX: Record<string, string> = {
  MATEMATIK: "#6366f1",
  FEN:       "#10b981",
  TURKCE:    "#ef4444",
  SOSYAL:    "#f97316",
  DIN:       "#14b8a6",
  INGILIZCE: "#8b5cf6",
};

const DERS_BG: Record<string, string> = {
  MATEMATIK: "bg-indigo-50 border-indigo-100",
  FEN:       "bg-emerald-50 border-emerald-100",
  TURKCE:    "bg-red-50 border-red-100",
  SOSYAL:    "bg-orange-50 border-orange-100",
  DIN:       "bg-teal-50 border-teal-100",
  INGILIZCE: "bg-violet-50 border-violet-100",
};

const DERS_TEXT: Record<string, string> = {
  MATEMATIK: "text-indigo-700",
  FEN:       "text-emerald-700",
  TURKCE:    "text-red-700",
  SOSYAL:    "text-orange-700",
  DIN:       "text-teal-700",
  INGILIZCE: "text-violet-700",
};

function calculateWeightedAverage(dersMastery: Record<string, number>): number | null {
  const toplamAgirlik = Object.values(LGS_SORU_SAYISI).reduce((s, n) => s + n, 0);
  let agirlikliToplam = 0;
  let kapsanmisAgirlik = 0;
  for (const [ders, soruSayisi] of Object.entries(LGS_SORU_SAYISI)) {
    if (dersMastery[ders] !== undefined) {
      agirlikliToplam += dersMastery[ders] * soruSayisi;
      kapsanmisAgirlik += soruSayisi;
    }
  }
  if (kapsanmisAgirlik === 0) return null;
  return Math.round(agirlikliToplam / toplamAgirlik);
}

// ─── SVG Halka İlerleme ─────────────────────────────────────────────────────

function ProgressRing({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const stroke = 6;
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

// ─── Ders Kartı ─────────────────────────────────────────────────────────────

function SubjectCard({
  ders,
  skor,
  topicId,
}: {
  ders: string;
  skor: number | undefined;
  topicId?: string;
}) {
  const hasMastery = skor !== undefined;
  const displaySkor = hasMastery ? skor : 0;
  const color = DERS_HEX[ders] ?? "#94a3b8";
  const bg = DERS_BG[ders] ?? "bg-gray-50 border-gray-100";
  const textColor = DERS_TEXT[ders] ?? "text-gray-700";

  return (
    <Link
      href={topicId ? `/calis?topicId=${topicId}` : `/konular`}
      className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border ${bg} hover:shadow-md transition-all duration-200 group`}
    >
      {/* Ring + icon */}
      <div className="relative">
        <ProgressRing pct={displaySkor} color={color} size={72} />
        <span className="absolute inset-0 flex items-center justify-center text-xl" style={{ transform: "rotate(0deg)" }}>
          {DERS_IKON[ders]}
        </span>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-xs font-bold text-gray-800 leading-tight">{DERS_ISIM[ders]}</p>
        {hasMastery ? (
          <p className={`text-sm font-black ${textColor}`}>%{skor}</p>
        ) : (
          <p className="text-xs text-gray-400">Başlanmadı</p>
        )}
      </div>

      {/* Hover CTA */}
      <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
        →
      </span>
    </Link>
  );
}

// ─── Stat Kartı ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "text-gray-900",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
}

export default function DashboardClient({ userName }: Props) {
  const router = useRouter();

  const { data: masteries, isLoading: masteriesLoading } = trpc.assessment.getMasteries.useQuery();
  const { data: profile } = trpc.learning.getProfile.useQuery();
  const { data: studyStats } = trpc.learning.getStudyStats.useQuery();
  const { data: todaySession } = trpc.assessment.getTodaySession.useQuery();
  const { data: coachComment } = trpc.learning.getCoachComment.useQuery();

  const cikisYap = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Ders bazında mastery
  const dersBazindaMastery: Record<string, number> = {};
  if (masteries) {
    const gruplar: Record<string, number[]> = {};
    masteries.forEach((m) => {
      const ders = m.topic.ders;
      if (!gruplar[ders]) gruplar[ders] = [];
      gruplar[ders].push(m.skor);
    });
    Object.entries(gruplar).forEach(([ders, skorlar]) => {
      dersBazindaMastery[ders] = Math.round(
        skorlar.reduce((s, x) => s + x, 0) / skorlar.length
      );
    });
  }

  const genelOrtalama = calculateWeightedAverage(dersBazindaMastery);

  // LGS hesabı
  const lgs = new Date("2026-06-07");
  const kalanGun = Math.max(0, Math.ceil((lgs.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const streak = profile?.currentStreak ?? 0;
  const hedefOkul = profile?.targetSchool;
  const tahminiTarih = profile?.estimatedReadyDate;

  const bugunTopicId = todaySession?.hedefTopicIds?.[0] ?? null;
  const bugunDk = studyStats?.gunlukDk ?? 0;
  const haftaDk = studyStats?.haftalikDk ?? 0;
  const oturumSayisi = studyStats?.oturumSayisi ?? 0;

  // Hedef okul banner durumu
  const hazirGun = tahminiTarih
    ? Math.max(0, Math.ceil((new Date(tahminiTarih).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const yetisir = hazirGun !== null ? hazirGun <= kalanGun : true;

  // Ad (ilk kelime)
  const firstName = userName.split(" ")[0];

  return (
    <SidebarLayout userName={userName} onLogout={cikisYap}>
      <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">

        {/* ── Hoş Geldin Başlığı ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Merhaba, {firstName}! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              LGS&apos;ye <span className="font-semibold text-violet-600">{kalanGun} gün</span> kaldı — bugün de çalışıyoruz!
            </p>
          </div>
          {streak > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-2 shrink-0">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xl font-black text-orange-700 leading-none">{streak}</p>
                <p className="text-xs text-orange-500 font-medium">gün seri</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Hedef Okul / LGS Banner ── */}
        {hedefOkul ? (
          <div
            className={`rounded-3xl p-5 mb-6 text-white ${
              yetisir
                ? "bg-gradient-to-br from-violet-600 to-indigo-700"
                : "bg-gradient-to-br from-amber-500 to-orange-600"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold opacity-75 uppercase tracking-wider mb-1">Hedef Okul</p>
                <p className="text-lg font-black truncate">{hedefOkul.isim}</p>
                <p className="text-sm opacity-75">{hedefOkul.sehir} · Taban: {hedefOkul.minPuan} puan</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs opacity-75 mb-1">
                  {yetisir ? "Yetişirsin ✓" : "Hızlan!"}
                </p>
                <p className="text-4xl font-black leading-none">{kalanGun}</p>
                <p className="text-sm opacity-75">gün kaldı</p>
                {hazirGun !== null && (
                  <p className="text-xs opacity-60 mt-1">
                    Tahmini hazırlık: {hazirGun} gün
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/hedef-okul"
            className="flex items-center gap-4 bg-white border-2 border-dashed border-violet-300 rounded-3xl p-5 mb-6 hover:border-violet-500 hover:bg-violet-50 transition-all group"
          >
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-violet-200 transition-colors">
              🎯
            </div>
            <div className="flex-1">
              <p className="font-bold text-violet-900">Hedef Okul Belirle</p>
              <p className="text-sm text-violet-500">Kaç günde hazır olduğunu hesaplayalım</p>
            </div>
            <span className="text-violet-400 text-xl font-bold">→</span>
          </Link>
        )}

        {/* ── Hızlı İstatistikler ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="LGS'ye Kalan"
            value={kalanGun}
            sub="gün"
            color="text-violet-600"
            icon="📅"
          />
          <StatCard
            label="LGS Başarı"
            value={genelOrtalama !== null ? `%${genelOrtalama}` : "—"}
            sub="90 soruda ağırlıklı"
            color="text-emerald-600"
            icon="📈"
          />
          <StatCard
            label="Bugün"
            value={bugunDk > 0 ? `${bugunDk} dk` : "—"}
            sub={haftaDk > 0 ? `Hafta: ${haftaDk} dk` : "Henüz çalışılmadı"}
            color="text-blue-600"
            icon="⏱️"
          />
          <StatCard
            label="Oturum"
            value={oturumSayisi > 0 ? oturumSayisi : (streak > 0 ? `${streak}🔥` : "—")}
            sub={oturumSayisi > 0 ? "tamamlanan" : "ardışık gün"}
            color="text-orange-600"
            icon={oturumSayisi > 0 ? "✅" : "🔥"}
          />
        </div>

        {/* ── Bugünün Görevi ── */}
        {!masteriesLoading && (!masteries || masteries.length === 0) ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <div>
                <p className="font-bold text-blue-900">Seviyeni henüz belirlemedin</p>
                <p className="text-sm text-blue-600">Seviyeni belirle, kişisel çalışma planın oluşturulsun.</p>
              </div>
            </div>
            <Link
              href="/diagnostic"
              className="shrink-0 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Seviye Belirle →
            </Link>
          </div>
        ) : bugunTopicId ? (
          <Link
            href={`/calis?topicId=${bugunTopicId}`}
            className="flex items-center gap-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl p-5 mb-6 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
              🤖
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold opacity-75 uppercase tracking-wider">Bugünün Görevi</p>
              <p className="font-bold text-lg">Koç Döngüsünü Başlat</p>
              <p className="text-sm opacity-75">Planındaki konuya git ve çalış</p>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        ) : (
          <Link
            href="/konular"
            className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 mb-6 hover:border-violet-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-2xl">
              📚
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Serbest Çalışma</p>
              <p className="font-bold text-gray-900 text-lg">Konu Seç ve Çalış</p>
              <p className="text-sm text-gray-500">İstediğin konuyu seç, AI koçun anlatsın</p>
            </div>
            <span className="text-xl text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all">→</span>
          </Link>
        )}

        {/* ── Ders İlerleme Kartları ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-base">Ders İlerlemesi</h2>
            <Link href="/konular" className="text-xs text-violet-600 font-semibold hover:underline">
              Tümünü gör →
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {DERS_SIRA.map((ders) => (
              <SubjectCard
                key={ders}
                ders={ders}
                skor={dersBazindaMastery[ders]}
                topicId={bugunTopicId ?? undefined}
              />
            ))}
          </div>
        </div>

        {/* ── AI Koç Yorumu ── */}
        {coachComment && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center text-xl shrink-0">
                🤖
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-violet-900 mb-1">AI Koç Yorumu</p>
                <p className="text-sm text-violet-700 leading-relaxed">{coachComment.yorum}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-violet-400">
                  {coachComment.toplamSoru > 0 && (
                    <span>Bu hafta {coachComment.toplamSoru} soru · %{Math.round(coachComment.dogruOrani * 100)} doğru</span>
                  )}
                  {coachComment.streak > 0 && <span>🔥 {coachComment.streak} gün seri</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Hızlı Aksiyonlar ── */}
        <div className="mb-6">
          <h2 className="font-bold text-gray-900 text-base mb-3">Hızlı Erişim</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/deneme"
              className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-red-200 transition-all text-center group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">📝</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Deneme Sınavı</p>
                <p className="text-xs text-gray-400">LGS formatında</p>
              </div>
            </Link>
            <Link
              href="/konular"
              className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-blue-200 transition-all text-center group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">📚</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Konulara Göz At</p>
                <p className="text-xs text-gray-400">Serbest çalışma</p>
              </div>
            </Link>
            <div className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center opacity-50 cursor-not-allowed">
              <span className="text-3xl">📊</span>
              <div>
                <p className="font-semibold text-gray-500 text-sm">İstatistikler</p>
                <p className="text-xs text-gray-400">Yakında</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center opacity-50 cursor-not-allowed">
              <span className="text-3xl">🏆</span>
              <div>
                <p className="font-semibold text-gray-500 text-sm">Rozetler</p>
                <p className="text-xs text-gray-400">Yakında</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Detaylı Konu Ustalığı ── */}
        {masteries && masteries.length > 0 && (() => {
          const dersBazinda = masteries.reduce((acc, m) => {
            const ders = m.topic.ders;
            if (!acc[ders]) acc[ders] = [];
            acc[ders].push(m);
            return acc;
          }, {} as Record<string, typeof masteries>);

          return (
            <div>
              <h2 className="font-bold text-gray-900 text-base mb-3">Konu Detayı</h2>
              <div className="space-y-3">
                {DERS_SIRA
                  .filter((ders) => (dersBazinda[ders]?.length ?? 0) > 0)
                  .map((ders) => {
                    const konular = dersBazinda[ders];
                    const color = DERS_HEX[ders] ?? "#94a3b8";
                    return (
                      <div key={ders} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{DERS_IKON[ders]}</span>
                          <h3 className="font-bold text-sm text-gray-900">{DERS_ISIM[ders]}</h3>
                          <span className="ml-auto text-xs text-gray-400 font-medium">
                            {LGS_SORU_SAYISI[ders]} soru · Ort. %{dersBazindaMastery[ders] ?? "—"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {konular.sort((a, b) => a.skor - b.skor).map((m) => (
                            <div key={m.topicId} className="flex items-center gap-3">
                              <span className="w-36 text-xs text-gray-600 truncate">{m.topic.isim}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${m.skor}%`,
                                    backgroundColor: color,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-bold w-8 text-right" style={{ color }}>
                                %{Math.round(m.skor)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })()}
      </div>
    </SidebarLayout>
  );
}
