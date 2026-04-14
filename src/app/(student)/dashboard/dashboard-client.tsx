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
  Brain, ArrowRight, Play, BookMarked, Trophy
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
      className={`relative flex flex-col items-center gap-4 p-5 rounded-3xl glass-panel hover:-translate-y-2 group transition-all duration-300 border border-transparent hover:border-foreground/10 overflow-hidden`}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300`} style={{ backgroundColor: color }} />
      
      <div className="relative flex items-center justify-center">
        <ProgressRing pct={displaySkor} color={color} size={84} />
        <div className={`absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center ${iconClass}`}>
          {IconComp && <IconComp className="w-5 h-5" />}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-bold leading-tight mb-1">{DERS_ISIM[ders]}</p>
        {hasMastery ? (
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl font-black tracking-tight" style={{ color }}>%{skor}</span>
            <span className="text-[10px] text-foreground/50 uppercase font-bold tracking-wider mt-1">Ustalık</span>
          </div>
        ) : (
           <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/60 font-semibold border border-foreground/10">Başlanmadı</span>
        )}
      </div>
    </Link>
  );
}

// ─── Stat Kartı ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colorClass, icon: Icon }: { label: string; value: string | number; sub?: string; colorClass: string; icon: any; }) {
  return (
    <div className="glass-panel rounded-3xl p-5 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform ${colorClass}`}>
         <Icon className="w-16 h-16 mr-[-20px] mt-[-20px]" />
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('-500', '-500/20')} ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-3xl font-black mb-1 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-foreground/50 font-medium">{sub}</p>}
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
            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
              Merhaba, <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-500">{firstName}!</span> 👋
            </h1>
            <p className="text-foreground/60 text-sm font-medium">
              LGS'ye <span className="font-bold text-violet-600 dark:text-violet-400">{kalanGun} gün</span> kaldı. Hedefine giden adımları atmaya devam et.
            </p>
          </div>
          {streak > 0 && (
            <div className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-3 border-orange-500/20 shrink-0">
               <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                 <Flame className="w-6 h-6 text-orange-500 shrink-0" />
               </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-orange-600 dark:text-orange-500 leading-none">{streak} <span className="text-xs opacity-60">GÜN</span></span>
                <span className="text-[10px] font-bold text-orange-600/70 uppercase tracking-widest mt-0.5">Ateş Serisi</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Hedef Okul Banner ── */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          {hedefOkul ? (
            <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-2xl ${yetisir ? "bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700" : "bg-gradient-to-br from-amber-500 via-orange-500 to-red-600"}`}>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full mix-blend-overlay pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Hedef Okul</h2>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-1">{hedefOkul.isim}</h3>
                    <p className="text-sm opacity-80 flex items-center gap-2">
                       {hedefOkul.sehir} <span className="w-1 h-1 bg-white/50 rounded-full" /> Taban: {hedefOkul.minPuan}
                    </p>
                  </div>
                </div>
                <div className="flex bg-black/20 backdrop-blur-md rounded-2xl p-4 gap-6 shrink-0 w-full md:w-auto">
                  <div className="border-r border-white/20 pr-6">
                     <p className="text-xs opacity-70 uppercase tracking-wider font-semibold mb-1">Durum</p>
                     <p className="text-sm font-bold flex items-center gap-1.5">{yetisir ? <><CheckCircle2 className="w-4 h-4 text-green-400" /> Yetişir</> : <><Flame className="w-4 h-4 text-orange-400" /> Geridesin</>}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70 uppercase tracking-wider font-semibold mb-1">Tahmin</p>
                    <p className="text-2xl font-black leading-none">{hazirGun !== null ? hazirGun : "?"} <span className="text-xs opacity-70">gün</span></p>
                  </div>
               </div>
              </div>
            </div>
          ) : (
            <Link href="/hedef-okul" className="flex items-center gap-5 glass-panel border-dashed border-2 border-violet-500/30 rounded-3xl p-6 md:p-8 hover:border-violet-500/60 hover:bg-violet-500/5 transition-all group">
              <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-violet-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Hedef Okulunu Belirle</h3>
                <p className="text-sm text-foreground/60">Yapay zeka, hedefine giden en kısa yolu hesaplasın.</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center shadow-lg group-hover:w-12 transition-all">
                <ArrowRight className="w-5 h-5 text-background" />
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
                 <div className="glass-panel border-blue-500/20 bg-blue-500/5 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0">
                         <Brain className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">Test Çöz, Seviyeni Öğren</h3>
                        <p className="text-sm text-foreground/70">AI koçun henüz zayıf noktalarını bilmiyor. Seviyeni belirleyerek planını oluştur.</p>
                      </div>
                    </div>
                    <Link href="/diagnostic" className="w-full sm:w-auto whitespace-nowrap bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:-translate-y-1 transition-transform inline-flex items-center justify-center gap-2">
                       Seviye Belirle <ArrowRight className="w-5 h-5" />
                    </Link>
                 </div>
               ) : bugunTopicId ? (
                 <Link href={`/calis?topicId=${bugunTopicId}`} className="relative overflow-hidden group glass-panel rounded-3xl p-8 border-transparent hover:border-violet-500/30 transition-all shadow-xl hover:shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-indigo-600/5 z-0" />
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-violet-500/10 rounded-full blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                       <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">Koç Döngüsü Başlat</p>
                            <h3 className="text-2xl font-black mb-1">Sana Özel Bugünün Görevi</h3>
                            <p className="text-sm text-foreground/60">Algoritma sıradaki geliştirmen gereken konuyu belirledi.</p>
                          </div>
                       </div>
                       <div className="w-12 h-12 rounded-full border border-foreground/10 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors self-end sm:self-auto">
                         <ArrowRight className="w-5 h-5" />
                       </div>
                    </div>
                 </Link>
               ) : (
                <Link href="/konular" className="relative overflow-hidden group glass-panel rounded-3xl p-8 transition-all hover:-translate-y-1">
                  <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center">
                        <BookMarked className="w-8 h-8 text-foreground/70" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-1">Serbest Çalışma</p>
                        <h3 className="text-xl font-bold mb-1">Konu Seç ve Çalış</h3>
                        <p className="text-sm text-foreground/60">Dilediğin eksiğini yapay zeka ile kapat.</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
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
            {coachComment && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="glass-panel rounded-3xl p-6 relative overflow-hidden border-violet-500/30 bg-violet-500/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[40px] pointer-events-none rounded-full" />
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-foreground/10 pb-4">
                    <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-violet-500/20">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">AI Koç Analizi</h3>
                      <p className="text-xs text-foreground/50">Haftalık Zeka Raporu</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed font-medium text-foreground/80">"{coachComment.yorum}"</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {coachComment.toplamSoru > 0 && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-white/50 dark:bg-black/30 border border-foreground/10 flex items-center gap-1.5">
                        <PenTool className="w-3 h-3 text-violet-500" /> {coachComment.toplamSoru} Soru Çözümü
                      </span>
                    )}
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-white/50 dark:bg-black/30 border border-foreground/10 flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-emerald-500" /> %{Math.round(coachComment.dogruOrani * 100)} İsabet
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Hızlı Aksiyonlar ── */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h2 className="text-lg font-bold tracking-tight mb-4">Hızlı Erişim</h2>
              <div className="flex flex-col gap-3">
                <Link href="/deneme" className="glass-panel p-4 rounded-2xl flex items-center justify-between group hover:border-red-500/50 hover:bg-red-500/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm mb-0.5">LGS Denemesi</h4>
                       <p className="text-xs text-foreground/60">Simülasyon başlat</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-red-500 transition-colors" />
                </Link>
                <div className="glass-panel p-4 rounded-2xl flex items-center justify-between group opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm mb-0.5">Rozet ve Başarılar</h4>
                       <p className="text-xs text-foreground/60 mt-0.5"><span className="px-1.5 py-0.5 bg-foreground/10 rounded text-[9px] font-bold uppercase">Yakında</span></p>
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
