/**
 * Konu anlatimi uretme scripti
 * Calistirmak icin: npx ts-node --project tsconfig.json scripts/generate-anlatim.ts
 *
 * Supabase Storage'daki PDF'leri okuyup her konu icin AI anlatimi uretir.
 * Uretilen anlatim Topic.aiAnlatim alanina kaydedilir.
 * Bir daha calistirinca sadece aiAnlatim bos olanlari gunceller.
 */

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DERS_ISIM: Record<string, string> = {
  MATEMATIK: "Matematik",
  FEN: "Fen Bilimleri",
  TURKCE: "Türkçe",
  SOSYAL: "Sosyal Bilgiler",
  INGILIZCE: "İngilizce",
  DIN: "Din Kültürü",
};

async function pdfdenAnlatimUret(
  topicIsim: string,
  dersIsim: string,
  pdfUrl: string
): Promise<string> {
  const response = await fetch(pdfUrl);
  if (!response.ok) throw new Error(`PDF indirilemedi: ${pdfUrl}`);
  const pdfBuffer = await response.arrayBuffer();
  const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: `Bu PDF bir MEB ders kitabıdır. "${topicIsim}" konusunu (${dersIsim} dersi) bul ve şu formatta bir konu anlatımı çıkar:

## ${topicIsim}

**Temel Kavramlar:**
[En önemli 3-5 kavramı madde madde açıkla, 8. sınıf seviyesine uygun]

**Konu Özeti:**
[Konuyu 3-4 paragrafta açıkla, örneklerle destekle]

**Önemli Noktalar:**
[LGS sınavında çıkabilecek kritik noktalar, madde madde]

**Örnek Soru Tipi:**
[Bu konudan nasıl soru çıkar, kısa bir örnek]

Yanıtı Türkçe yaz. Öğrenci dostu, sade bir dil kullan. Toplam 400-600 kelime olsun.`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("AI yanıt vermedi");
  return textBlock.text;
}

async function main() {
  console.log("🚀 Konu anlatımı üretimi başlıyor...\n");

  // pdfUrl olan ama aiAnlatim olmayan konuları al
  const konular = await prisma.topic.findMany({
    where: {
      pdfUrl: { not: null },
      aiAnlatim: null,
    },
    orderBy: { ders: "asc" },
  });

  if (konular.length === 0) {
    console.log("✅ Tüm konuların anlatımı zaten üretilmiş.");
    return;
  }

  console.log(`📋 ${konular.length} konu için anlatım üretilecek.\n`);

  let basarili = 0;
  let hatali = 0;

  for (const konu of konular) {
    try {
      process.stdout.write(`⏳ ${DERS_ISIM[konu.ders]} → ${konu.isim}... `);

      const anlatim = await pdfdenAnlatimUret(
        konu.isim,
        DERS_ISIM[konu.ders],
        konu.pdfUrl!
      );

      await prisma.topic.update({
        where: { id: konu.id },
        data: {
          aiAnlatim: anlatim,
          aiAnlatimTarihi: new Date(),
        },
      });

      console.log("✅");
      basarili++;

      // Rate limit için kısa bekleme
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.log(`❌ Hata: ${err instanceof Error ? err.message : err}`);
      hatali++;
    }
  }

  console.log(`\n✅ Tamamlandı: ${basarili} başarılı, ${hatali} hatalı`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
