import type { ChatMessage } from "./types";
import OpenAI from "openai";
import { logger, describeError } from "../whatsapp/logger";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 2; // percobaan pertama + 1x retry

interface NemotronConfig {
  apiKey: string;
  model: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callNvidiaApi(config: NemotronConfig, messages: ChatMessage[], temperature: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const client = new OpenAI({ apiKey: config.apiKey, baseURL: "https://integrate.api.nvidia.com/v1" });
    const request = { model: config.model, messages, temperature, max_tokens: 768, stream: false, chat_template_kwargs: { enable_thinking: false } };
    const data = await client.chat.completions.create(request as never, { signal: controller.signal });
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new Error("NVIDIA API tidak mengembalikan konten jawaban yang valid.");
    }

    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Panggil model Nemotron langsung ke NVIDIA API (integrate.api.nvidia.com,
 * OpenAI-compatible, bukan streaming - bot butuh teks lengkap sebelum
 * dikirim balas ke WhatsApp). Retry sekali kalau percobaan pertama gagal
 * (timeout/error jaringan/response tidak valid), lalu throw error yang
 * jelas kalau tetap gagal - dibiarkan ditangani pemanggil (chatHandler)
 * supaya bot tidak crash.
 */
export async function askAI(config: NemotronConfig, messages: ChatMessage[], options: { temperature?: number } = {}): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await callNvidiaApi(config, messages, options.temperature ?? 0.2);
    } catch (error: unknown) {
      lastError = error;
      logger.warn("Percobaan panggilan NVIDIA API gagal.", { attempt, maxAttempts: MAX_ATTEMPTS, error: describeError(error) });

      if (attempt < MAX_ATTEMPTS) {
        await sleep(1_000);
      }
    }
  }

  throw new Error(`Gagal memanggil NVIDIA API setelah ${MAX_ATTEMPTS} percobaan: ${describeError(lastError)}`);
}

export type { NemotronConfig };
