/**
 * SSE Streaming Altyapısı
 *
 * LearnHouse streaming adaptörü uyarlaması.
 * Server-Sent Events (SSE) formatında gerçek zamanlı AI yanıtları.
 *
 * Olay tipleri:
 *   start     — stream başladı
 *   chunk     — metin parçası
 *   done      — tamamlandı
 *   sources   — RAG kaynakları
 *   follow_ups — takip soruları
 *   error     — hata
 */

// ==================== EVENT TYPES ====================

export interface StreamStartEvent {
  type: "start";
  mode: string;
}

export interface StreamChunkEvent {
  type: "chunk";
  text: string;
}

export interface StreamDoneEvent {
  type: "done";
  totalTokens?: number;
}

export interface StreamSourceEvent {
  type: "sources";
  sources: Array<{ kaynak: string; bolum: string }>;
}

export interface StreamFollowUpEvent {
  type: "follow_ups";
  suggestions: string[];
}

export interface StreamErrorEvent {
  type: "error";
  message: string;
}

export type StreamEvent =
  | StreamStartEvent
  | StreamChunkEvent
  | StreamDoneEvent
  | StreamSourceEvent
  | StreamFollowUpEvent
  | StreamErrorEvent;

// ==================== SSE FORMAT ====================

/**
 * Olayı SSE wire formatına dönüştür.
 * `data: <json>\n\n` yapısı.
 */
export function formatSSE(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** Tüm SSE response'larında kullanılacak header'lar */
export const SSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no", // Nginx proxy buffering'i devre dışı bırak
};

// ==================== STREAM FACTORY ====================

export interface SSEStreamHandler {
  (controller: ReadableStreamDefaultController): Promise<void>;
}

/**
 * ReadableStream oluştur — handler async generator içerebilir.
 * Next.js Route Handler'larında Response body olarak kullanılır.
 */
export function createSSEStream(handler: SSEStreamHandler): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(formatSSE(event)));
      };

      // handler'a controller yerine send helper'ı ver
      const wrappedController = {
        ...controller,
        send,
      };

      try {
        await handler(wrappedController as unknown as ReadableStreamDefaultController);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
        controller.enqueue(
          encoder.encode(formatSSE({ type: "error", message: msg }))
        );
      } finally {
        controller.close();
      }
    },
  });
}

// ==================== CLIENT CALLBACKS ====================

export interface StreamCallbacks {
  onStart?: (mode: string) => void;
  onChunk: (text: string) => void;
  onDone: (totalTokens?: number) => void;
  onSources?: (sources: Array<{ kaynak: string; bolum: string }>) => void;
  onFollowUps?: (suggestions: string[]) => void;
  onError?: (message: string) => void;
}

/**
 * Fetch SSE response'ını oku ve callback'leri çağır.
 * Client tarafında kullanılır (KocBaloncugu gibi component'lar).
 */
export async function processStream(
  response: Response,
  callbacks: StreamCallbacks
): Promise<void> {
  if (!response.body) {
    callbacks.onError?.("Boş yanıt gövdesi");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const event = JSON.parse(jsonStr) as StreamEvent;

        switch (event.type) {
          case "start":
            callbacks.onStart?.(event.mode);
            break;
          case "chunk":
            callbacks.onChunk(event.text);
            break;
          case "done":
            callbacks.onDone(event.totalTokens);
            break;
          case "sources":
            callbacks.onSources?.(event.sources);
            break;
          case "follow_ups":
            callbacks.onFollowUps?.(event.suggestions);
            break;
          case "error":
            callbacks.onError?.(event.message);
            break;
        }
      } catch {
        // Geçersiz JSON — atla
      }
    }
  }
}
