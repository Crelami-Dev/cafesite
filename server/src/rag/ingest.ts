import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnv, getEmbeddingConfig } from "../config/env";
import { openDatabase } from "../db/database";
import { logger, describeError } from "../whatsapp/logger";
import { ingestDocument } from "./pipeline";
import { makeEmbedder } from "./retrieve";

/** CLI: npm run rag:ingest <file.pdf|file.md> - memasukkan dokumen langsung ke SQLite tanpa dashboard. */
async function main(): Promise<void> {
  const argument = process.argv[2];
  if (!argument) throw new Error("Argumen path dokumen wajib diisi. Contoh: npm run rag:ingest docs/info.md");
  const filePath = path.resolve(argument);
  const env = loadEnv();
  const db = openDatabase(env.dbPath);
  const result = await ingestDocument(db, makeEmbedder(getEmbeddingConfig(env)), await readFile(filePath), path.basename(filePath));
  logger.info("Ingest selesai.", { source: path.basename(filePath), chunks: result.chunks, embedded: result.embedded });
}
void main().catch((error: unknown) => {
  logger.error("Ingest gagal.", { error: describeError(error) });
  process.exitCode = 1;
});
