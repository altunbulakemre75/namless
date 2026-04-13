/**
 * Supabase'de pgvector extension + embedding sütunu + match fonksiyonu oluştur
 *
 * Kullanım: npx tsx scripts/setup-pgvector.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("pgvector kurulumu başlatılıyor...\n");

  // 1. pgvector extension
  console.log("1. pgvector extension aktifleştiriliyor...");
  const { error: extErr } = await supabase.rpc("exec_sql", {
    query: "CREATE EXTENSION IF NOT EXISTS vector;",
  });

  if (extErr) {
    // rpc olmayabilir, doğrudan SQL dene
    const { error: extErr2 } = await supabase.from("_prisma_migrations").select("id").limit(0);
    if (extErr2) {
      console.log("   Supabase bağlantısı kontrol et. Hata:", extErr.message);
    }
    console.log("   Not: pgvector Supabase Dashboard > SQL Editor'dan aktif edilmeli:");
    console.log("   CREATE EXTENSION IF NOT EXISTS vector;");
    console.log("   Bu extension genellikle Supabase'de varsayılan olarak mevcuttur.\n");
  } else {
    console.log("   ✅ pgvector aktif\n");
  }

  // 2. embedding sütunu ekle
  console.log("2. content_chunks tablosuna embedding sütunu ekleniyor...");
  const { error: colErr } = await supabase.rpc("exec_sql", {
    query: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'content_chunks' AND column_name = 'embedding'
        ) THEN
          ALTER TABLE content_chunks ADD COLUMN embedding vector(1536);
        END IF;
      END $$;
    `,
  });

  if (colErr) {
    console.log("   SQL doğrudan çalıştırılamadı. Supabase SQL Editor'da çalıştır:");
    console.log(`
-- Supabase Dashboard > SQL Editor'da çalıştır:
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE content_chunks ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS content_chunks_embedding_idx
  ON content_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Semantic arama fonksiyonu
CREATE OR REPLACE FUNCTION match_content_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_topic_id uuid DEFAULT null
)
RETURNS TABLE (
  id uuid,
  topic_id uuid,
  ders text,
  kaynak text,
  bolum text,
  icerik text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id::uuid,
    cc."topicId"::uuid,
    cc.ders::text,
    cc.kaynak,
    cc.bolum,
    cc.icerik,
    (1 - (cc.embedding <=> query_embedding))::float AS similarity
  FROM content_chunks cc
  WHERE
    (filter_topic_id IS NULL OR cc."topicId"::uuid = filter_topic_id)
    AND cc.embedding IS NOT NULL
    AND (1 - (cc.embedding <=> query_embedding)) > match_threshold
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
`);
  } else {
    console.log("   ✅ embedding sütunu eklendi\n");
  }

  console.log("\n✅ Script tamamlandı.");
  console.log("Not: Eğer SQL çalıştırılamadıysa, yukarıdaki SQL'i Supabase Dashboard > SQL Editor'da çalıştır.");
}

main().catch(console.error);
