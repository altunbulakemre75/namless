"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Lock, User, GraduationCap, CheckCircle2, AlertCircle } from "lucide-react";

interface DiagnosticResult {
  cevaplar: Array<{
    questionId: string;
    secilenSik: number;
    dogruMu: boolean;
    ders: string;
    konuIsim: string;
  }>;
  dersSkorlar: Record<string, { dogru: number; toplam: number }>;
  toplamDogru: number;
  toplamSoru: number;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isim, setIsim] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sinif, setSinif] = useState("8");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [diagnosticVar, setDiagnosticVar] = useState(false);

  useEffect(() => {
    const result = localStorage.getItem("lgs_diagnostic_result");
    if (result) setDiagnosticVar(true);
  }, []);

  const kayitOl = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);

    if (sifre.length < 6) {
      setHata("Şifre en az 6 karakter olmalıdır.");
      setYukleniyor(false);
      return;
    }

    const diagnosticRaw = localStorage.getItem("lgs_diagnostic_result");
    const diagnosticResult: DiagnosticResult | null = diagnosticRaw
      ? JSON.parse(diagnosticRaw)
      : null;

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: sifre,
      options: {
        data: {
          isim,
          sinif: parseInt(sinif),
          rol: "STUDENT",
          ...(diagnosticResult
            ? {
                diagnosticSkorlar: diagnosticResult.dersSkorlar,
                diagnosticToplam: `${diagnosticResult.toplamDogru}/${diagnosticResult.toplamSoru}`,
              }
            : {}),
        },
      },
    });

    if (error) {
      setHata(
        error.message === "User already registered"
          ? "Bu e-posta zaten kayıtlı."
          : "Kayıt sırasında bir hata oluştu."
      );
      setYukleniyor(false);
      return;
    }

    setBasarili(true);
    setYukleniyor(false);

    setTimeout(() => router.push("/auth/login"), 2500);
  };

  if (basarili) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-green-500/10 blur-[100px] rounded-full" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-panel p-10 rounded-3xl text-center relative z-10"
        >
           <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
           >
             <CheckCircle2 className="w-10 h-10" />
           </motion.div>
          <h2 className="text-2xl font-bold mb-3">Kayıt Başarılı!</h2>
          <p className="text-foreground/60 mb-6 leading-relaxed">
            E-postanı doğruladıktan sonra giriş yapabilirsin. Gelen kutunu (ve gereksiz klasörünü) kontrol etmeyi unutma.
          </p>
          {diagnosticVar && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Deneme sonuçların güvenle kaydedildi. Giriş yaptığında AI çalışma planın seni bekliyor olacak.
              </p>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-foreground/40 mt-4">
             <Loader2 className="w-4 h-4 animate-spin" />
             Giriş sayfasına yönlendiriliyorsun...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-violet-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10 py-6"
      >
        <Link href="/" className="inline-flex items-center text-sm font-medium text-foreground/60 hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ana Sayfaya Dön
        </Link>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Başlıyoruz 🚀</h2>
          <p className="text-foreground/60 text-sm">Hedefindeki liseye giden yolu birlikte aydınlatalım.</p>
        </div>

        {diagnosticVar && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 flex gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                Seviye belirleme sonuçların hazır!
              </p>
              <p className="text-xs text-green-600 dark:text-green-500/80 mt-1">
                Kayıt olduktan sonra bu sonuçlara göre kişisel çalışma planın oluşturulacak.
              </p>
            </div>
          </motion.div>
        )}

        <div className="glass-panel p-8 rounded-3xl relative">
          <form onSubmit={kayitOl} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5 ml-1">Adın Soyadın</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-foreground/40" />
                </div>
                <input
                  type="text"
                  value={isim}
                  onChange={(e) => setIsim(e.target.value)}
                  required
                  placeholder="Ahmet Yılmaz"
                  className="w-full pl-11 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-foreground/30"
                />
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-foreground/80 mb-1.5 ml-1">Sınıf</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap className="w-5 h-5 text-foreground/40" />
                  </div>
                  <select
                    value={sinif}
                    onChange={(e) => setSinif(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="6" className="dark:bg-zinc-800">6. Sınıf</option>
                    <option value="7" className="dark:bg-zinc-800">7. Sınıf</option>
                    <option value="8" className="dark:bg-zinc-800">8. Sınıf (LGS)</option>
                  </select>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
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
                    placeholder="Min 6 Karakter"
                    className="w-full pl-11 pr-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-foreground/30"
                  />
                </div>
              </div>
            </div>

            {hata && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {hata}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={yukleniyor}
              className={`w-full py-4 rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 ${
                diagnosticVar 
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-violet-500/30" 
                  : "bg-foreground text-background"
              }`}
            >
              {yukleniyor ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {diagnosticVar ? "Planın Hazırlanıyor..." : "Kayıt Olunuyor..."}
                </>
              ) : (
                diagnosticVar ? "Kayıt Ol ve Planımı Oluştur" : "Kayıt Ol"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-foreground/10 text-center text-sm text-foreground/60">
            Zaten hesabın var mı?{" "}
            <Link href="/auth/login" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
              Giriş Yap
            </Link>
          </div>
        </div>

        {!diagnosticVar && (
          <div className="mt-6 text-center">
            <Link
              href="/diagnostic"
              className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-1 group"
            >
              Önce seviyeni belirlemek ister misin? 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
