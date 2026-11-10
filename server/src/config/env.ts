import path from "node:path";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: ".env.local" });
loadDotenv();

export interface BotEnv {
  /** Nomor bot hanya untuk tampilan (opsional). Pairing dilakukan lewat QR di dashboard. */
  waBotPhone: string | undefined;
  waSessionId: string;
  waSessionDir: string;
  dbPath: string;
  botControlHost: string;
  botControlPort: number;
  botControlToken: string;
  nvidiaApiKey: string | undefined;
  nvidiaModel: string | undefined;
  embeddingModel: string | undefined;
  embeddingApiKey: string | undefined;
  embeddingBaseUrl: string | undefined;
  ragPollMs: number;
  rateLimitMaxPerMinute: number;
  rateLimitWindowMs: number;
  botIdleMs: number;
  botReminderMs: number;
  logLevel: "info" | "warn" | "error";
}

function readOptionalInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readOptional(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") return undefined;
  return value.trim();
}

function readLogLevel(): BotEnv["logLevel"] {
  const value = process.env.LOG_LEVEL?.trim().toLowerCase();
  return value === "warn" || value === "error" ? value : "info";
}

/**
 * Hanya BOT_CONTROL_TOKEN yang wajib: tanpa token, dashboard tidak bisa mengendalikan bot dan
 * port kontrol akan terbuka tanpa perlindungan. Variabel AI/embedding opsional; bot tetap
 * menjawab dari menu dan dokumen lokal kalau kunci AI belum diisi.
 */
export function loadEnv(): BotEnv {
  const token = readOptional("BOT_CONTROL_TOKEN");
  if (!token || token.length < 16) {
    throw new Error('Environment variable "BOT_CONTROL_TOKEN" wajib diisi minimal 16 karakter (samakan dengan WA_BOT_CONTROL_TOKEN di .env.local Next.js).');
  }
  return {
    waBotPhone: readOptional("WA_BOT_PHONE")?.replace(/^0/, "62"),
    waSessionId: readOptional("WA_SESSION_ID") ?? "cafesite",
    waSessionDir: path.resolve(readOptional("WA_SESSION_DIR") ?? "./session"),
    dbPath: path.resolve(readOptional("DB_PATH") ?? "../.data/cafesite.dev.db"),
    botControlHost: readOptional("BOT_CONTROL_HOST") ?? "127.0.0.1",
    botControlPort: readOptionalInt("BOT_CONTROL_PORT", 8787),
    botControlToken: token,
    nvidiaApiKey: readOptional("NVIDIA_API_KEY"),
    nvidiaModel: readOptional("NVIDIA_MODEL"),
    embeddingModel: readOptional("EMBEDDING_MODEL"),
    embeddingApiKey: readOptional("EMBEDDING_API_KEY"),
    embeddingBaseUrl: readOptional("EMBEDDING_BASE_URL"),
    ragPollMs: Math.max(1000, readOptionalInt("RAG_POLL_MS", 3000)),
    rateLimitMaxPerMinute: readOptionalInt("RATE_LIMIT_MAX_PER_MINUTE", 5),
    rateLimitWindowMs: readOptionalInt("RATE_LIMIT_WINDOW_MS", 60_000),
    botIdleMs: readOptionalInt("BOT_IDLE_MINUTES", 10) * 60_000,
    botReminderMs: readOptionalInt("BOT_REMINDER_MINUTES", 8) * 60_000,
    logLevel: readLogLevel(),
  };
}

export interface AiConfig { apiKey: string; model: string }
export interface EmbeddingConfig { apiKey: string; model: string; baseUrl: string }

/** null = AI belum dikonfigurasi; pemanggil jatuh ke jawaban lokal dari menu dan dokumen. */
export function getAiConfig(env: BotEnv): AiConfig | null {
  return env.nvidiaApiKey && env.nvidiaModel ? { apiKey: env.nvidiaApiKey, model: env.nvidiaModel } : null;
}

/** null = RAG berjalan dengan pencarian kata kunci saja. */
export function getEmbeddingConfig(env: BotEnv): EmbeddingConfig | null {
  return env.embeddingApiKey && env.embeddingModel && env.embeddingBaseUrl
    ? { apiKey: env.embeddingApiKey, model: env.embeddingModel, baseUrl: env.embeddingBaseUrl }
    : null;
}
