"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  BookOpen, Calculator, Beaker, Globe, Sparkles, Target, 
  Brain, BarChart3, AlertCircle, ArrowRight, Zap, CheckCircle 
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
  { icon: Target, baslik: "Hedef Okul Tahmini", aciklama: "Hedef Lisesi için kaç günde hazır olursun? Gerçek veri ile tahmin.", gradient: "from-indigo-500 to-blue-500" },
  { icon: Brain, baslik: "AI Konu Anlatımı", aciklama: "Her konuyu sana anında anlatan, sana özel örnekler veren asistan.", gradient: "from-violet-500 to-purple-500" },
  { icon: BarChart3, baslik: "Bayesian Mastery", aciklama: "Doğru/yanlış değil, bilgi kalıcılığını olasılıkla ölç ve takip et.", gradient: "from-blue-500 to-cyan-500" },
  { icon: AlertCircle, baslik: "Hata Analizi", aciklama: "Dikkatsizlik mi, kavram eksikliği mi? AI hatanı sınıflandırıyor.", gradient: "from-orange-500 to-red-500" },
];

const NASIL = [
  { adim: "1", baslik: "Seviyeni Belirle", aciklama: "AI adaptif test ile gerçek seviyeni ölç, zayıf yanlarını gör." },
  { adim: "2", baslik: "Hedef Seç", aciklama: "Hayalindeki liseyi seç, yapay zeka senin için rotayı çizsin." },
  { adim: "3", baslik: "Her Gün Çalış", aciklama: "Sana özel hazırlanan günlük planda koçunla eksiklerini kapat." },
  { adim: "4", baslik: "Gerçek Sınav Stresi", aciklama: "LGS formatında hazırlanan denemelerle sınav provası yap." },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      {/* ── Background Glow ── */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 dark:bg-violet-900/30 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-blue-600/20 dark:bg-blue-900/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 dark:bg-indigo-900/20 blur-[120px]" />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 inset-x-0 glass z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white font-black text-sm tracking-tighter">LGS</span>
            </div>
            <span className="font-bold text-lg tracking-tight">AI Koçu</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="bg-foreground text-background px-5 py-2.5 rounded-full hover:scale-105 transition-transform text-sm font-semibold shadow-md dark:shadow-none"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-20">
        {/* ── Hero ── */}
        <section className="px-6 mb-32">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 border-violet-500/20">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-medium">LGS 2026 İçin Yapay Zeka Koçun Hazır</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
              Yapay Zeka ile <br />
              <span className="text-gradient">
                Sınavda Fark Yarat
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-foreground/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              Özel denemeler, zayıf nokta analizi ve saniye saniye takip edilen motivasyon grafiğiyle hayalindeki liseye giden yolu aydınlat.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold text-base shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                Hemen Başla — Ücretsiz <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/diagnostic"
                className="w-full sm:w-auto glass text-foreground px-8 py-4 rounded-full font-semibold text-base hover:bg-foreground/5 transition-all"
              >
                Seviyemi Ölç
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ── İstatistikler / LGS Dersleri ── */}
        <section className="px-6 mb-32 max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-6 gap-4"
          >
            {DERSLER.map((ders) => {
              const IconComp = ders.icon;
              return (
                <motion.div 
                  key={ders.key} 
                  variants={fadeInUp}
                  className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center text-center hover:-translate-y-2 transition-transform duration-300 group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${ders.bg} transition-colors group-hover:scale-110 duration-300`}>
                    <IconComp className={`w-6 h-6 ${ders.color}`} />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{ders.isim}</h3>
                  <p className="text-xs text-foreground/50">{ders.soru} Soru</p>
                </motion.div>
              )
            })}
          </motion.div>
        </section>

        {/* ── Özel Tasarım Özellikler (Bento Grid) ── */}
        <section className="px-6 mb-32">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-black mb-4">Sadece Soru Değil, <span className="text-gradient">Strateji</span></h2>
              <p className="text-foreground/60 max-w-2xl mx-auto">Sıradan test kitaplarının aksine, zayıf yanlarını öğrenen bir sistem.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {OZELLIKLER.map((ozellik, i) => {
                const Icon = ozellik.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-panel rounded-3xl p-8 relative overflow-hidden group"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${ozellik.gradient} opacity-20 blur-3xl rounded-full group-hover:opacity-40 transition-opacity`} />
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ozellik.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{ozellik.baslik}</h3>
                    <p className="text-foreground/70 leading-relaxed">{ozellik.aciklama}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Nasıl Çalışır ── */}
        <section className="px-6 mb-32 relative">
          <div className="max-w-6xl mx-auto relative z-10 glass-panel rounded-[2.5rem] p-8 md:p-16">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4">4 Adımda Zafere Ulaş</h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {NASIL.map((adim, i) => (
                <div key={adim.adim} className="relative">
                  {i !== 3 && <div className="hidden md:block absolute top-8 left-[60%] w-[100%] h-[2px] bg-gradient-to-r from-violet-500/20 to-transparent" />}
                  <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mb-6 text-2xl font-black text-violet-500 border border-foreground/10">
                    {adim.adim}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{adim.baslik}</h3>
                  <p className="text-sm text-foreground/60">{adim.aciklama}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-foreground/10 bg-background/50 backdrop-blur pb-8 pt-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <span className="text-background text-[10px] font-black tracking-widest">LGS</span>
            </div>
            <span className="font-bold tracking-tight">AI Koçu</span>
          </div>
          <p className="text-sm text-foreground/50 text-center">
            &copy; {new Date().getFullYear()} LGS AI Koçu. Tüm hakları gizlidir.
          </p>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/auth/login" className="text-foreground/60 hover:text-foreground transition-colors">Giriş Yap</Link>
            <Link href="/auth/register" className="text-foreground/60 hover:text-foreground transition-colors">Kayıt Ol</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
