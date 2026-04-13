"use client";

import { useState } from "react";
import { trpc } from "../../../../lib/trpc";

type StatusFilter = "DRAFT" | "REVIEWED" | "PUBLISHED" | "FLAGGED" | undefined;

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Taslak", REVIEWED: "İncelendi", PUBLISHED: "Yayında", FLAGGED: "İşaretlendi",
};
const STATUS_RENK: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  REVIEWED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
  FLAGGED: "bg-red-100 text-red-700",
};
const ZORLUK_LABEL: Record<number, string> = { 1: "Kolay", 2: "Orta", 3: "Zor" };

export default function AdminSorularPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [sayfa, setSayfa] = useState(0);
  const [formAcik, setFormAcik] = useState(false);
  const [form, setForm] = useState({
    topicId: "", kaynak: "OGRETMEN" as "CIKMIS" | "AI_URETIM" | "OGRETMEN",
    zorluk: 2, soruMetni: "", siklar: ["", "", "", ""], dogruSik: 0, aciklama: "",
  });

  const { data, isLoading, refetch } = trpc.admin.getQuestions.useQuery({ status: statusFilter, sayfa });
  const { data: topics } = trpc.learning.getTopicsForBrowse.useQuery();
  const createMutation = trpc.admin.createQuestion.useMutation({ onSuccess: () => { refetch(); setFormAcik(false); } });
  const publishMutation = trpc.admin.publishQuestion.useMutation({ onSuccess: () => refetch() });
  const generateMutation = trpc.admin.generateAIQuestion.useMutation({ onSuccess: () => refetch() });

  const tumTopicler = topics?.flatMap(t => [t, ...t.children]) ?? [];

  const handleCreate = () => {
    if (!form.topicId || !form.soruMetni || form.siklar.some(s => !s) || !form.aciklama) return;
    createMutation.mutate({
      topicId: form.topicId,
      kaynak: form.kaynak,
      zorluk: form.zorluk,
      soruMetni: form.soruMetni,
      siklar: form.siklar,
      dogruSik: form.dogruSik,
      aciklama: form.aciklama,
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sorular</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFormAcik(!formAcik)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Soru Ekle
          </button>
        </div>
      </div>

      {/* Yeni Soru Formu */}
      {formAcik && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Yeni Soru</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Konu *</label>
              <select
                value={form.topicId}
                onChange={e => setForm(f => ({ ...f, topicId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Seçin...</option>
                {tumTopicler.map(t => (
                  <option key={t.id} value={t.id}>{t.ders} — {t.isim}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kaynak</label>
                <select
                  value={form.kaynak}
                  onChange={e => setForm(f => ({ ...f, kaynak: e.target.value as typeof form.kaynak }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="OGRETMEN">Öğretmen</option>
                  <option value="CIKMIS">Çıkmış</option>
                  <option value="AI_URETIM">AI Üretim</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Zorluk</label>
                <select
                  value={form.zorluk}
                  onChange={e => setForm(f => ({ ...f, zorluk: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={1}>Kolay</option>
                  <option value={2}>Orta</option>
                  <option value={3}>Zor</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Soru Metni *</label>
            <textarea
              value={form.soruMetni}
              onChange={e => setForm(f => ({ ...f, soruMetni: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Soru metnini girin..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Şıklar (A, B, C, D) *</label>
            <div className="space-y-2">
              {form.siklar.map((sik, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    onClick={() => setForm(f => ({ ...f, dogruSik: idx }))}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 text-xs font-bold ${
                      form.dogruSik === idx
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </button>
                  <input
                    value={sik}
                    onChange={e => {
                      const yeni = [...form.siklar];
                      yeni[idx] = e.target.value;
                      setForm(f => ({ ...f, siklar: yeni }));
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    placeholder={`${String.fromCharCode(65 + idx)} şıkkı...`}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400">Doğru şıkkı seçmek için harfe tıklayın (yeşil = doğru)</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama *</label>
            <textarea
              value={form.aciklama}
              onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Doğru cevabın açıklaması..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Kaydediliyor..." : "Taslak Olarak Kaydet"}
            </button>
            <button onClick={() => setFormAcik(false)} className="text-sm text-gray-500 hover:text-gray-700">
              İptal
            </button>
          </div>
        </div>
      )}

      {/* AI Soru Üretimi */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-purple-900 text-sm">AI Soru Üretimi</p>
            <p className="text-xs text-purple-600">Seçilen konu için AI ile taslak soru oluştur</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              id="ai-topic"
              className="border border-purple-300 rounded-lg px-2 py-1.5 text-sm bg-white"
              defaultValue=""
            >
              <option value="">Konu seçin...</option>
              {tumTopicler.map(t => (
                <option key={t.id} value={t.id}>{t.isim}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const topicId = (document.getElementById("ai-topic") as HTMLSelectElement)?.value;
                if (topicId) generateMutation.mutate({ topicId, zorluk: 2, adet: 3 });
              }}
              disabled={generateMutation.isPending}
              className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {generateMutation.isPending ? "Üretiliyor..." : "3 Soru Üret"}
            </button>
          </div>
        </div>
        {generateMutation.data && (
          <p className="mt-2 text-xs text-purple-700 bg-purple-100 rounded px-3 py-1.5">
            {generateMutation.data.uyari}
          </p>
        )}
      </div>

      {/* Filtreler */}
      <div className="flex gap-2 mb-4">
        {[undefined, "DRAFT", "REVIEWED", "PUBLISHED", "FLAGGED"].map((s) => (
          <button
            key={s ?? "all"}
            onClick={() => { setStatusFilter(s as StatusFilter); setSayfa(0); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s ? STATUS_LABEL[s] : "Tümü"}
          </button>
        ))}
      </div>

      {/* Soru Listesi */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.questions.map(q => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_RENK[q.validationStatus]}`}>
                      {STATUS_LABEL[q.validationStatus]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {q.topic.ders} — {q.topic.isim}
                    </span>
                    <span className="text-xs text-gray-400">
                      · {ZORLUK_LABEL[q.zorluk]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 truncate">{q.soruMetni}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {q.validationStatus !== "PUBLISHED" && (
                    <button
                      onClick={() => publishMutation.mutate({ id: q.id })}
                      disabled={publishMutation.isPending}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 font-medium"
                    >
                      Yayınla
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data?.questions.length === 0 && (
            <div className="text-center py-12 text-gray-400">Bu filtre için soru bulunamadı.</div>
          )}
        </div>
      )}

      {/* Sayfalama */}
      {data && data.toplam > 25 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setSayfa(s => Math.max(0, s - 1))}
            disabled={sayfa === 0}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-40"
          >
            ← Önceki
          </button>
          <span className="text-sm text-gray-500">
            {sayfa + 1} / {Math.ceil(data.toplam / 25)}
          </span>
          <button
            onClick={() => setSayfa(s => s + 1)}
            disabled={sayfa >= Math.ceil(data.toplam / 25) - 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-40"
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}
