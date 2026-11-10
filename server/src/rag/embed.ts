import type { EmbeddingConfig } from "../config/env";
import { logger, describeError } from "../whatsapp/logger";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 2; // percobaan pertama + 1x retry

export type { EmbeddingConfig };

export type EmbeddingInputType = "query" | "passage";

interface NvidiaEmbeddingItem {
  embedding?: number[];
  index?: number;
}

interface NvidiaEmbeddingResponseBody {
  data?: NvidiaEmbeddingItem[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callEmbeddingApi(config: EmbeddingConfig, texts: string[], inputType: EmbeddingInputType): Promise<number[][]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(config.baseUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: texts,
        input_type: inputType,
        encoding_format: "float",
        truncate: "END",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`Embedding API merespons status ${response.status}: ${errorBody.slice(0, 300)}`);
    }

    const data = (await response.json()) as NvidiaEmbeddingResponseBody;
    if (!Array.isArray(data.data) || data.data.length !== texts.length) {
      throw new Error("Embedding API tidak mengembalikan jumlah vektor yang sesuai dengan jumlah teks input.");
    }

    const sorted = [...data.data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    return sorted.map((item, index) => {
      if (!Array.isArray(item.embedding)) {
        throw new Error(`Embedding API tidak mengembalikan vektor yang valid untuk input ke-${index}.`);
      }
      return item.embedding;
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Embed satu batch teks sekaligus. `inputType` mengikuti konvensi model
 * retrieval NVIDIA (nemotron-3-embed-1b): "passage" untuk chunk dokumen
 * yang disimpan, "query" untuk pertanyaan pengguna saat retrieve. Reuse
 * pola retry dari nemotronClient (fetch native, timeout via
 * AbortController, retry 1x, error jelas).
 */
export async function embed(config: EmbeddingConfig, texts: string[], inputType: EmbeddingInputType): Promise<number[][]> {
  if (texts.length === 0) return [];

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await callEmbeddingApi(config, texts, inputType);
    } catch (error: unknown) {
      lastError = error;
      logger.warn("Percobaan panggilan embedding API gagal.", { attempt, maxAttempts: MAX_ATTEMPTS, error: describeError(error) });

      if (attempt < MAX_ATTEMPTS) {
        await sleep(1_000);
      }
    }
  }

  throw new Error(`Gagal memanggil embedding API setelah ${MAX_ATTEMPTS} percobaan: ${describeError(lastError)}`);
}
