/**
 * Credential Pool — Çoklu API Key Yönetimi
 *
 * Hermes'in credential_pool.py uyarlaması.
 * Birden fazla API key'i round-robin döndürerek rate limit'e takılmayı engeller.
 *
 * Kullanım:
 *   .env.local'da virgülle ayrılmış key'ler:
 *   ANTHROPIC_API_KEYS=sk-ant-key1,sk-ant-key2,sk-ant-key3
 *
 *   Veya tek key:
 *   ANTHROPIC_API_KEY=sk-ant-key1
 */

interface Credential {
  key: string;
  status: "ok" | "rate_limited" | "exhausted";
  lastUsed: number; // timestamp
  failCount: number;
}

let instance: CredentialPool | null = null;

export class CredentialPool {
  private credentials: Credential[] = [];

  constructor() {
    const multiKeys = process.env.ANTHROPIC_API_KEYS ?? "";
    const singleKey = process.env.ANTHROPIC_API_KEY ?? "";

    const keys = multiKeys
      ? multiKeys.split(",").map((k) => k.trim()).filter(Boolean)
      : singleKey
        ? [singleKey.trim()]
        : [];

    this.credentials = keys.map((key) => ({
      key,
      status: "ok" as const,
      lastUsed: 0,
      failCount: 0,
    }));
  }

  static getInstance(): CredentialPool {
    if (!instance) {
      instance = new CredentialPool();
    }
    return instance;
  }

  /**
   * En az kullanılan aktif key'i döndür (round-robin)
   */
  getNextKey(): string {
    const available = this.credentials
      .filter((c) => c.status === "ok")
      .sort((a, b) => a.lastUsed - b.lastUsed);

    if (available.length > 0) {
      const selected = available[0];
      selected.lastUsed = Date.now();
      return selected.key;
    }

    // Tümü rate limited → en az fail'li olanı dene
    const fallback = [...this.credentials].sort((a, b) => a.failCount - b.failCount);
    if (fallback.length > 0) {
      fallback[0].lastUsed = Date.now();
      return fallback[0].key;
    }

    return "";
  }

  /**
   * Key'i rate limited olarak işaretle
   * 60 saniye sonra otomatik recovery
   */
  markRateLimited(key: string): void {
    const cred = this.credentials.find((c) => c.key === key);
    if (!cred) return;

    cred.status = "rate_limited";
    cred.failCount++;

    // 60 saniye sonra tekrar dene
    setTimeout(() => {
      cred.status = "ok";
    }, 60000);
  }

  /**
   * Key'i başarılı olarak işaretle (fail count sıfırla)
   */
  markSuccess(key: string): void {
    const cred = this.credentials.find((c) => c.key === key);
    if (cred) {
      cred.failCount = 0;
      cred.status = "ok";
    }
  }

  /**
   * Mevcut key sayısı
   */
  get size(): number {
    return this.credentials.length;
  }

  /**
   * Aktif key sayısı
   */
  get activeCount(): number {
    return this.credentials.filter((c) => c.status === "ok").length;
  }
}
