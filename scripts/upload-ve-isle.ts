/**
 * PDF Yükleme + AI İçerik Üretimi — Toplu Script
 *
 * Kullanım:
 *   1. PDFlerini projenin kök klasöründe "pdfs/" klasörüne koy
 *   2. PDF isimlerini konu adlarına göre isimlendir:
 *      Örn: "Denklemler ve Eşitsizlikler.pdf", "Kuvvet ve Hareket.pdf"
 *   3. .env.local'a ekle:
 *      ANTHROPIC_API_KEY=sk-ant-...
 *      SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *      DIRECT_URL=postgresql://...
 *   4. Supabase Dashboard → Storage → "ders-pdfleri" bucket oluştur (Public)
 *   5. Çalıştır: npx tsx scripts/upload-ve-isle.ts
 *
 * Yeniden çalıştırma:
 *   - pdfUrl + aiAnlatim zaten dolu → atlar
 *   - pdfUrl dolu, aiAnlatim yok → sadece AI üretir
 *   - ikisi de yok → hem yükler hem AI üretir
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

// .env.local'ı yükle
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const BUCKET = "ders-pdfleri";
const PDF_KLASORU = path.join(__dirname, "../pdfs");

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik",
  FEN: "Fen Bilimleri",
  TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler",
  INGILIZCE: "İngilizce",
  DIN: "Din Kültürü",
};

// ==================== YARDIMCI FONKSİYONLAR ====================

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[çÇ]/g, "c")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[ıİ]/g, "i")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

type Konu = { id: string; isim: string; ders: string; pdfUrl: string | null; aiAnlatim: string | null };

function eslesimBul(dosyaAdi: string, konular: Konu[]): Konu | null {
  const dosyaNorm = normalize(dosyaAdi);

  // Tam eşleşme önce
  const tam = konular.find((k) => normalize(k.isim) === dosyaNorm);
  if (tam) return tam;

  // Kısmi eşleşme — dosya adı konuyu içeriyor veya konu dosyayı içeriyor
  const kismi = konular.find(
    (k) =>
      normalize(k.isim).includes(dosyaNorm) ||
      dosyaNorm.includes(normalize(k.isim))
  );
  if (kismi) return kismi;

  // Kelime bazlı eşleşme — en az 2 ortak kelime
  const dosyaKelimeler = dosyaNorm.split(/\s+/).filter((w) => w.length > 2);
  let enIyiSkor = 0;
  let enIyi: Konu | null = null;

  for (const konu of konular) {
    const konuKelimeler = normalize(konu.isim)
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const ortak = dosyaKelimeler.filter((w) => konuKelimeler.includes(w)).length;
    if (ortak >= 2 && ortak > enIyiSkor) {
      enIyiSkor = ortak;
      enIyi = konu;
    }
  }

  return enIyi;
}

// ==================== PDF YÜKLEME ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pdfYukle(supabase: any, topicId: string, pdfBuffer: Buffer, dosyaAdi: string): Promise<string> {
  void dosyaAdi;
  const dosyaYolu = `pdfs/${topicId}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(dosyaYolu, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true, // üzerine yazar
    });

  if (error) throw new Error(`Storage yükleme hatası: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(dosyaYolu);
  return data.publicUrl;
}

// ==================== AI ANLATIM ÜRETİMİ ====================

async function aiAnlatimUret(
  anthropic: Anthropic,
  topicIsim: string,
  dersIsim: string,
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Sen bir LGS uzmanı öğretmensin. Türkiye MEB 8. sınıf müfredatına göre "${topicIsim}" konusunu (${dersIsim} dersi) aşağıdaki formatta anlat:

## ${topicIsim}

**Temel Kavramlar:**
[En önemli 3-5 kavramı madde madde açıkla, 8. sınıf seviyesine uygun]

**Konu Özeti:**
[Konuyu 3-4 paragrafta açıkla, günlük hayattan örneklerle destekle]

**Önemli Noktalar:**
[LGS sınavında çıkabilecek kritik noktalar, madde madde]

**Örnek Soru Tipi:**
[Bu konudan nasıl soru çıkar, kısa bir örnek ve çözümü]

Türkçe yaz. Öğrenci dostu, sade bir dil kullan. Toplam 400-600 kelime olsun.`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Claude yanıt vermedi");
  return textBlock.text;
}

// ==================== ANA FONKSİYON ====================

async function main() {
  // Ortam değişkeni kontrolleri
  if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL tanımlı değil");
  if (!SUPABASE_SERVICE_KEY)
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tanımlı değil\n" +
        "  Supabase Dashboard → Settings → API → service_role key'i .env.local'a ekle"
    );
  if (!ANTHROPIC_API_KEY)
    throw new Error(
      "ANTHROPIC_API_KEY tanımlı değil\n" +
        "  console.anthropic.com → API Keys → .env.local'a ekle"
    );

  // PDFs klasörünü kontrol et
  if (!fs.existsSync(PDF_KLASORU)) {
    console.log(`\n📁 '${PDF_KLASORU}' klasörü bulunamadı.`);
    console.log("   Projenin kök dizininde 'pdfs/' klasörü oluştur ve PDF'leri içine koy.\n");
    process.exit(1);
  }

  const pdfDosyalari = fs
    .readdirSync(PDF_KLASORU)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (pdfDosyalari.length === 0) {
    console.log("\n📭 'pdfs/' klasöründe PDF bulunamadı. Dosyaları ekle ve tekrar çalıştır.\n");
    process.exit(0);
  }

  console.log(`\n🚀 LGS PDF İşleme Scripti Başlıyor`);
  console.log(`📂 Klasör: ${PDF_KLASORU}`);
  console.log(`📄 ${pdfDosyalari.length} PDF dosyası bulundu\n`);

  // İstemcileri başlat
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // DB'den tüm konuları çek
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const konular: Konu[] = await (prisma.topic as any).findMany({
    select: { id: true, isim: true, ders: true, pdfUrl: true, aiAnlatim: true },
    orderBy: { ders: "asc" as const },
  });

  console.log(`🗄️  DB'de ${konular.length} konu bulundu\n`);

  let basarili = 0;
  let atlandi = 0;
  let eslesmeyen = 0;
  let hatali = 0;
  const eslesmeyen_dosyalar: string[] = [];

  for (const dosya of pdfDosyalari) {
    const dosyaAdi = path.basename(dosya, ".pdf");
    const konu = eslesimBul(dosyaAdi, konular);

    if (!konu) {
      console.log(`⚠️  Eşleşme yok: ${dosya}`);
      eslesmeyen_dosyalar.push(dosya);
      eslesmeyen++;
      continue;
    }

    const dersIsim = DERS_ISIM[konu.ders] ?? konu.ders;
    const satir = `${dersIsim} → ${konu.isim}`;

    // Her ikisi de zaten dolu mu?
    if (konu.pdfUrl && konu.aiAnlatim) {
      console.log(`⏭️  Atlandı (zaten işlendi): ${satir}`);
      atlandi++;
      continue;
    }

    try {
      process.stdout.write(`⏳ ${satir}... `);

      let pdfUrl = konu.pdfUrl;

      // PDF yükleme (henüz yüklenmemişse)
      if (!pdfUrl) {
        process.stdout.write("[yükleniyor] ");
        const pdfBuffer = fs.readFileSync(path.join(PDF_KLASORU, dosya));
        pdfUrl = await pdfYukle(supabase, konu.id, pdfBuffer, dosya);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma.topic as any).update({
          where: { id: konu.id },
          data: { pdfUrl },
        });
      }

      // AI anlatım üretimi (henüz üretilmemişse)
      if (!konu.aiAnlatim) {
        process.stdout.write("[AI üretiyor] ");
        const anlatim = await aiAnlatimUret(anthropic, konu.isim, dersIsim);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma.topic as any).update({
          where: { id: konu.id },
          data: { aiAnlatim: anlatim, aiAnlatimTarihi: new Date() },
        });
      }

      console.log("✅");
      basarili++;

      // Rate limit: Claude API için kısa bekleme
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.log(`❌ HATA: ${err instanceof Error ? err.message : String(err)}`);
      hatali++;
    }
  }

  // Özet
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Başarılı: ${basarili}`);
  console.log(`⏭️  Atlandı: ${atlandi}`);
  if (hatali > 0) console.log(`❌ Hatalı: ${hatali}`);
  if (eslesmeyen > 0) {
    console.log(`\n⚠️  Eşleşmeyen PDF'ler (${eslesmeyen} adet):`);
    eslesmeyen_dosyalar.forEach((f) => console.log(`   • ${f}`));
    console.log("\n   Çözüm: Bu PDF'lerin adını DB'deki konu ismine yakınlaştır.");
    console.log("   DB'deki konu isimleri için:");
    console.log("   npx tsx scripts/upload-ve-isle.ts --list-topics");
  }
  console.log("=".repeat(50) + "\n");
}

// --list-topics flag'i
if (process.argv.includes("--list-topics")) {
  (async () => {
    dotenv.config({ path: path.join(__dirname, "../.env.local") });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const konular = await (prisma.topic as any).findMany({
      select: { isim: true, ders: true },
      orderBy: [{ ders: "asc" as const }, { isim: "asc" as const }],
    }) as { isim: string; ders: string }[];

    const DERS_ISIM_MAP: Record<string, string> = {
      MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
      SOSYAL: "Sosyal Bilgiler", INGILIZCE: "İngilizce", DIN: "Din Kültürü",
    };

    console.log("\n📚 DB'deki Tüm Konu İsimleri:\n");
    let mevcutDers = "";
    for (const k of konular) {
      if (k.ders !== mevcutDers) {
        mevcutDers = k.ders;
        console.log(`\n[${DERS_ISIM_MAP[k.ders] ?? k.ders}]`);
      }
      console.log(`  • ${k.isim}`);
    }
    console.log();
  })()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
} else {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
