"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  BookOpen, Calculator, Beaker, Globe, Sparkles, Target, 
  Brain, BarChart3, AlertCircle, ArrowRight, Zap, Play, CheckCircle
} from "lucide-react";

const DERSLER = [
  { isim: "Türkçe", key: "TURKCE", icon: BookOpen, color: "text-rose-500", bg: "bg-rose-500/10", soru: 20 },
  { isim: "Matematik", key: "MATEMATIK", icon: Calculator, color: "text-blue-500", bg: "bg-blue-500/10", soru: 20 },
  { isim: "Fen Bilimleri", key: "FEN", icon: Beaker, color: "text-emerald-500", bg: "bg-emerald-500/10", soru: 20 },
  { isim: "Sosyal Bilgiler", key: "SOSYAL", icon: Globe, color: "text-orange-500", bg: "bg-orange-500/10", soru: 10 },
  { isim: "Din Kültürü", key: "DIN", icon: Sparkles, color: "text-teal-500", bg: "bg-teal-500/10", soru: 10 },
  { isim: "İngilizce", key: "INGILIZCE", icon: Zap, color: "text-violet-500", bg: "bg-violet-500/10", soru: 10 },
];

const OZELLIKLER = [
  { icon: Target, baslik: "Hedef Okul Tahmini", aciklama: "Hedef Lisesi için kaç günde hazır olursun? Gerçek veri ile tahmin.", gradient: "from-indigo-500 to-blue-500", delay: 0.1 },
  { icon: Brain, baslik: "AI Konu Anlatımı", aciklama: "Her konuyu sana anında anlatan, sana özel örnekler veren asistan.", gradient: "from-violet-500 to-fuchsia-500", delay: 0.2 },
  { icon: BarChart3, baslik: "Bayesian Mastery", aciklama: "Doğru/yanlış değil, bilgi kalıcılığını olasılıkla ölç ve takip et.", gradient: "from-blue-500 to-cyan-500", delay: 0.3 },
  { icon: AlertCircle, baslik: "Hata Analizi", aciklama: "Dikkatsizlik mi, kavram eksikliği mi? AI hatanı sınıflandırıyor.", gradient: "from-amber-500 to-red-500", delay: 0.4 },
];

