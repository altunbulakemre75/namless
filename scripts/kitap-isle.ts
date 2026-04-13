/**
 * MEB Kitap Bilgi Tabanı Çıkarımı
 *
 * Kullanım:
 *   npx tsx scripts/kitap-isle.ts                         # tüm kitaplar
 *   npx tsx scripts/kitap-isle.ts --dosya 8matcalisma.pdf # tek kitap
 *   npx tsx scripts/kitap-isle.ts --test 8matcalisma.pdf  # sadece ilk 5 sayfa test
 *
 * Ne yapar:
 *   1. PDF'i pdf-parse ile metin çıkarmayı dener (native PDF)
 *   2. Metin boşsa Claude Vision ile sayfa sayfa okur (taranmış PDF)
 *   3. Bölüm başlıklarına göre parçalar
 *   4. DB'deki konularla eşleştirir
 *   5. kitap_metinleri tablosuna kaydeder
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();
const PDF_KLASORU = "C:\\Users\\altun\\Desktop\\mebkitaplar";
const KITAP_MAP_YOLU = path.join(__dirname, "../config/kitap-map.json");

type Ders = "TURKCE" | "MATEMATIK" | "FEN" | "SOSYAL" | "INGILIZCE" | "DIN";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[çÇ]/g, "c").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[ıİ]/g, "i")
    .replace(/[^a-z0-9\s]/g, "").trim();
}

// Metni bölüm başlıklarına göre parçala
function metniParcala(metin: string, kaynak: string, ders: Ders): Array<{bolum: string; icerik: string}> {
  const parcalar: Array<{bolum: string; icerik: string}> = [];

  // Başlık kalıpları: büyük harfli satırlar, numara+nokta, bold benzeri
  const baslikKalibi = /^(?:\d+[\.\)]\s+)?([A-ZÇŞĞÜÖİ][A-ZÇŞĞÜÖİa-zçşğüöı\s\-]{4,60})$/gm;

  const eslesimler = [...metin.matchAll(baslikKalibi)];

  if (eslesimler.length < 2) {
    // Başlık bulunamadı — tüm metni tek parça olarak kaydet
    if (metin.trim().length > 100) {
      parcalar.push({ bolum: path.basename(kaynak, ".pdf"), icerik: metin.trim() });
    }
    return parcalar;
  }

  for (let i = 0; i < eslesimler.length; i++) {
    const baslik = eslesimler[i][1].trim();
    const baslangic = eslesimler[i].index! + eslesimler[i][0].length;
    const bitis = i + 1 < eslesimler.length ? eslesimler[i + 1].index! : metin.length;
    const icerik = metin.slice(baslangic, bitis).trim();

    if (icerik.length > 80) {
      parcalar.push({ bolum: baslik, icerik });
    }
  }

  return parcalar;
}

// DB'deki konularla eşleştir
async function topicEslestir(bolumAdi: string, ders: Ders): Promise<string | null> {
  const konular = await prisma.topic.findMany({
    where: { ders: ders as never },
    select: { id: true, isim: true },
  });

  const norm = normalize(bolumAdi);

  // Tam eşleşme
  const tam = konular.find((k) => normalize(k.isim) === norm);
  if (tam) return tam.id;

  // Kısmi eşleşme
  const kismi = konular.find(
    (k) => normalize(k.isim).includes(norm) || norm.includes(normalize(k.isim))
  );
  if (kismi) return kismi.id;

  // Kelime bazlı (en az 2 ortak kelime)
  const normKelimeler = norm.split(/\s+/).filter((w) => w.length > 2);
  let enIyi: string | null = null;
  let enIyiSkor = 0;
  for (const k of konular) {
    const kNorm = normalize(k.isim).split(/\s+/).filter((w) => w.length > 2);
    const ortak = normKelimeler.filter((w) => kNorm.includes(w)).length;
    if (ortak >= 2 && ortak > enIyiSkor) {
      enIyiSkor = ortak;
      enIyi = k.id;
    }
  }

  return enIyi;
}

// Native PDF metin çıkarımı
async function pdfMetinCikar(dosyaYolu: string): Promise<{metin: string; sayfaSayisi: number}> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const buffer = fs.readFileSync(dosyaYolu);
  const data = await pdfParse(buffer, { max: 0 }); // tüm sayfalar
  return { metin: data.text, sayfaSayisi: data.numpages };
}

// Claude Vision ile sayfa okuma (taranmış PDF için)
async function visionIleSayfaOku(
  anthropic: Anthropic,
  buffer: Buffer,
  sayfaNo: number
): Promise<string> {
  // PDF'i base64'e çevir ve tek sayfa olarak Claude'a gönder
  const base64 = buffer.toString("base64");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20241022",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          },
          {
            type: "text",
            text: `Bu PDF'in ${sayfaNo}. sayfasındaki tüm metni olduğu gibi çıkar. Başlıkları büyük harfle yaz. Sadece metni döndür, açıklama ekleme.`,
          },
        ],
      },
    ],
  });

  const blok = msg.content.find((b) => b.type === "text");
  return blok?.type === "text" ? blok.text : "";
}

// ==================== ANA FONKSİYON ====================

async function main() {
  const args = process.argv.slice(2);
  const testModu = args.includes("--test");
  const tekDosya = args.includes("--dosya") ? args[args.indexOf("--dosya") + 1] : null;
  const testDosya = testModu ? args[args.indexOf("--test") + 1] : null;

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY tanımlı değil (.env.local'a ekle)");
    process.exit(1);
  }

  if (!fs.existsSync(PDF_KLASORU)) {
    console.error(`PDF klasörü bulunamadı: ${PDF_KLASORU}`);
    process.exit(1);
  }

  const kitapMap: Record<string, string> = JSON.parse(fs.readFileSync(KITAP_MAP_YOLU, "utf8"));
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // Hangi dosyaları işle?
  let dosyalar = fs.readdirSync(PDF_KLASORU).filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (tekDosya || testDosya) {
    dosyalar = [tekDosya ?? testDosya!];
  }

  console.log(`\n📚 MEB Kitap Bilgi Tabanı Çıkarımı`);
  console.log(`📂 Klasör: ${PDF_KLASORU}`);
  console.log(`📄 ${dosyalar.length} dosya işlenecek${testModu ? " (TEST - ilk 5 sayfa)" : ""}\n`);

  let toplamChunk = 0;
  let toplamHata = 0;

  for (const dosyaAdi of dosyalar) {
    const dosyaYolu = path.join(PDF_KLASORU, dosyaAdi);

    if (!fs.existsSync(dosyaYolu)) {
      console.log(`⚠️  Dosya bulunamadı: ${dosyaAdi}`);
      continue;
    }

    // Derse bak
    const ders = (kitapMap[dosyaAdi] ?? null) as Ders | null;

    // Ders belirlenmemişse Claude'a ilk sayfayı göster ve ders tespit et
    let dersBelirli: Ders;
    if (!ders) {
      process.stdout.write(`🔍 ${dosyaAdi} — ders tespit ediliyor... `);
      const buffer = fs.readFileSync(dosyaYolu);
      const ilkSayfaMetni = await visionIleSayfaOku(anthropic, buffer, 1);
      const dersMsg = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20241022",
        max_tokens: 50,
        messages: [{
          role: "user",
          content: `Bu MEB 8. sınıf kitabının ilk sayfasına göre hangi ders? Sadece şunlardan birini yaz: TURKCE, MATEMATIK, FEN, SOSYAL, INGILIZCE, DIN\n\n${ilkSayfaMetni}`,
        }],
      });
      const dersBlok = dersMsg.content.find((b) => b.type === "text");
      const tespitEdilen = dersBlok?.type === "text"
        ? (dersBlok.text.trim().split(/\s/)[0] as Ders)
        : "MATEMATIK";
      console.log(`${tespitEdilen}`);
      dersBelirli = tespitEdilen;
      kitapMap[dosyaAdi] = tespitEdilen;
      // config dosyasını güncelle
      fs.writeFileSync(KITAP_MAP_YOLU, JSON.stringify(kitapMap, null, 2));
    } else {
      dersBelirli = ders;
    }

    console.log(`\n📖 ${dosyaAdi} (${dersBelirli})`);

    try {
      // 1. Native PDF metin çıkarımını dene
      let metin = "";
      let sayfaSayisi = 0;

      try {
        process.stdout.write("   pdf-parse ile metin çıkarılıyor... ");
        const sonuc = await pdfMetinCikar(dosyaYolu);
        metin = sonuc.metin;
        sayfaSayisi = sonuc.sayfaSayisi;
        const karSayfa = metin.length / Math.max(sayfaSayisi, 1);
        if (karSayfa < 100) {
          console.log(`taranmış PDF (${karSayfa.toFixed(0)} kar/sayfa) → Vision moduna geçiliyor`);
          metin = ""; // Vision moduna geç
        } else {
          console.log(`✓ ${sayfaSayisi} sayfa, ${metin.length} karakter`);
        }
      } catch {
        console.log("pdf-parse başarısız → Vision moduna geçiliyor");
      }

      // 2. Vision modu (taranmış PDF)
      if (!metin) {
        const buffer = fs.readFileSync(dosyaYolu);
        const maxSayfa = testModu ? 5 : sayfaSayisi || 50; // test: 5, normal: tümü
        const metinParcalar: string[] = [];

        process.stdout.write(`   Claude Vision: ${maxSayfa} sayfa okuyacak... `);
        for (let sayfa = 1; sayfa <= maxSayfa; sayfa++) {
          process.stdout.write(`${sayfa} `);
          const sayfaMetni = await visionIleSayfaOku(anthropic, buffer, sayfa);
          metinParcalar.push(sayfaMetni);
          // Rate limit
          await new Promise((r) => setTimeout(r, 500));
        }
        console.log();
        metin = metinParcalar.join("\n\n---\n\n");
      } else if (testModu) {
        // Native PDF test modunda sadece ilk kısmı al
        metin = metin.slice(0, 5000);
      }

      // 3. Metni parçala
      const parcalar = metniParcala(metin, dosyaAdi, dersBelirli);
      console.log(`   ${parcalar.length} bölüm tespit edildi`);

      if (parcalar.length === 0) {
        console.log("   ⚠️  Bölüm çıkarılamadı, atlanıyor.");
        continue;
      }

      // 4. DB'ye kaydet
      let kaydedilen = 0;
      for (const parca of parcalar) {
        // Önce bu kaynak+bölüm zaten var mı kontrol et
        const mevcutCount = await prisma.kitapMetni.count({
          where: { kaynak: dosyaAdi, bolum: parca.bolum },
        });
        if (mevcutCount > 0) continue;

        const topicId = await topicEslestir(parca.bolum, dersBelirli);

        await prisma.kitapMetni.create({
          data: {
            kaynak: dosyaAdi,
            ders: dersBelirli as never,
            bolum: parca.bolum,
            icerik: parca.icerik,
            topicId,
          },
        });
        kaydedilen++;
      }

      console.log(`   ✅ ${kaydedilen} yeni chunk kaydedildi`);
      toplamChunk += kaydedilen;

    } catch (err) {
      console.log(`   ❌ HATA: ${err instanceof Error ? err.message : String(err)}`);
      toplamHata++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Toplam ${toplamChunk} chunk kaydedildi`);
  if (toplamHata > 0) console.log(`❌ Hatalı: ${toplamHata} dosya`);
  console.log(`${"=".repeat(50)}\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
