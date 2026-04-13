import Link from "next/link";

const DERSLER = [
  { isim: "Türkçe",        key: "TURKCE",    ikon: "📖", renk: "from-red-500 to-rose-600",       soru: 20 },
  { isim: "Matematik",     key: "MATEMATIK", ikon: "📐", renk: "from-indigo-500 to-blue-600",     soru: 20 },
  { isim: "Fen Bilimleri", key: "FEN",       ikon: "🔬", renk: "from-emerald-500 to-green-600",   soru: 20 },
  { isim: "Sosyal Bilgiler",key: "SOSYAL",   ikon: "🌍", renk: "from-orange-500 to-amber-600",    soru: 10 },
  { isim: "Din Kültürü",   key: "DIN",       ikon: "☪️", renk: "from-teal-500 to-cyan-600",       soru: 10 },
  { isim: "İngilizce",     key: "INGILIZCE", ikon: "🇬🇧", renk: "from-violet-500 to-purple-600",  soru: 10 },
];

const OZELLIKLER = [
  { ikon: "🎯", baslik: "Hedef Okul Tahmini", aciklama: "Galatasaray Lisesi için 67 günde hazır olursun — gerçek veri", renk: "bg-indigo-50 border-indigo-100" },
  { ikon: "🤖", baslik: "AI Konu Anlatımı", aciklama: "Her konuyu anında anlat, sana özel örnekler ve tekrar soruları", renk: "bg-violet-50 border-violet-100" },
  { ikon: "📊", baslik: "Bayesian Mastery", aciklama: "Sadece doğru/yanlış değil, bilgi kalıcılığını ölç ve takip et", renk: "bg-blue-50 border-blue-100" },
  { ikon: "🔍", baslik: "Hata Analizi", aciklama: "Dikkatsizlik mi, kavram eksikliği mi — AI sınıflandırıyor", renk: "bg-orange-50 border-orange-100" },
  { ikon: "🔥", baslik: "Streak & Motivasyon", aciklama: "Günlük seri takibi, rozet sistemi, haftalık hedefler", renk: "bg-red-50 border-red-100" },
  { ikon: "👪", baslik: "Veli Raporu", aciklama: "Grafik değil aksiyon: Bu hafta geometriyi sorun", renk: "bg-emerald-50 border-emerald-100" },
];

const NASIL: { adim: string; baslik: string; aciklama: string; renk: string }[] = [
  { adim: "1", baslik: "Seviyeni Belirle", aciklama: "AI adaptif test ile gerçek seviyeni ölç", renk: "bg-violet-100 text-violet-700" },
  { adim: "2", baslik: "Hedef Okul Seç", aciklama: "Kaç günde hazır olduğunu hesapla", renk: "bg-indigo-100 text-indigo-700" },
  { adim: "3", baslik: "Her Gün Çalış", aciklama: "AI koçun günlük planını hazırlar, yönlendirir", renk: "bg-blue-100 text-blue-700" },
  { adim: "4", baslik: "Deneme Çöz", aciklama: "LGS formatında stres simülasyonu yap", renk: "bg-emerald-100 text-emerald-700" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xs">LGS</span>
            </div>
            <span className="font-black text-gray-900 text-lg">AI Koçu</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="bg-violet-600 text-white px-4 py-2 rounded-xl hover:bg-violet-700 transition-colors text-sm font-semibold shadow-sm"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 text-white py-20 px-6 relative overflow-hidden">
        {/* Dekoratif arka plan */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)"
        }} />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6 text-sm font-medium text-violet-200">
            <span>🎯</span>
            <span>LGS 2026 — 7 Haziran&apos;a hazır mısın?</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Yapay Zeka ile<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
              LGS&apos;yi Fethet
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Seviyeni belirle. Hedef okulunu seç. AI koçun her gün yanında — zayıf konuları güçlendir, sınav psikolojisini kazan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-lg hover:shadow-violet-500/30 transition-all"
            >
              Hemen Başla — Ücretsiz →
            </Link>
            <Link
              href="/diagnostic"
              className="w-full sm:w-auto border border-white/30 text-white px-8 py-4 rounded-2xl font-semibold text-base hover:bg-white/10 transition-all"
            >
              Seviyemi Ölç
            </Link>
          </div>

          {/* Sosyal kanıt */}
          <p className="mt-8 text-sm text-slate-400">
            Kredi kartı gerekmez · Anında başla · AI destekli
          </p>
        </div>
      </section>

      {/* ── Nasıl Çalışır? ── */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Nasıl Çalışır?</h2>
            <p className="text-gray-500">4 adımda LGS&apos;ye hazırlan</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {NASIL.map((item) => (
              <div key={item.adim} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-lg ${item.renk}`}>
                  {item.adim}
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{item.baslik}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LGS Dersleri ── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">LGS&apos;deki 6 Ders</h2>
            <p className="text-gray-500">Tüm dersler AI koç desteğiyle</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {DERSLER.map((ders) => (
              <Link
                key={ders.key}
                href={`/diagnostic?ders=${ders.key}`}
                className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all p-5"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ders.renk} rounded-t-2xl`} />
                <div className="flex items-center gap-3 mb-3 pt-2">
                  <span className="text-2xl">{ders.ikon}</span>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{ders.isim}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">LGS&apos;de <span className="font-semibold">{ders.soru} soru</span></p>
                <span className="text-xs font-semibold text-violet-600 group-hover:underline">
                  Seviyeni ölç →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Özellikler ── */}
      <section className="py-16 px-6 bg-slate-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Rakiplerde Olmayan 6 Özellik</h2>
            <p className="text-gray-500">Sadece soru bankası değil — gerçek bir AI koç</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OZELLIKLER.map((o) => (
              <div key={o.baslik} className={`rounded-2xl border p-5 ${o.renk}`}>
                <p className="text-2xl mb-2">{o.ikon}</p>
                <p className="font-bold text-gray-900 mb-1 text-sm">{o.baslik}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{o.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            LGS&apos;ye hazırlanmaya başla
          </h2>
          <p className="text-violet-200 mb-8 text-lg">
            Ücretsiz seviye testi ile başla. Hedef okuluna kaç günde hazır olduğunu öğren.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="bg-white text-violet-700 px-8 py-4 rounded-2xl font-bold hover:bg-violet-50 transition-colors shadow-lg"
            >
              Ücretsiz Kayıt Ol →
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-colors"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-500 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-[9px] font-black">LGS</span>
            </div>
            <span className="text-sm font-medium text-gray-400">AI Koçu</span>
          </div>
          <p className="text-xs">Yapay zeka destekli kişiselleştirilmiş LGS hazırlık platformu</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/auth/login" className="hover:text-gray-300 transition-colors">Giriş</Link>
            <Link href="/auth/register" className="hover:text-gray-300 transition-colors">Kayıt</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
