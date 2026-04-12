import Link from "next/link";

const dersler = [
  { isim: "Matematik", ikon: "M", renk: "bg-blue-500", soru: 20 },
  { isim: "Fen Bilimleri", ikon: "F", renk: "bg-green-500", soru: 20 },
  { isim: "Turkce", ikon: "T", renk: "bg-red-500", soru: 20 },
  { isim: "Sosyal Bilgiler", ikon: "S", renk: "bg-yellow-500", soru: 10 },
  { isim: "Ingilizce", ikon: "I", renk: "bg-purple-500", soru: 10 },
  { isim: "Din Kulturu", ikon: "D", renk: "bg-orange-500", soru: 10 },
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
          <Link
            href="/diagnostic"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Seviye Belirle
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Yapay Zeka ile LGS&apos;ye Hazirlan
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Kisisellestirilmis calisma plani, akilli soru secimi ve anlik
            performans analizi ile hedefine ulasan yolda yanindayiz.
          </p>
          <Link
            href="/diagnostic"
            className="inline-block bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Hemen Basla - Seviyeni Belirle
          </Link>
        </div>
      </section>

      {/* Dersler */}
      <section className="max-w-6xl mx-auto py-12 px-6 w-full">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">LGS Dersleri</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {dersler.map((ders) => (
            <div
              key={ders.isim}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`${ders.renk} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold`}
                >
                  {ders.ikon}
                </div>
                <h4 className="font-semibold text-gray-900">{ders.isim}</h4>
              </div>
              <p className="text-sm text-gray-500">LGS&apos;de {ders.soru} soru</p>
            </div>
          ))}
        </div>
      </section>

      {/* Nasil Calisir */}
      <section className="bg-white py-12 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Nasil Calisir?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Seviye Belirleme</h4>
              <p className="text-gray-600 text-sm">
                30 soruyla tum derslerdeki seviyeni belirliyoruz
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">Kisisel Plan</h4>
              <p className="text-gray-600 text-sm">
                AI zayif konularini tespit edip sana ozel plan olusturur
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Her Gun Calis</h4>
              <p className="text-gray-600 text-sm">
                Gunluk 15 soru coz, aninda geri bildirim al, ilerlemeni izle
              </p>
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