const NASIL = [
  { adim: "1", baslik: "Seviyeni Belirle", aciklama: "AI adaptif test ile gerçek seviyeni ölç, zayıf yanlarını gör." },
  { adim: "2", baslik: "Hedef Seç", aciklama: "Hayalindeki liseyi seç, yapay zeka senin için rotayı çizsin." },
  { adim: "3", baslik: "Her Gün Çalış", aciklama: "Sana özel hazırlanan günlük planda koçunla eksiklerini kapat." },
  { adim: "4", baslik: "Sınav Günü", aciklama: "LGS formatında hazırlanan denemelerle sınav provası yap." },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 300]);

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] dark:bg-[#0a0a0c] text-foreground overflow-hidden selection:bg-violet-500/30">
      
      {/* ── Dynamic Background Mesh ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 dark:bg-violet-900/40 blur-[150px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[60%] rounded-full bg-blue-600/5 dark:bg-blue-900/30 blur-[150px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-indigo-600/10 dark:bg-indigo-900/40 blur-[150px] animate-[pulse_12s_ease-in-out_infinite]" />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/60 dark:bg-black/40 backdrop-blur-2xl border-b border-foreground/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          
          {/* Sol - Logo */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white font-black text-base tracking-tighter">LGS</span>
            </div>
            <span className="font-bold text-xl md:text-2xl tracking-tight">AI Koçu</span>
          </div>

          {/* Orta - Navigasyon (Masaüstü için) */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#ozellikler" className="text-sm font-semibold text-foreground/60 hover:text-foreground transition-colors mix-blend-difference">Özellikler</a>
            <a href="#nasil-calisir" className="text-sm font-semibold text-foreground/60 hover:text-foreground transition-colors mix-blend-difference">Sistemimiz</a>
            <a href="#sss" className="text-sm font-semibold text-foreground/60 hover:text-foreground transition-colors mix-blend-difference">S.S.S</a>
          </nav>

          {/* Sağ - Butonlar */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/auth/login" className="text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors hidden sm:block">
              Giriş Yap
            </Link>
            <Link href="/auth/register" className="relative group overflow-hidden bg-foreground text-background px-6 py-3 rounded-full hover:scale-105 transition-all text-sm font-bold shadow-xl flex items-center justify-center">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-violet-500 to-indigo-500 group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
              <span className="relative z-10 group-hover:text-white transition-colors duration-500">Ücretsiz Başla</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-20 relative z-10">
        
        {/* ── Hero Section ── */}
        <section className="px-6 mb-40 relative">
          <motion.div 
            style={{ y: heroY }}
            className="max-w-7xl mx-auto flex flex-col items-center text-center relative"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Floating Mockup Widgets (for visual richnes in Hero) */}
            <motion.div 
              initial={{ opacity: 0, x: -50, y: 20 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute left-[5%] top-[10%] hidden lg:flex flex-col gap-2 glass-panel p-4 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl rotate-[-6deg] hover:rotate-0 transition-all cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center border border-emerald-500/20"><Target className="w-5 h-5"/></div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase text-foreground/50 tracking-wider">Tahmin</p>
                  <p className="text-sm font-bold">Galatasaray Lisesi</p>
                </div>
              </div>
              <div className="mt-2 w-full h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-emerald-500 rounded-full" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50, y: 20 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }}
              className="absolute right-[5%] top-[25%] hidden lg:flex flex-col gap-2 glass-panel p-4 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl rotate-[6deg] hover:rotate-0 transition-all cursor-default"
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30"><Brain className="w-5 h-5"/></div>
                 <div className="text-left">
                  <p className="text-sm font-bold">Zayıf Nokta Bulundu!</p>
                  <p className="text-[10px] text-foreground/60">Üslü Sayılar (%34 Başarı)</p>
                 </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-foreground/5 backdrop-blur-md px-5 py-2.5 rounded-full mb-8 border border-foreground/10 hover:bg-foreground/10 transition-colors cursor-pointer">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">LGS 2026 İçin Yapay Zeka Koçun Hazır</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-black mb-8 leading-[1.05] tracking-tighter">
              Yapay Zeka ile <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 animate-gradient-x">
                Sınavda Fark Yarat
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-2xl text-foreground/60 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Sıradan test kitaplarını unut. Zayıf noktalarını tespit eden, saniye saniye takip eden ve sana özel çalışan dijital koçunla hayalindeki liseyi kazan.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto group relative flex items-center justify-center gap-2 bg-foreground text-background px-8 py-5 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-[0_0_40px_rgba(124,58,237,0.3)] hover:shadow-[0_0_60px_rgba(124,58,237,0.5)]"
              >
                Hemen Başla — Ücretsiz
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/diagnostic"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-foreground/10 text-foreground px-8 py-5 rounded-full font-semibold text-lg hover:bg-background transition-all"
              >
                <Play className="w-5 h-5" /> <span>Seviyemi Ölç</span>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ── İstatistikler / LGS Dersleri ── */}
        <section className="px-6 mb-40 max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-4 md:gap-6"
          >
            {DERSLER.map((ders) => {
              const IconComp = ders.icon;
              return (
                <motion.div 
                  key={ders.key} 
                  variants={fadeInUp}
                  className="bg-white/60 dark:bg-white-[0.02] backdrop-blur-xl border border-foreground/5 shadow-xl shadow-foreground/5 p-6 rounded-3xl flex flex-col items-center justify-center text-center hover:-translate-y-2 transition-all duration-300 group cursor-pointer w-[140px] md:w-[180px]"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${ders.bg} transition-colors group-hover:scale-110 duration-300`}>
                    <IconComp className={`w-7 h-7 ${ders.color}`} />
                  </div>
                  <h3 className="font-bold text-base mb-1 text-foreground/90">{ders.isim}</h3>
                  <p className="text-xs font-semibold text-foreground/40">{ders.soru} Soru</p>
                </motion.div>
              )
            })}
          </motion.div>
        </section>

        {/* ── Özel Tasarım Özellikler (Bento Grid) ── */}
        <section className="px-6 mb-40">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Sadece Soru Değil,<br className="md:hidden"/> <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">Strateji Üretir.</span></h2>
              <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-medium">Bambaşka bir öğrenme deneyimi. Zayıf yanlarını anında tespit et, detaylı istatistiklerle hedefine odaklan.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {OZELLIKLER.map((ozellik, i) => {
                const Icon = ozellik.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: ozellik.delay, duration: 0.6 }}
                    className="bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-foreground/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group hover:border-violet-500/30 transition-colors shadow-2xl shadow-foreground/5"
                  >
                    <div className={`absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br ${ozellik.gradient} opacity-10 blur-[80px] rounded-full group-hover:opacity-30 transition-opacity duration-700`} />
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${ozellik.gradient} flex items-center justify-center mb-8 shadow-xl`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4 tracking-tight">{ozellik.baslik}</h3>
                    <p className="text-lg text-foreground/60 leading-relaxed font-medium">{ozellik.aciklama}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Nasıl Çalışır ── */}
        <section className="px-6 mb-32 relative">
          <div className="max-w-7xl mx-auto relative z-10 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 border border-foreground/5 rounded-[3rem] p-10 md:p-24 overflow-hidden shadow-2xl shadow-violet-500/5">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
            
            <div className="text-center mb-20 relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-6">4 Adımda Zafere Ulaş</h2>
              <p className="text-foreground/60 text-lg">Başarı tesadüf değildir. Planlı ilerleyen bir sürecin sonucudur.</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-12 md:gap-8 relative z-10">
              {NASIL.map((adim, i) => (
                <div key={adim.adim} className="relative flex flex-col items-center text-center group">
                  {i !== 3 && <div className="hidden md:block absolute top-10 left-[60%] w-[100%] h-[3px] bg-gradient-to-r from-violet-500/30 to-transparent" />}
                  
                  <div className="w-20 h-20 rounded-3xl bg-white dark:bg-black border border-foreground/10 flex items-center justify-center mb-8 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl group-hover:scale-110 transition-transform duration-500">
                    {adim.adim}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{adim.baslik}</h3>
                  <p className="text-base text-foreground/60 leading-relaxed font-medium max-w-[250px] mx-auto">{adim.aciklama}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-foreground/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl pb-10 pt-16 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
              <span className="text-background text-xs font-black tracking-widest">LGS</span>
            </div>
            <span className="font-bold tracking-tight text-lg">AI Koçu</span>
          </div>
          <p className="text-sm text-foreground/50 font-medium">
            &copy; {new Date().getFullYear()} Namless AI. Tüm hakları gizlidir.
          </p>
          <div className="flex gap-8 text-sm font-bold">
            <Link href="/auth/login" className="text-foreground/60 hover:text-foreground transition-colors">Giriş Yap</Link>
            <Link href="/auth/register" className="text-foreground/60 hover:text-foreground transition-colors">Kayıt Ol</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
