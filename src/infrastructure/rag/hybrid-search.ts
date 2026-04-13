/**
 * Hibrit RAG Arama — Archon HybridSearch uyarlaması
 *
 * Üç katmanlı arama + mastery-tabanlı yeniden sıralama:
 *   1. Semantik eşleşme (topicId + bolum)
 *   2. Anahtar kelime eşleşme (ILIKE fuzzy)
 *   3. Ders fallback (genel içerik)
 *
 * Mastery reranking: düşük mastery → temel içerik önce
 * Çıktı: Puanlı ve sıralı ContentChunk listesi
 */

import type { PrismaClient } from "@prisma/client";

export interface RankedChunk {
  id: string;
  icerik: string;
  bolum: string;
  kaynak: string;
  skor: number; // 0-1, arama + mastery ağırlıklı
  topicId?: string | null;
}

export interface HybridSearchOptions {
  topicId?: string;
  topicIsim: string;
  ders: string;
  masterySkoru?: number; // 0-100, içerik derinliğini etkiler
  limit?: number;
  keywords?: string[]; // Ek arama kelimeleri
}

/**
 * Hibrit arama — 3 katman + mastery reranking
 */
export async function hybridSearch(
  prisma: PrismaClient,
  opts: HybridSearchOptions,
): Promise<RankedChunk[]> {
  const limit = opts.limit ?? 5;
  const mastery = opts.masterySkoru ?? 50;

  const allChunks: RankedChunk[] = [];
  const seenIds = new Set<string>();

  // Katman 1: topicId ile doğrudan eşleşme (en yüksek skor)
  if (opts.topicId) {
    const direktChunks = await (prisma as any).contentChunk.findMany({
      where: { topicId: opts.topicId },
      take: limit,
      orderBy: { createdAt: "asc" },
    });

    for (const chunk of direktChunks) {
      if (!seenIds.has(chunk.id)) {
        seenIds.add(chunk.id);
        allChunks.push({
          id: chunk.id,
          icerik: chunk.icerik,
          bolum: chunk.bolum,
          kaynak: chunk.kaynak,
          skor: 1.0,
          topicId: chunk.topicId,
        });
      }
    }
  }

  // Katman 2: Konu ismi + anahtar kelimelerle fuzzy arama
  if (allChunks.length < limit) {
    const remaining = limit - allChunks.length;
    const searchTerms = buildSearchTerms(opts.topicIsim, opts.keywords);

    for (const term of searchTerms) {
      const fuzzyChunks = await (prisma as any).contentChunk.findMany({
        where: {
          ders: opts.ders as any,
          OR: [
            { bolum: { contains: term, mode: "insensitive" } },
            { icerik: { contains: term, mode: "insensitive" } },
          ],
          id: { notIn: [...seenIds] },
        },
        take: remaining,
        orderBy: { createdAt: "asc" },
      });

      for (const chunk of fuzzyChunks) {
        if (!seenIds.has(chunk.id)) {
          seenIds.add(chunk.id);
          const relevance = computeKeywordRelevance(chunk.icerik, term);
          allChunks.push({
            id: chunk.id,
            icerik: chunk.icerik,
            bolum: chunk.bolum,
            kaynak: chunk.kaynak,
            skor: 0.7 * relevance,
            topicId: chunk.topicId,
          });
        }
      }

      if (allChunks.length >= limit) break;
    }
  }

  // Katman 3: Ders fallback
  if (allChunks.length < 2) {
    const fallbackChunks = await (prisma as any).contentChunk.findMany({
      where: {
        ders: opts.ders as any,
        id: { notIn: [...seenIds] },
      },
      take: limit - allChunks.length,
      orderBy: { createdAt: "asc" },
    });

    for (const chunk of fallbackChunks) {
      if (!seenIds.has(chunk.id)) {
        seenIds.add(chunk.id);
        allChunks.push({
          id: chunk.id,
          icerik: chunk.icerik,
          bolum: chunk.bolum,
          kaynak: chunk.kaynak,
          skor: 0.3,
          topicId: chunk.topicId,
        });
      }
    }
  }

  // Mastery reranking
  const reranked = masteryRerank(allChunks, mastery);

  return reranked.slice(0, limit);
}

/**
 * Mastery'ye göre yeniden sıralama
 * Düşük mastery → temel/giriş içerik önce (kısa bolumlar)
 * Yüksek mastery → detaylı/ileri içerik önce (uzun bolumlar)
 */
function masteryRerank(chunks: RankedChunk[], mastery: number): RankedChunk[] {
  return chunks
    .map((chunk) => {
      const icerikUzunluk = chunk.icerik.length;
      const isTemelIcerik = icerikUzunluk < 500 ||
        /giriş|temel|tanım|nedir/i.test(chunk.bolum);
      const isIleriIcerik = icerikUzunluk > 1000 ||
        /ileri|detay|uygulama|örnek/i.test(chunk.bolum);

      let masteryBonus = 0;

      if (mastery < 40 && isTemelIcerik) {
        masteryBonus = 0.2; // Düşük mastery → temel içerik önce
      } else if (mastery >= 60 && isIleriIcerik) {
        masteryBonus = 0.15; // Yüksek mastery → ileri içerik önce
      }

      return { ...chunk, skor: Math.min(1, chunk.skor + masteryBonus) };
    })
    .sort((a, b) => b.skor - a.skor);
}

/**
 * Arama terimlerini oluştur (konu ismini tokenize et)
 */
function buildSearchTerms(topicIsim: string, keywords?: string[]): string[] {
  const terms = new Set<string>();

  // Konu ismini ekle
  terms.add(topicIsim);

  // Kelime kelime ayır (3+ karakter olanlar)
  topicIsim.split(/\s+/).forEach((word) => {
    if (word.length >= 3) terms.add(word);
  });

  // Ek anahtar kelimeler
  keywords?.forEach((kw) => terms.add(kw));

  return [...terms];
}

/**
 * Anahtar kelime alaka düzeyi hesapla (0-1)
 */
function computeKeywordRelevance(icerik: string, keyword: string): number {
  const normalized = icerik.toLowerCase();
  const normalizedKw = keyword.toLowerCase();

  const occurrences = (normalized.match(new RegExp(normalizedKw, "g")) ?? []).length;

  if (occurrences === 0) return 0;
  if (occurrences >= 5) return 1;
  return occurrences / 5;
}

/**
 * Chunk'ları prompt için formatlı metin haline getir
 */
export function formatChunksForPrompt(chunks: RankedChunk[]): string {
  if (chunks.length === 0) return "";

  return chunks
    .map((chunk, i) =>
      `[Kaynak ${i + 1}: ${chunk.kaynak} — ${chunk.bolum}]\n${chunk.icerik}`
    )
    .join("\n\n---\n\n");
}
