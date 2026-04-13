/**
 * RAG Arama Servisi
 *
 * İçerik araması için 2 strateji:
 * 1. Embedding-based (pgvector) — Voyage/OpenAI API key varsa
 * 2. Text-based fallback — DB'de topicId + bolum ismi ile arama
 */

import { PrismaClient } from "@prisma/client";

export interface RAGResult {
  icerik: string;
  bolum: string;
  kaynak: string;
  similarity: number;
}

/**
 * Bir konu için ilgili içerikleri bul
 * Önce topicId ile, sonra bolum adı ile fuzzy arama yapar
 */
export async function searchRelevantContent(
  prisma: PrismaClient,
  opts: {
    topicId?: string;
    topicIsim?: string;
    ders?: string;
    limit?: number;
  }
): Promise<RAGResult[]> {
  const { topicId, topicIsim, ders, limit = 5 } = opts;
  const results: RAGResult[] = [];

  // 1. topicId ile doğrudan eşleşen chunk'lar
  if (topicId) {
    const directMatches = await prisma.contentChunk.findMany({
      where: { topicId },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    for (const m of directMatches) {
      results.push({
        icerik: m.icerik,
        bolum: m.bolum,
        kaynak: m.kaynak,
        similarity: 1.0,
      });
    }
  }

  // 2. Yeterli sonuç yoksa bolum adıyla arama
  if (results.length < limit && topicIsim) {
    const kelimeler = topicIsim
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (kelimeler.length > 0) {
      // Her kelimeyi ILIKE ile ara
      const textMatches = await prisma.contentChunk.findMany({
        where: {
          AND: [
            ...(ders ? [{ ders: ders as never }] : []),
            {
              OR: kelimeler.map((k) => ({
                bolum: { contains: k, mode: "insensitive" as const },
              })),
            },
          ],
          // topicId ile zaten bulunanları hariç tut
          ...(topicId ? { NOT: { topicId } } : {}),
        },
        take: limit - results.length,
        orderBy: { createdAt: "desc" },
      });

      for (const m of textMatches) {
        // Basit benzerlik skoru: kaç kelime eşleşiyor
        const normBolum = m.bolum.toLowerCase();
        const eslesenKelime = kelimeler.filter((k) => normBolum.includes(k)).length;
        const similarity = eslesenKelime / kelimeler.length;

        if (similarity > 0.3) {
          results.push({
            icerik: m.icerik,
            bolum: m.bolum,
            kaynak: m.kaynak,
            similarity,
          });
        }
      }
    }
  }

  // 3. Hâlâ sonuç yoksa, aynı dersten rastgele chunk'lar
  if (results.length === 0 && ders) {
    const fallback = await prisma.contentChunk.findMany({
      where: { ders: ders as never },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    for (const m of fallback) {
      results.push({
        icerik: m.icerik,
        bolum: m.bolum,
        kaynak: m.kaynak,
        similarity: 0.1,
      });
    }
  }

  return results.slice(0, limit);
}

/**
 * Embedding-based semantic arama (pgvector gerekli)
 * Supabase RPC fonksiyonu match_content_chunks'ı çağırır
 */
export async function searchByEmbedding(
  supabaseClient: {
    rpc: (fn: string, params: Record<string, unknown>) => { data: RAGResult[] | null; error: { message: string } | null };
  },
  queryEmbedding: number[],
  opts?: { topicId?: string; limit?: number; threshold?: number }
): Promise<RAGResult[]> {
  const { data, error } = supabaseClient.rpc("match_content_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: opts?.threshold ?? 0.5,
    match_count: opts?.limit ?? 5,
    filter_topic_id: opts?.topicId ?? null,
  });

  if (error) {
    console.error("Embedding arama hatası:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((d: any) => ({
    icerik: d.icerik as string,
    bolum: d.bolum as string,
    kaynak: d.kaynak as string,
    similarity: d.similarity as number,
  }));
}
