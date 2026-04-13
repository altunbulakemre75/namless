/**
 * Bağlam Sıkıştırma
 *
 * Uzun oturumlarda konuşma geçmişini sıkıştırarak token kullanımını düşürür.
 * Kaynak: Hermes agent/context_compressor.py uyarlaması
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const PROTECT_FIRST_N = 2;  // İlk 2 mesajı koru (sistem + ilk soru)
const PROTECT_LAST_N = 4;   // Son 4 mesajı koru (aktif çalışma)
const MAX_CONTEXT_CHARS = 80000; // ~20K token yaklaşık

export class ContextCompressor {
  /**
   * Sıkıştırma gerekli mi?
   */
  shouldCompress(messages: Message[]): boolean {
    const totalChars = messages.reduce((s, m) => s + m.content.length, 0);
    return totalChars > MAX_CONTEXT_CHARS * 0.75;
  }

  /**
   * Mesajları sıkıştır
   * İlk N ve son N mesajı korur, ortadakileri özetler
   */
  compress(messages: Message[]): Message[] {
    if (messages.length <= PROTECT_FIRST_N + PROTECT_LAST_N) {
      return messages;
    }

    const protectedStart = messages.slice(0, PROTECT_FIRST_N);
    const protectedEnd = messages.slice(-PROTECT_LAST_N);
    const middle = messages.slice(PROTECT_FIRST_N, -PROTECT_LAST_N);

    // Ortadaki mesajları basit özetle (AI çağırmadan)
    const ozet = this.quickSummarize(middle);

    return [
      ...protectedStart,
      { role: "system" as const, content: `[Önceki konuşma özeti: ${ozet}]` },
      ...protectedEnd,
    ];
  }

  /**
   * Hızlı özet — AI çağırmadan anahtar bilgileri çıkar
   */
  private quickSummarize(messages: Message[]): string {
    const soruSayisi = messages.filter((m) => m.role === "user").length;
    const cevapSayisi = messages.filter((m) => m.role === "assistant").length;

    // Kullanıcı mesajlarından anahtar kelimeleri çıkar
    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content.slice(0, 100));

    // Asistan cevaplarından doğru/yanlış bilgisi çıkar
    const dogruSayisi = messages
      .filter((m) => m.role === "assistant" && /doğru|✓/i.test(m.content))
      .length;
    const yanlisSayisi = messages
      .filter((m) => m.role === "assistant" && /yanlış|✗/i.test(m.content))
      .length;

    return `${soruSayisi} soru çözüldü (${dogruSayisi} doğru, ${yanlisSayisi} yanlış). ` +
      `Son konuşmalar: ${userMessages.slice(-3).join(" | ")}`;
  }
}
