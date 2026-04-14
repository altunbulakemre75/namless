"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const girisYap = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: sifre,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setHata("E-posta adresin henüz doğrulanmamış. Gelen kutunu kontrol et.");
      } else if (error.message.toLowerCase().includes("invalid login credentials")) {
        setHata("E-posta veya şifre hatalı.");
      } else {
        setHata("Giriş yapılamadı: " + error.message);
      }
      setYukleniyor(false);
      return;
    }

    const hasDiagnostic = localStorage.getItem("lgs_diagnostic_result");
    router.push(hasDiagnostic ? "/auth/callback" : "/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Arka Plan Glow Efektleri */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-violet-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        <Link href="/" className="inline-flex items-center text-sm font-medium text-foreground/60 hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ana Sayfaya Dön
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
            <span className="text-white font-black text-sm">LGS</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Tekrar Hoş Geldin</h2>
          <p className="text-foreground/60 text-sm">Hedefine ulaşmak için çalışmaya devam et.</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl relative">
          <form onSubmit={girisYap} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5 ml-1">E-posta</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-foreground/40" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ornek@gmail.com"
                  className="w-full pl-11 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-foreground/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5 ml-1">Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-foreground/40" />
                </div>
                <input
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-foreground/30"
                />
              </div>
            </div>

            {hata && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {hata}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full bg-foreground text-background py-3.5 rounded-xl font-semibold shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {yukleniyor ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-foreground/10 text-center text-sm text-foreground/60">
            Hesabın yok mu?{" "}
            <Link href="/auth/register" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
              Ücretsiz Kayıt Ol
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
