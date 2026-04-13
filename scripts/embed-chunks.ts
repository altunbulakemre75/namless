/**
 * ContentChunk'lara embedding ekle (Voyage AI veya OpenAI)
 *
 * Kullanım: npx tsx scripts/embed-chunks.ts
 *
 * Gerekli env:
 *   VOYAGE_API_KEY veya OPENAI_API_KEY (.env.local'da)
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EmbeddingProvider = "voyage" | "openai";

function detectProvider(): EmbeddingProvider {
  if (process.env.VOYAGE_API_KEY) return "voyage";
  if (process.env.OPENAI_API_KEY) return "openai";
  throw new Error(
    "VOYAGE_API_KEY veya OPENAI_API_KEY tanımlı değil (.env.local'a ekle)"
  );
}

async function getEmbedding(text: string, provider: EmbeddingProvider): Promise<number[]> {
  const truncated = text.slice(0, 8000);

  if (provider === "voyage") {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({ model: "voyage-3-lite", input: truncated }),
    });
    if (!res.ok) throw new Error(`Voyage API hata: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.data[0].embedding;
  }

  // OpenAI
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: truncated }),
  });
  if (!res.ok) throw new Error(`OpenAI API hata: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

async function main() {
  const provider = detectProvider();
  console.log(`\n🔢 Embedding pipeline — provider: ${provider}\n`);

  // Tüm chunk'ları çek
  const chunks = await prisma.contentChunk.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`${chunks.length} chunk bulundu`);

  let islenen = 0;
  let atlanan = 0;
  let hatali = 0;

  for (const chunk of chunks) {
    // Embedding zaten var mı? (Supabase'den kontrol)
    const { data: existing } = await supabase
      .from("content_chunks")
      .select("id")
      .eq("id", chunk.id)
      .not("embedding", "is", null)
      .single();

    if (existing) {
      atlanan++;
      continue;
    }

    try {
      process.stdout.write(`⏳ [${islenen + 1}] ${chunk.bolum.slice(0, 40)}... `);
      const embedding = await getEmbedding(chunk.icerik, provider);

      const { error } = await supabase
        .from("content_chunks")
        .update({ embedding })
        .eq("id", chunk.id);

      if (error) {
        console.log(`❌ DB hata: ${error.message}`);
        hatali++;
      } else {
        console.log("✅");
        islenen++;
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : String(err)}`);
      hatali++;
    }
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`✅ ${islenen} embedding oluşturuldu`);
  console.log(`⏭️ ${atlanan} zaten mevcuttu`);
  if (hatali > 0) console.log(`❌ ${hatali} hata`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
