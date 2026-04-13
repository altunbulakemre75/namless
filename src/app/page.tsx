import Link from "next/link";

const dersler = [
  { isim: "Matematik", key: "MATEMATIK", ikon: "📐", renk: "bg-blue-500", soru: 20 },
  { isim: "Fen Bilimleri", key: "FEN", ikon: "🔬", renk: "bg-green-500", soru: 20 },
  { isim: "Türkçe", key: "TURKCE", ikon: "📖", renk: "bg-red-500", soru: 20 },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            LGS AI Kocu
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Yapay Zeka ile LGS&apos;ye Hazırlan
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Önce seviyeni belirle, sonra sana özel çalışma planı ile
            zayıf konularını güçlendir.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/diagnostic"
              className="inline-block bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Seviyeni Belirle →
            </Link>
            <Link
              href="/auth/register"
              className="inline-block border-2 border-white/50 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </section>

      {/* Dersler */}
      <section className="max-w-6xl mx-auto py-12 px-6 w-full">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">LGS Dersleri</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {dersler.map((ders) => (
            <Link
              key={ders.isim}
              href={`/diagnostic?ders=${ders.key}`}
              className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{ders.ikon}</span>
                <h4 className="font-semibold text-gray-900">{ders.isim}</h4>
              </div>
              <p className="text-sm text-gray-500">LGS&apos;de {ders.soru} soru · Çalışmaya başla →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Nasil Calisir */}
      <section className="bg-white py-12 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Nasıl Çalışır?
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📊</span>
              </div>
              <h4 className="font-semibold mb-1 text-sm">Seviye Belirle</h4>
              <p className="text-gray-500 text-xs">Tüm derslerde seviyeni ölç</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🎯</span>
              </div>
              <h4 className="font-semibold mb-1 text-sm">Hedef Okul Seç</h4>
              <p className="text-gray-500 text-xs">Kaç günde hazır olursun, hesapla</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📝</span>
              </div>
              <h4 className="font-semibold mb-1 text-sm">Her Gün Çalış</h4>
              <p className="text-gray-500 text-xs">AI koçun günlük planını hazırlar</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">⏱️</span>
              </div>
              <h4 className="font-semibold mb-1 text-sm">Deneme Sınavı</h4>
              <p className="text-gray-500 text-xs">Stres modunda gerçek sınav tecrübesi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fark yaratan ozellikler */}
      <section className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Rakiplerde Olmayan 5 Özellik
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <p className="font-semibold text-indigo-900 mb-1">🎯 Hedef Okul + Süre Tahmini</p>
              <p className="text-sm text-indigo-700">&quot;Galatasaray Lisesi için 67 günde hazır olursun&quot;</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <p className="font-semibold text-red-900 mb-1">⏱️ Sınav Psikolojisi</p>
              <p className="text-sm text-red-700">Tam ekran stres simülasyonu — gerçek sınav baskısına hazırlan</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <p className="font-semibold text-orange-900 mb-1">🔍 Neden Yanlış? Analizi</p>
              <p className="text-sm text-orange-700">Dikkatsizlik mi, kavram eksikliği mi — AI sınıflandırıyor</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="font-semibold text-green-900 mb-1">📈 Öğrenme Hızı Modeli</p>
              <p className="text-sm text-green-700">Haftalık tempo ölçümü, dinamik plan güncelleme</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="font-semibold text-blue-900 mb-1">👪 Veli Aksiyon Raporu</p>
              <p className="text-sm text-blue-700">Grafik değil aksiyon: &quot;Bu hafta geometriyi sorun&quot;</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <p className="font-semibold text-purple-900 mb-1">🔥 Streak + Motivasyon</p>
              <p className="text-sm text-purple-700">Ardışık gün takibi, rozet sistemi, koç yorumları</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-sm">
          <p>LGS AI Kocu — Yapay zeka destekli kisisellestirilmis LGS hazirlık</p>
        </div>
      </footer>
    </div>
  );
}
