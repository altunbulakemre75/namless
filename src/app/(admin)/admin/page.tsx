"use client";

import { trpc } from "../../../lib/trpc";

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  const kartlar = [
    { etiket: "Toplam Kullanıcı", deger: stats?.kullaniciSayisi ?? 0, renk: "text-blue-600", ikon: "👥" },
    { etiket: "Toplam Soru", deger: stats?.soruSayisi ?? 0, renk: "text-green-600", ikon: "📝" },
    { etiket: "Yayınlanan Soru", deger: stats?.yayinlanmisSoru ?? 0, renk: "text-emerald-600", ikon: "✅" },
    { etiket: "Toplam Konu", deger: stats?.konuSayisi ?? 0, renk: "text-purple-600", ikon: "📚" },
    { etiket: "Toplam Deneme", deger: stats?.denemeSayisi ?? 0, renk: "text-orange-600", ikon: "⏱️" },
    { etiket: "Bugün Aktif", deger: stats?.bugunAktif ?? 0, renk: "text-red-600", ikon: "🔥" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Genel Bakış</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {kartlar.map((k) => (
          <div key={k.etiket} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{k.ikon}</span>
              <p className="text-sm text-gray-500">{k.etiket}</p>
            </div>
            <p className={`text-3xl font-bold ${k.renk}`}>{k.deger.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
        <p className="font-semibold mb-1">Hızlı İşlemler</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Soru eklemek için sol menüden <strong>Sorular</strong> seçin</li>
          <li>Konu yönetimi için <strong>Konular</strong> seçin</li>
          <li>Kullanıcı tier değiştirmek için <strong>Kullanıcılar</strong> seçin</li>
        </ul>
      </div>
    </div>
  );
}
