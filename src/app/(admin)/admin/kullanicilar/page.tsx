"use client";

import { useState } from "react";
import { trpc } from "../../../../lib/trpc";

const TIER_LABEL: Record<string, string> = {
  FREE: "Ücretsiz", BASIC: "Temel", PREMIUM: "Premium",
};
const TIER_RENK: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-600",
  BASIC: "bg-blue-100 text-blue-700",
  PREMIUM: "bg-yellow-100 text-yellow-700",
};
const ROL_RENK: Record<string, string> = {
  STUDENT: "bg-gray-50 text-gray-500",
  PARENT: "bg-purple-50 text-purple-600",
  ADMIN: "bg-red-50 text-red-600",
};

export default function AdminKullanicilarPage() {
  const [tierFilter, setTierFilter] = useState<"FREE" | "BASIC" | "PREMIUM" | undefined>(undefined);
  const [sayfa, setSayfa] = useState(0);

  const { data, isLoading, refetch } = trpc.admin.getUsers.useQuery({ tier: tierFilter, sayfa });
  const updateTierMutation = trpc.admin.updateUserTier.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kullanıcılar</h1>
        <p className="text-sm text-gray-500">Toplam: {data?.toplam ?? "—"}</p>
      </div>

      {/* Tier Filtreleri */}
      <div className="flex gap-2 mb-5">
        {[undefined, "FREE", "BASIC", "PREMIUM"].map((t) => (
          <button
            key={t ?? "all"}
            onClick={() => { setTierFilter(t as typeof tierFilter); setSayfa(0); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tierFilter === t
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t ? TIER_LABEL[t] : "Tümü"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl border h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.users.map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-900 text-sm">{u.isim}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROL_RENK[u.rol]}`}>
                      {u.rol}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_RENK[u.subscriptionTier]}`}>
                      {TIER_LABEL[u.subscriptionTier]}
                    </span>
                    {u.currentStreak > 0 && (
                      <span className="text-xs text-orange-500">🔥 {u.currentStreak}g</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {u.email} · {u._count.attempts} deneme · {u._count.mockExams} sınav ·{" "}
                    {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="shrink-0">
                  <select
                    value={u.subscriptionTier}
                    onChange={e =>
                      updateTierMutation.mutate({
                        userId: u.id,
                        tier: e.target.value as "FREE" | "BASIC" | "PREMIUM",
                      })
                    }
                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700"
                  >
                    <option value="FREE">Ücretsiz</option>
                    <option value="BASIC">Temel</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {data?.users.length === 0 && (
            <div className="text-center py-12 text-gray-400">Bu filtre için kullanıcı bulunamadı.</div>
          )}
        </div>
      )}

      {/* Sayfalama */}
      {data && data.toplam > 20 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setSayfa(s => Math.max(0, s - 1))}
            disabled={sayfa === 0}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-40"
          >
            ← Önceki
          </button>
          <span className="text-sm text-gray-500">
            {sayfa + 1} / {data.sayfaSayisi}
          </span>
          <button
            onClick={() => setSayfa(s => s + 1)}
            disabled={sayfa >= data.sayfaSayisi - 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-40"
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}
