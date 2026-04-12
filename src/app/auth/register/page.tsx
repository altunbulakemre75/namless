"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [isim, setIsim] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sinif, setSinif] = useState("8");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basarili, setBasarili] = useState(false);

  const kayitOl = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);

    if (sifre.length < 6) {
      setHata("Şifre en az 6 karakter olmalıdır.");
      setYukleniyor(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: sifre,
      options: {
        data: {
          isim,
          sinif: parseInt(sinif),
          rol: "STUDENT",
        },
      },
    });

    if (error) {
      setHata(error.message === "User already registered"
        ? "Bu e-posta zaten kayıtlı."
        : "Kayıt sırasında bir hata oluştu.");
      setYukleniyor(false);
      return;
    }

    setBasarili(true);
    setYukleniyor(false);

    // 2 saniye sonra girise yonlendir
    setTimeout(() => router.push("/auth/login"), 2000);
  };

  if (basarili) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Kayıt Başarılı!
          </h2>
          <p className="text-gray-500 text-sm">
            E-postanı doğruladıktan sonra giriş yapabilirsin.
            Yönlendiriliyorsun...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            LGS AI Kocu
          </Link>
          <p className="text-gray-500 mt-2">Ücretsiz hesap oluştur</p>
        </div>

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
              {yukleniyor ? "Kayıt olunuyor..." : "Kayıt Ol"}
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
      </div>
    </div>
  );
}
