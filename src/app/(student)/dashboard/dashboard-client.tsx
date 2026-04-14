"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "../../../lib/trpc";
import { createClient } from "../../../lib/supabase/client";
import SidebarLayout from "../../components/SidebarLayout";
import { motion } from "framer-motion";
import {
  BookOpen, Calculator, Beaker, Globe, Sparkles, Zap,
  Flame, Target, CalendarDays, BarChart2, Clock, CheckCircle2,
  Brain, ArrowRight, Play, BookMarked, Trophy, PenTool
} from "lucide-react";

// ─── Sabitler ───────────────────────────────────────────────────────────────

const LGS_SORU_SAYISI: Record<string, number> = {
  TURKCE: 20, MATEMATIK: 20, FEN: 20, SOSYAL: 10, DIN: 10, INGILIZCE: 10,
};

const DERS_SIRA = ["TURKCE", "MATEMATIK", "FEN", "SOSYAL", "DIN", "INGILIZCE"] as const;

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", DIN: "Din Kültürü", INGILIZCE: "İngilizce",
};

const DERS_IKON: Record<string, any> = {
  MATEMATIK: Calculator, FEN: Beaker, TURKCE: BookOpen,
  SOSYAL: Globe, DIN: Sparkles, INGILIZCE: Zap,
};

const DERS_HEX: Record<string, string> = {
  MATEMATIK: "#6366f1",
  FEN:       "#10b981",
  TURKCE:    "#ef4444",
  SOSYAL:    "#f97316",
  DIN:       "#14b8a6",
  INGILIZCE: "#8b5cf6",
};

const DERS_COLOR_CLASS: Record<string, string> = {
  MATEMATIK: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  FEN:       "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  TURKCE:    "text-rose-500 bg-rose-500/10 border-rose-500/20",
  SOSYAL:    "text-orange-500 bg-orange-500/10 border-orange-500/20",
  DIN:       "text-teal-500 bg-teal-500/10 border-teal-500/20",
  INGILIZCE: "text-violet-500 bg-violet-500/10 border-violet-500/20",
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
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
    </svg>
  );
}

// ─── Ders Kartı ─────────────────────────────────────────────────────────────

