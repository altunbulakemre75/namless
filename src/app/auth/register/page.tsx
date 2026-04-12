"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

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

    // Diagnostic sonuclarini al
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
          // Diagnostic sonuclari metadata'ya kaydet
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

    // Basarili kayit
    setBasarili(true);
    setYukleniyor(false);

    // Diagnostic sonuclarini temizle
    localStorage.removeItem("lgs_diagnostic_result");

    setTimeout(() => router.push("/auth/login"), 2000);
  };

  if (basarili) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <p className="text-5xl mb-4">✓</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Kayıt Başarılı!</h2>
          <p className="text-gray-500 text-sm mb-4">
            E-postanı doğruladıktan sonra giriş yapabilirsin.
          </p>
          {diagnosticVar && (
            <p className="text-sm text-blue-600 font-medium">
              Deneme sonuçların kaydedildi — giriş yaptığında çalışma planın hazır olacak.
            </p>
          )}
          <p className="text-xs text-gray-400 mt-3">Giriş sayfasına yönlendiriliyorsun...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            LGS AI Koçu
          </Link>
          <p className="text-gray-500 mt-2">Ücretsiz hesap oluştur</p>
        </div>

        {/* Diagnostic sonuc ozeti */}
        {diagnosticVar && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-green-800">
              ✓ Seviye belirleme sonuçların hazır!
            </p>
            <p className="text-xs text-green-600 mt-1">
              Kayıt olduktan sonra bu sonuçlara göre kişisel çalışma planın oluşturulacak.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={kayitOl} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adın
              </label>
              <input
                type="text"
                value={isim}
                onChange={(e) => setIsim(e.target.value)}
                required
                placeholder="Adın Soyadın"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ornek@gmail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sınıf
              </label>
              <select
                value={sinif}
                onChange={(e) => setSinif(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="6">6. Sınıf</option>
                <option value="7">7. Sınıf</option>
                <option value="8">8. Sınıf (LGS)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                required
                placeholder="En az 6 karakter"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {hata && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {hata}
              </div>
            )}

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {yukleniyor ? "Kayıt olunuyor..." : diagnosticVar ? "Kayıt Ol ve Planımı Oluştur" : "Kayıt Ol"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Zaten hesabın var mı?{" "}
            <Link
              href="/auth/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Giriş yap
            </Link>
          </div>
        </div>

        {!diagnosticVar && (
          <div className="mt-4 text-center">
            <Link
              href="/diagnostic"
              className="text-sm text-blue-600 hover:underline"
            >
              Önce seviyeni belirlemek ister misin? →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
