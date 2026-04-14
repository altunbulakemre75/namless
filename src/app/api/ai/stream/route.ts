/**
 * SSE Streaming API — /api/ai/stream
 *
 * POST body:
 *   { prompt: string, topicId?: string, mode: TaskType }
 *
 * Provider seçimi model-router üzerinden yapılır.
 * Claude veya Gemini'ye göre akışı başlatır.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSSEStream, SSE_HEADERS, formatSSE } from "@/infrastructure/ai/streaming";
import { getModelForTask, type TaskType } from "@/infrastructure/ai/model-router";
import { callGeminiStream } from "@/infrastructure/ai/providers/gemini-provider";
import { sanitizeInput } from "@/infrastructure/security/prompt-guard";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/** Supabase auth token ile userId doğrula */
async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase.auth.getUser(token);
  return data.user?.id ?? null;
}

export async function POST(request: NextRequest) {
  // Auth kontrolü
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let body: { prompt?: string; topicId?: string; mode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const { prompt, mode } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "Prompt boş olamaz" }, { status: 400 });
  }

  const taskType = (mode as TaskType) ?? "copilot_sohbet";
  const config = getModelForTask(taskType);

  if (config.provider === "none") {
    return NextResponse.json({ error: "Bu görev için AI gerekli değil" }, { status: 400 });
  }

  const sanitized = sanitizeInput(prompt.trim(), taskType);

  const stream = createSSEStream(async (controller) => {
    const send = (data: string) => {
      (controller as unknown as { send: (d: unknown) => void }).send(
        JSON.parse(data.replace(/^data: /, ""))
      );
    };

    // Doğrudan encoder kullanacağız
    const encoder = new TextEncoder();
    const enqueue = (event: unknown) => {
      (controller as ReadableStreamDefaultController).enqueue(
        encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
      );
    };

    enqueue({ type: "start", mode: taskType });

    try {
      if (config.provider === "gemini") {
        // Gemini stream — hata durumunda Claude Haiku'ya düş
        let geminiSuccess = false;
        const gen = callGeminiStream(sanitized, config);
        for await (const chunk of gen) {
          if (chunk === "[GEMINI_ERROR]") {
            // Gemini başarısız → fallback tetiklenir, döngüden çık
            break;
          }
          geminiSuccess = true;
          enqueue({ type: "chunk", text: chunk });
        }
        if (geminiSuccess) {
          enqueue({ type: "done" });
          return;
        }
        // Gemini başarısız oldu → Claude Haiku ile devam et (aşağı düş)
      }

      {
        // Claude stream (Gemini fallback veya doğrudan Claude görevi)
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey || apiKey.startsWith("buraya")) {
          enqueue({ type: "error", message: "ANTHROPIC_API_KEY eksik" });
          return;
        }

        // Gemini fallback durumunda Claude Haiku kullan
        const claudeModel = config.provider === "gemini"
          ? "claude-haiku-4-5-20251001"
          : config.model;

        const response = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: claudeModel,
            max_tokens: config.maxTokens,
            stream: true,
            messages: [{ role: "user", content: sanitized }],
          }),
        });

        if (!response.ok || !response.body) {
          enqueue({ type: "error", message: "Claude stream başlatılamadı" });
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
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.type === "content_block_delta") {
                const text = parsed.delta?.text ?? "";
                if (text) enqueue({ type: "chunk", text });
              }
            } catch { /* atla */ }
          }
        }
      }

      enqueue({ type: "done" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      enqueue({ type: "error", message: msg });
    }
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

// preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
