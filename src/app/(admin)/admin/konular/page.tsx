"use client";

import { useState } from "react";
import { trpc } from "../../../../lib/trpc";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", INGILIZCE: "İngilizce", DIN: "Din Kültürü",
};

export default function AdminKonularPage() {
  const [formAcik, setFormAcik] = useState(false);
  const [form, setForm] = useState({
    isim: "",
    ders: "MATEMATIK" as "TURKCE" | "MATEMATIK" | "FEN" | "SOSYAL" | "INGILIZCE" | "DIN",
    parentId: "",
    dersIcerigi: "",
    kazanimlar: "",
  });

  const { data: topics, isLoading, refetch } = trpc.admin.getTopics.useQuery();
  const createMutation = trpc.admin.createTopic.useMutation({
    onSuccess: () => { refetch(); setFormAcik(false); setForm({ isim: "", ders: "MATEMATIK", parentId: "", dersIcerigi: "", kazanimlar: "" }); },
  });
  const deleteMutation = trpc.admin.deleteTopic.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => alert(e.message),
  });

  const anaTopicler = topics?.filter(t => !t.parent) ?? [];

  const handleCreate = () => {
    if (!form.isim) return;
    createMutation.mutate({
      isim: form.isim,
      ders: form.ders,
      parentId: form.parentId || undefined,
      dersIcerigi: form.dersIcerigi || undefined,
      kazanimlar: form.kazanimlar ? form.kazanimlar.split("\n").filter(Boolean) : [],
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Konular</h1>
        <button
          onClick={() => setFormAcik(!formAcik)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Konu Ekle
        </button>
      </div>

      {formAcik && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Yeni Konu</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Konu Adı *</label>
              <input
                value={form.isim}
                onChange={e => setForm(f => ({ ...f, isim: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Konu adı..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ders *</label>
                <select
                  value={form.ders}
                  onChange={e => setForm(f => ({ ...f, ders: e.target.value as typeof form.ders }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(DERS_ISIM).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Üst Konu</label>
                <select
                  value={form.parentId}
                  onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Ana konu</option>
                  {anaTopicler.filter(t => t.ders === form.ders).map(t => (
                    <option key={t.id} value={t.id}>{t.isim}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Ders İçeriği</label>
            <textarea
              value={form.dersIcerigi}
              onChange={e => setForm(f => ({ ...f, dersIcerigi: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Konu anlatımı (koç döngüsünde görünür)..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Kazanımlar (her satır bir kazanım)</label>
            <textarea
              value={form.kazanimlar}
              onChange={e => setForm(f => ({ ...f, kazanimlar: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="1. Kazanım&#10;2. Kazanım..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button onClick={() => setFormAcik(false)} className="text-sm text-gray-500 hover:text-gray-700">
              İptal
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {topics?.map(topic => (
            <div key={topic.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {topic.parent && <span className="text-gray-300 text-sm">└─</span>}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {DERS_ISIM[topic.ders] ?? topic.ders}
                    </span>
                    <span className="font-medium text-gray-900 text-sm">{topic.isim}</span>
                    {topic.dersIcerigi && (
                      <span className="text-xs text-green-600">· içerik var</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 ml-6">
                    {topic._count.questions} soru · {topic._count.children} alt konu
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`"${topic.isim}" silinsin mi?`)) {
                      deleteMutation.mutate({ id: topic.id });
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
          {topics?.length === 0 && (
            <div className="text-center py-12 text-gray-400">Henüz konu yok.</div>
          )}
        </div>
      )}
    </div>
  );
}
