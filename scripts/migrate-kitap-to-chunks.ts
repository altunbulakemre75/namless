/**
 * KitapMetni verilerini ContentChunk tablosuna migrate et
 *
 * Kullanım: npx tsx scripts/migrate-kitap-to-chunks.ts
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
  const kitaplar = await prisma.kitapMetni.findMany();
  console.log(`${kitaplar.length} kitap metni bulundu`);

  let kaydedilen = 0;
  let atlanan = 0;

  for (const k of kitaplar) {
    // Zaten var mı kontrol et
    const mevcut = await prisma.contentChunk.count({
      where: { kaynak: k.kaynak, bolum: k.bolum },
    });

    if (mevcut > 0) {
      atlanan++;
      continue;
    }

    await prisma.contentChunk.create({
      data: {
        topicId: k.topicId,
        ders: k.ders,
        kaynak: k.kaynak,
        bolum: k.bolum,
        icerik: k.icerik,
        sayfaAralik: k.sayfaAralik,
      },
    });
    kaydedilen++;
  }

  console.log(`✅ ${kaydedilen} chunk migrate edildi, ${atlanan} zaten mevcuttu`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
