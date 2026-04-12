"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "../../lib/trpc";

export default function HedefOkulPage() {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [secilenId, setSecilenId] = useState<string | null>(null);
  const [gunlukSure, setGunlukSure] = useState(60);
  const [sonuc, setSonuc] = useState<{ okul: string; tahminiGun: number } | null>(null);

  const { data: okullar, isLoading } = trpc.learning.getSchools.useQuery({});
  const setMutation = trpc.learning.setTargetSchool.useMutation();

  const filtrelenmis = okullar?.filter((o) =>
    o.isim.toLowerCase().includes(arama.toLowerCase()) ||
    o.sehir.toLowerCase().includes(arama.toLowerCase())
  ) ?? [];

  const okulSec = async () => {
    if (!secilenId) return;
    try {
      const res = await setMutation.mutateAsync({
        schoolId: secilenId,
        dailyStudyMins: gunlukSure,
      });
      setSonuc({ okul: res.okul, tahminiGun: res.tahminiGun });
    } catch {
      // Auth gerekli
      router.push("/auth/login");
    }
  };

  if (sonuc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <h1 className="text-xl font-bold mb-2">Hedefin Belirlendi!</h1>
          <p className="text-lg font-semibold text-blue-600 mb-1">{sonuc.okul}</p>
          <div className="my-6 bg-blue-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-blue-700">{sonuc.tahminiGun} gün</p>
            <p className="text-sm text-blue-500">tahmini hazırlanma süresi</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Günde {gunlukSure} dakika çalışarak bu hedefe ulaşabilirsin. Plan haftalık güncellenir.
          </p>
          <Link
            href="/dashboard"
            className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Çalışmaya Başla
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Hedef Okul Seç</h1>
        <p className="text-gray-500 mb-6">Hedef okulunu seç, sana özel yol haritası oluşturalım.</p>

        {/* Gunluk sure secimi */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Günde kaç dakika çalışabilirsin?</label>
          <div className="flex gap-2">
            {[30, 60, 90, 120, 180].map((dk) => (
              <button
                key={dk}
                onClick={() => setGunlukSure(dk)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  gunlukSure === dk ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {dk >= 60 ? `${dk / 60} saat` : `${dk} dk`}
              </button>
            ))}
          </div>
        </div>

        {/* Arama */}
        <input
          type="text"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Okul adı veya şehir ara..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Okul listesi */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filtrelenmis.map((okul) => (
              <button
                key={okul.id}
                onClick={() => setSecilenId(okul.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  secilenId === okul.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{okul.isim}</p>
                    <p className="text-xs text-gray-500">{okul.sehir}{okul.ilce ? ` / ${okul.ilce}` : ""} · {okul.tur}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{okul.minPuan}</p>
                    <p className="text-xs text-gray-400">taban puan</p>
                  </div>
                </div>
              </button>
            ))}

            {filtrelenmis.length === 0 && (
              <p className="text-center py-6 text-gray-400">Okul bulunamadı</p>
            )}
          </div>
        )}

        {/* Sec butonu */}
        {secilenId && (
          <button
            onClick={okulSec}
            disabled={setMutation.isPending}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {setMutation.isPending ? "Hesaplanıyor..." : "Bu Okulu Hedefle"}
          </button>
        )}
      </div>
    </div>
  );
}
