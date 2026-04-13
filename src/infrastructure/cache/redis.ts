/**
 * Upstash Redis Cache
 *
 * AI yanıtlarını cache'leyerek API maliyetini düşürür.
 * Redis yoksa veya bağlantı başarısızsa sessizce fallback yapar (no-op cache).
 *
 * Gerekli env:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    redis = new Redis({ url, token });
    return redis;
  } catch {
    return null;
  }
}

/**
 * Cache'den oku veya üret.
 * Redis bağlantısı yoksa doğrudan generator'ı çağırır.
 */
export async function getCachedOrGenerate<T>(
  key: string,
  ttlSeconds: number,
  generator: () => Promise<T>
): Promise<T> {
  const r = getRedis();

  if (r) {
    try {
      const cached = await r.get<T>(key);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    } catch {
      // Redis hata verirse sessizce devam et
    }
  }

  const result = await generator();

  if (r) {
    try {
      await r.set(key, result, { ex: ttlSeconds });
    } catch {
      // Yazma hatası — sessizce devam et
    }
  }

  return result;
}

/**
 * Cache key'ini sil
 */
export async function invalidateCache(key: string): Promise<void> {
  const r = getRedis();
  if (r) {
    try {
      await r.del(key);
    } catch {
      // Sessizce devam et
    }
  }
}
