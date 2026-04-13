/**
 * Kitap Bilgi Tabanından AI Anlatım Üretimi
 *
 * Kullanım:
 *   npx tsx scripts/anlatim-uret.ts                    # tüm boş konular
 *   npx tsx scripts/anlatim-uret.ts --ders FEN         # sadece Fen
 *   npx tsx scripts/anlatim-uret.ts --limit 5          # ilk 5 konu
 *   npx tsx scripts/anlatim-uret.ts --yenile           # zaten üretilenleri de yenile
 *
 * Ne yapar:
 *   1. DB'den aiAnlatim boş olan konuları çek
 *   2. Her konu için kitap_metinleri'nden ilgili içeriği bul
 *   3. İçeriği Claude'a context olarak ver → anlatım üret
 *   4. Topic.aiAnlatim + aiAnlatimTarihi'ni kaydet
 */

import * as path from "path";
import * as dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

type Ders = "TURKCE" | "MATEMATIK" | "FEN" | "SOSYAL" | "INGILIZCE" | "DIN";

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik", FEN: "Fen Bilimleri", TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler", INGILIZCE: "İngilizce", DIN: "Din Kültürü",
};

async function kitapIcerigiBul(topicId: string, topicIsim: string, ders: Ders): Promise<string> {
  // 1. topicId ile direkt eşleşmiş
  const direkt = await prisma.kitapMetni.findMany({
    where: { topicId },
    orderBy: { createdAt: "asc" },
  });

  if (direkt.length > 0) {
    return direkt.map((k) => `### ${k.bolum}\n${k.icerik}`).join("\n\n");
  }

  // 2. Bölüm adına göre arama (ILIKE benzeri — JS tarafında filtrele)
  const dersMetinleri = await prisma.kitapMetni.findMany({
    where: { ders: ders as never },
    select: { bolum: true, icerik: true },
  });

  const isimNorm = topicIsim.toLowerCase().replace(/[çşğüöı]/g, (c) =>
    ({ ç: "c", ş: "s", ğ: "g", ü: "u", ö: "o", ı: "i" }[c] ?? c)
  );

  const ilgili = dersMetinleri.filter((k) => {
    const bolumNorm = k.bolum.toLowerCase().replace(/[çşğüöı]/g, (c) =>
      ({ ç: "c", ş: "s", ğ: "g", ü: "u", ö: "o", ı: "i" }[c] ?? c)
    );
    return bolumNorm.includes(isimNorm.split(" ")[0]) || isimNorm.includes(bolumNorm.split(" ")[0]);
  });

  if (ilgili.length > 0) {
    return ilgili.map((k) => `### ${k.bolum}\n${k.icerik}`).join("\n\n");
  }

  return ""; // Bulunamadı, Claude kendi bilgisinden üretecek
}

async function anlatimUret(
  anthropic: Anthropic,
  topicIsim: string,
  dersIsim: string,
  kitapIcerigi: string
): Promise<string> {
  const contextBlok = kitapIcerigi
    ? `\nAşağıda bu konuyla ilgili MEB ders kitabından alınan bölümler var:\n\n<kitap_icerigi>\n${kitapIcerigi.slice(0, 8000)}\n</kitap_icerigi>\n\nBu içeriği baz alarak`
    : "\nMEB 8. sınıf müfredatına göre";

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Sen bir LGS uzmanı öğretmensin.${contextBlok} "${topicIsim}" konusunu (${dersIsim} dersi) şu formatta anlat:

## ${topicIsim}

**Temel Kavramlar:**
[En önemli 3-5 kavramı madde madde açıkla, 8. sınıf seviyesine uygun]

**Konu Özeti:**
[Konuyu 3-4 paragrafta açıkla, günlük hayattan örneklerle destekle]

**Önemli Noktalar:**
[LGS sınavında çıkabilecek kritik noktalar, madde madde]

**Örnek Soru Tipi:**
[Bu konudan nasıl soru çıkar, kısa bir örnek ve çözümü]

Türkçe yaz. Öğrenci dostu, sade bir dil kullan. 400-600 kelime olsun.`,
      },
    ],
  });

  const blok = msg.content.find((b) => b.type === "text");
  if (!blok || blok.type !== "text") throw new Error("Claude yanıt vermedi");
  return blok.text;
}

async function main() {
  const args = process.argv.slice(2);
  const dersFiltre = args.includes("--ders") ? (args[args.indexOf("--ders") + 1] as Ders) : null;
  const limit = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : null;
  const yenile = args.includes("--yenile");

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY tanımlı değil");
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // Konuları çek
  const where: Record<string, unknown> = { parentId: { not: null } }; // leaf konular
  if (!yenile) where.aiAnlatim = null;
  if (dersFiltre) where.ders = dersFiltre;

  const konular = await prisma.topic.findMany({
    where: where as never,
    select: { id: true, isim: true, ders: true },
    orderBy: { ders: "asc" },
    take: limit ?? 1000,
  });

  console.log(`\n🤖 AI Anlatım Üretimi`);
  console.log(`📚 ${konular.length} konu işlenecek`);
  if (dersFiltre) console.log(`🔍 Filtre: ${DERS_ISIM[dersFiltre]}`);
  if (yenile) console.log(`♻️  Yenileme modu: zaten olanlar da güncellenecek`);
  console.log();

  let basarili = 0;
  let kitapliUretim = 0;
  let hatali = 0;

  for (const konu of konular) {
    const dersIsim = DERS_ISIM[konu.ders] ?? konu.ders;
    process.stdout.write(`⏳ ${dersIsim} → ${konu.isim}... `);

    try {
      const kitapIcerigi = await kitapIcerigiBul(konu.id, konu.isim, konu.ders as Ders);

      if (kitapIcerigi) {
        process.stdout.write("[kitap içeriğiyle] ");
        kitapliUretim++;
      } else {
        process.stdout.write("[genel bilgiyle] ");
      }

      const anlatim = await anlatimUret(anthropic, konu.isim, dersIsim, kitapIcerigi);

      await prisma.topic.update({
        where: { id: konu.id },
        data: { aiAnlatim: anlatim, aiAnlatimTarihi: new Date() },
      });

      console.log("✅");
      basarili++;

      // Rate limit
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : String(err)}`);
      hatali++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Başarılı: ${basarili} (${kitapliUretim} kitap içeriğiyle)`);
  if (hatali > 0) console.log(`❌ Hatalı: ${hatali}`);
  console.log(`${"=".repeat(50)}\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
