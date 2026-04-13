/**
 * Prompt Injection Koruması
 *
 * Kullanıcı girdilerini ve kitap içeriklerini prompt injection'a karşı tarar.
 * Kaynak: Hermes agent/prompt_builder.py _scan_context_content() uyarlaması
 */

const THREAT_PATTERNS = [
  { pattern: /ignore\s+(previous|all|above)\s+instructions/i, id: "prompt_injection" },
  { pattern: /system\s+prompt\s+override/i, id: "sys_override" },
  { pattern: /disregard\s+(your|all)\s+(instructions|rules)/i, id: "disregard" },
  { pattern: /act\s+as\s+if\s+you\s+have\s+no\s+restrictions/i, id: "bypass" },
  { pattern: /you\s+are\s+now\s+(a|an)\s+/i, id: "role_hijack" },
  { pattern: /forget\s+(everything|all)\s+(you|your)/i, id: "memory_wipe" },
  { pattern: /new\s+instructions?\s*:/i, id: "new_instructions" },
  { pattern: /\[SYSTEM\]/i, id: "fake_system_tag" },
];

const INVISIBLE_CHARS = new Set([
  "\u200b", // zero-width space
  "\u200c", // zero-width non-joiner
  "\u200d", // zero-width joiner
  "\u2060", // word joiner
  "\ufeff", // BOM
]);

/**
 * Girdi metnini temizle ve tehdit kontrolü yap
 * @param text - Kontrol edilecek metin
 * @param source - Kaynak tanımı (log için)
 * @returns Temizlenmiş metin
 */
export function sanitizeInput(text: string, source: string): string {
  if (!text) return text;

  // Görünmez karakter kontrolü
  let cleaned = text;
  for (const char of INVISIBLE_CHARS) {
    if (cleaned.includes(char)) {
      console.warn(`[PromptGuard] ${source}: görünmez unicode tespit edildi`);
      cleaned = cleaned.split(char).join("");
    }
  }

  // Tehdit kalıbı kontrolü
  for (const { pattern, id } of THREAT_PATTERNS) {
    if (pattern.test(cleaned)) {
      console.warn(`[PromptGuard] ${source}: tehdit tespit edildi → ${id}`);
      // Tehditli kısmı temizle ama tüm metni silme
      cleaned = cleaned.replace(pattern, "[kaldırıldı]");
    }
  }

  return cleaned;
}

/**
 * RAG içeriğini kontrol et (kitap metinleri)
 * Kitaplardan gelen içerik de manipüle edilmiş olabilir
 */
export function sanitizeRAGContent(content: string, kaynak: string): string {
  return sanitizeInput(content, `RAG:${kaynak}`);
}

/**
 * Kullanıcı soru/cevap girdisini kontrol et
 */
export function sanitizeUserInput(input: string): string {
  return sanitizeInput(input, "user_input");
}