function SubjectCard({ ders, skor, topicId }: { ders: string; skor: number | undefined; topicId?: string; }) {
  const hasMastery = skor !== undefined;
  const displaySkor = hasMastery ? skor : 0;
  const color = DERS_HEX[ders] ?? "#94a3b8";
  const iconClass = DERS_COLOR_CLASS[ders] || "text-foreground bg-foreground/10 border-foreground/20";
  const IconComp = DERS_IKON[ders];

  return (
    <Link
      href={topicId ? `/calis?topicId=${topicId}` : `/konular`}
      className={`relative flex flex-col items-center gap-4 p-6 rounded-squircle ios-card hover:-translate-y-1 group transition-all duration-300 overflow-hidden`}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300`} style={{ backgroundColor: color }} />
      
      <div className="relative flex items-center justify-center">
        <ProgressRing pct={displaySkor} color={color} size={84} />
        <div className={`absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center ${iconClass}`}>
          {IconComp && <IconComp className="w-5 h-5" />}
        </div>
      </div>

      <div className="text-center mt-2">
        <p className="text-[13px] font-semibold leading-tight mb-0.5">{DERS_ISIM[ders]}</p>
        {hasMastery ? (
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl font-bold tracking-tight" style={{ color }}>%{skor}</span>
            <span className="text-[10px] text-foreground/40 font-bold tracking-widest uppercase mt-0.5">Ustalık</span>
          </div>
        ) : (
           <span className="text-[10px] subheadline tracking-widest uppercase font-semibold">Başlanmadı</span>
        )}
      </div>
    </Link>
  );
}

// ─── Stat Kartı ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colorClass, icon: Icon }: { label: string; value: string | number; sub?: string; colorClass: string; icon: any; }) {
  return (
    <div className="ios-card rounded-squircle p-5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 ${colorClass}`}>
         <Icon className="w-16 h-16 mr-[-20px] mt-[-20px]" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-squircle flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('-500', '-500/10')} ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-3xl font-bold mb-0.5 tracking-tight">{value}</p>
      {sub && <p className="text-[11px] subheadline">{sub}</p>}
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

  const dersBazindaMastery: Record<string, number> = {};
  if (masteries) {
    const gruplar: Record<string, number[]> = {};
    masteries.forEach((m) => {
      const ders = m.topic.ders;
      if (!gruplar[ders]) gruplar[ders] = [];
      gruplar[ders].push(m.skor);
    });
    Object.entries(gruplar).forEach(([ders, skorlar]) => {
      dersBazindaMastery[ders] = Math.round(skorlar.reduce((s, x) => s + x, 0) / skorlar.length);
    });
  }

  const genelOrtalama = calculateWeightedAverage(dersBazindaMastery);

  const lgs = new Date("2026-06-07");
  const kalanGun = Math.max(0, Math.ceil((lgs.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const streak = profile?.currentStreak ?? 0;
  const hedefOkul = profile?.targetSchool;
  const tahminiTarih = profile?.estimatedReadyDate;

  const bugunTopicId = todaySession?.hedefTopicIds?.[0] ?? null;
  const bugunDk = studyStats?.gunlukDk ?? 0;
  const haftaDk = studyStats?.haftalikDk ?? 0;
  const oturumSayisi = studyStats?.oturumSayisi ?? 0;

  const hazirGun = tahminiTarih ? Math.max(0, Math.ceil((new Date(tahminiTarih).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const yetisir = hazirGun !== null ? hazirGun <= kalanGun : true;

  const firstName = userName.split(" ")[0];

  const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  return (
    <SidebarLayout userName={userName} onLogout={cikisYap}>
      <div className="px-4 md:px-8 py-8 max-w-[1200px] mx-auto w-full space-y-8">
        
        {/* ── Hoş Geldin Başlığı ── */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-1 tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Merhaba, {firstName}!
            </h1>
            <p className="subheadline text-base">
              LGS'ye <span className="font-semibold text-foreground">{kalanGun} gün</span> kaldı. Hedefine giden adımları atmaya devam et.
            </p>
          </div>
          {streak > 0 && (
            <div className="ios-card px-5 py-3 rounded-squircle flex items-center gap-3 shrink-0">
               <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-squircle flex items-center justify-center">
                 <Flame className="w-6 h-6 text-orange-500 shrink-0" />
               </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground leading-none tracking-tight">{streak} <span className="text-sm text-foreground/50 font-medium">GÜN</span></span>
                <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest mt-0.5">Ateş Serisi</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Hedef Okul Banner ── */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          {hedefOkul ? (
            <div className={`relative overflow-hidden rounded-squircle-lg p-6 md:p-8 text-white shadow-2xl ${yetisir ? "bg-gradient-to-br from-[#1d1d1f] to-[#434345]" : "bg-gradient-to-br from-[#fc3d39] to-[#ff9500]"}`}>
              <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-2xl rounded-squircle flex items-center justify-center shrink-0 border border-white/10 shadow-sm">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Hedef Okul</h2>
                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-0.5">{hedefOkul.isim}</h3>
                    <p className="text-sm text-white/70 font-medium flex items-center gap-2">
                       {hedefOkul.sehir} <span className="w-1 h-1 bg-white/50 rounded-full" /> Taban: {hedefOkul.minPuan}
                    </p>
                  </div>
                </div>
                <div className="flex bg-white/10 backdrop-blur-2xl border border-white/10 rounded-squircle p-5 gap-6 shrink-0 w-full md:w-auto shadow-sm">
                  <div className="border-r border-white/20 pr-6">
                     <p className="text-[10px] text-white/60 tracking-widest font-semibold mb-1 uppercase">Durum</p>
                     <p className="text-sm font-bold flex items-center gap-1.5">{yetisir ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Yetişir</> : <><Flame className="w-4 h-4 text-orange-400" /> Geridesin</>}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60 tracking-widest font-semibold mb-1 uppercase">Tahmin</p>
                    <p className="text-2xl font-bold leading-none">{hazirGun !== null ? hazirGun : "?"} <span className="text-xs text-white/60 font-medium">gün</span></p>
                  </div>
               </div>
              </div>
            </div>
          ) : (
            <Link href="/hedef-okul" className="flex items-center gap-5 ios-card border-dashed border-2 border-[var(--ios-blue)]/30 rounded-squircle p-6 md:p-8 hover:border-[var(--ios-blue)]/60 transition-all group">
              <div className="w-14 h-14 bg-[var(--ios-blue)]/10 rounded-squircle flex items-center justify-center group-hover:scale-105 transition-transform">
                <Target className="w-7 h-7 text-[var(--ios-blue)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-0.5">Hedef Okulunu Belirle</h3>
                <p className="text-sm subheadline">Yapay zeka, hedefine giden en kısa yolu hesaplasın.</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--ios-blue)] flex items-center justify-center shadow-md group-hover:w-12 transition-all">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </Link>
          )}
        </motion.div>

        {/* ── İstatistikler ── */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="LGS'ye" value={kalanGun} sub="Gün Kaldı" colorClass="text-violet-500" icon={CalendarDays} />
          <StatCard label="Başarı Ort." value={genelOrtalama !== null ? `%${genelOrtalama}` : "—"} sub="90 soruda ağırlık" colorClass="text-emerald-500" icon={BarChart2} />
          <StatCard label="Bugün" value={bugunDk > 0 ? `${bugunDk} dk` : "—"} sub={haftaDk > 0 ? `Hafta: ${haftaDk} dk` : "Henüz çalışılmadı"} colorClass="text-blue-500" icon={Clock} />
          <StatCard label="Oturum" value={oturumSayisi > 0 ? oturumSayisi : "—"} sub={oturumSayisi > 0 ? "Tamamlanan" : "Seriye başla"} colorClass="text-orange-500" icon={CheckCircle2} />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* ── Bugünün Görevi ── */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col gap-4">
               <h2 className="text-lg font-bold flex items-center gap-2 tracking-tight">
                 <Zap className="w-5 h-5 text-yellow-500" /> Aksiyon Planı
               </h2>
               
               {!masteriesLoading && (!masteries || masteries.length === 0) ? (
                 <div className="ios-card bg-blue-50/50 dark:bg-blue-900/10 rounded-squircle p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-500/10 rounded-squircle flex items-center justify-center shrink-0">
                         <Brain className="w-7 h-7 text-[var(--ios-blue)]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-0.5">Test Çöz, Seviyeni Öğren</h3>
                        <p className="text-sm subheadline">AI koçun henüz zayıf noktalarını bilmiyor. Seviyeni belirleyerek planını oluştur.</p>
                      </div>
                    </div>
                    <Link href="/diagnostic" className="w-full sm:w-auto whitespace-nowrap bg-[var(--ios-blue)] text-white px-6 py-3.5 rounded-squircle font-bold shadow-md hover:-translate-y-1 transition-transform inline-flex items-center justify-center gap-2">
                       Seviye Belirle <ArrowRight className="w-5 h-5" />
                    </Link>
                 </div>
               ) : bugunTopicId ? (
                 <Link href={`/calis?topicId=${bugunTopicId}`} className="relative overflow-hidden group ios-card rounded-squircle p-8 hover:-translate-y-1 hover:shadow-lg transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--ios-blue)]/5 to-[var(--ios-blue)]/0 z-0" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                       <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-squircle bg-[var(--ios-blue)] flex items-center justify-center shadow-md">
                            <Play className="w-8 h-8 text-white ml-0.5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--ios-blue)] mb-1">Koç Döngüsü Başlat</p>
                            <h3 className="text-2xl font-bold mb-0.5">Sana Özel Bugünün Görevi</h3>
                            <p className="text-sm subheadline">Algoritma sıradaki geliştirmen gereken konuyu belirledi.</p>
                          </div>
                       </div>
                       <div className="w-10 h-10 rounded-full bg-[var(--ios-blue)]/10 text-[var(--ios-blue)] flex items-center justify-center group-hover:bg-[var(--ios-blue)] group-hover:text-white transition-colors self-end sm:self-auto">
                         <ArrowRight className="w-5 h-5" />
                       </div>
                    </div>
                 </Link>
               ) : (
                <Link href="/konular" className="relative overflow-hidden group ios-card rounded-squircle p-8 hover:-translate-y-1 transition-transform">
                  <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-squircle bg-[var(--ios-gray)]/10 flex items-center justify-center">
                        <BookMarked className="w-8 h-8 text-[var(--ios-gray)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-foreground/40 mb-1">Serbest Çalışma</p>
                        <h3 className="text-xl font-bold mb-0.5">Konu Seç ve Çalış</h3>
                        <p className="text-sm subheadline">Dilediğin eksiğini yapay zeka ile kapat.</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-foreground/30 group-hover:border-[var(--ios-blue)] group-hover:text-[var(--ios-blue)] group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
               )}
            </motion.div>

            {/* ── Ders İlerleme Kartları ── */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight">Genel Durum</h2>
                <Link href="/konular" className="text-sm font-semibold text-violet-500 hover:text-violet-600 flex items-center gap-1">
                  Detay <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DERS_SIRA.map((ders) => (
                  <SubjectCard key={ders} ders={ders} skor={dersBazindaMastery[ders]} topicId={bugunTopicId ?? undefined} />
                ))}
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            {/* ── AI Koç Yorumu ── */}
            {/* ── AI Koç Yorumu ── */}
            {coachComment && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="ios-card rounded-squircle p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-foreground/5 pb-4">
                    <div className="w-10 h-10 bg-[var(--ios-blue)]/10 rounded-squircle flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5 text-[var(--ios-blue)]" />
                    </div>
                    <div>
                      <h3 className="font-bold">AI Koç Analizi</h3>
                      <p className="text-[11px] subheadline tracking-widest uppercase">Haftalık Zeka Raporu</p>
                    </div>
                  </div>
                  <p className="text-[15px] leading-relaxed font-medium text-foreground tracking-tight">"{coachComment.yorum}"</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {coachComment.toplamSoru > 0 && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[var(--ios-blue)]/5 border border-[var(--ios-blue)]/10 text-[var(--ios-blue)] flex items-center gap-1.5">
                        <PenTool className="w-3 h-3" /> {coachComment.toplamSoru} Soru Çözümü
                      </span>
                    )}
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 flex items-center gap-1.5">
                        <Target className="w-3 h-3" /> %{Math.round(coachComment.dogruOrani * 100)} İsabet
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Hızlı Aksiyonlar ── */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h2 className="text-lg font-bold tracking-tight mb-4">Hızlı Erişim</h2>
              <div className="flex flex-col gap-3">
                <Link href="/deneme" className="ios-card p-4 rounded-squircle flex items-center justify-between group hover:-translate-y-0.5 transition-transform cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-squircle flex items-center justify-center group-hover:scale-105 transition-transform">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm mb-0.5 tracking-tight">LGS Denemesi</h4>
                       <p className="text-[13px] subheadline">Simülasyon başlat</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
                <div className="ios-card p-4 rounded-squircle flex items-center justify-between group opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-squircle flex items-center justify-center">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm mb-0.5 tracking-tight">Rozet ve Başarılar</h4>
                       <p className="text-[13px] subheadline mt-0.5"><span className="px-1.5 py-0.5 bg-foreground/10 text-foreground rounded text-[9px] font-bold uppercase tracking-widest">Yakında</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
