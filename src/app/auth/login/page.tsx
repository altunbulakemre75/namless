"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

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
      setHata("E-posta veya şifre hatalı.");
      setYukleniyor(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            LGS AI Kocu
          </Link>
          <p className="text-gray-500 mt-2">Hesabına giriş yap</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={girisYap} className="space-y-4">
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
                Şifre
              </label>
              <input
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                required
                placeholder="••••••••"
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
              {yukleniyor ? "Giris yapiliyor..." : "Giris Yap"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Hesabın yok mu?{" "}
            <Link
              href="/auth/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Kayıt ol
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
