import { randomUUID } from "node:crypto";
import { nowIso, type Db } from "../db/database";
import { logger, describeError } from "../whatsapp/logger";
import { ingestDocument } from "./pipeline";
import type { Embedder } from "./retrieve";

const STALE_PROCESSING_MS = 10 * 60_000;
/** Naikkan angka ini bila cara memotong/menandai dokumen berubah: semua dokumen diproses ulang otomatis sekali. */
export const RAG_INDEX_VERSION = "2";

export const PUBLIC_FAILURE_MESSAGE = "Dokumen belum dapat diproses. Pastikan file (PDF/Markdown) berisi teks yang valid, lalu proses ulang.";

/** Job 'processing' yang macet (bot mati saat memproses) dikembalikan ke antrean. */
export function recoverStaleJobs(db: Db, now = Date.now()): number {
  const cutoff = new Date(now - STALE_PROCESSING_MS).toISOString();
  const result = db.prepare("UPDATE rag_jobs SET status = 'pending', processing_by = NULL, updated_at = ? WHERE status = 'processing' AND updated_at < ?").run(nowIso(), cutoff);
  return Number(result.changes);
}

/** Dokumen yang diindeks dengan versi lama dimasukkan lagi ke antrean; potongan lama tetap melayani sampai diganti. */
export function reindexIfNeeded(db: Db): number {
  const current = db.prepare("SELECT data FROM content WHERE key = 'rag_index_version'").get();
  if (current?.data === JSON.stringify(RAG_INDEX_VERSION)) return 0;
  const now = nowIso();
  const result = db.prepare("UPDATE rag_jobs SET status = 'pending', error = NULL, note = NULL, processing_by = NULL, updated_at = ? WHERE status = 'done'").run(now);
  db.prepare("INSERT INTO content (key, data) VALUES ('rag_index_version', ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data").run(JSON.stringify(RAG_INDEX_VERSION));
  return Number(result.changes);
}

/** Proses satu job pending (klaim atomik). Return true bila ada job yang diproses. */
export async function processNextJob(db: Db, embedder: Embedder | null, worker: string): Promise<boolean> {
  const claimed = db
    .prepare(
      `UPDATE rag_jobs SET status = 'processing', processing_by = ?, updated_at = ?
       WHERE id = (SELECT id FROM rag_jobs WHERE status = 'pending' ORDER BY created_at LIMIT 1)
       RETURNING id, source, content`,
    )
    .get(worker, nowIso());
  if (!claimed) return false;

  const id = String(claimed.id);
  const source = String(claimed.source);
  try {
    const result = await ingestDocument(db, embedder, claimed.content as Uint8Array, source, { id, worker });
    logger.info(result.saved ? "Job RAG selesai." : "Job RAG sudah dihapus; hasil diabaikan.", { id, chunks: result.chunks, embedded: result.embedded });
  } catch (cause: unknown) {
    logger.error("Job RAG gagal.", { id, error: describeError(cause) });
    // Detail teknis hanya di log; dashboard menampilkan pesan umum.
    db.prepare("UPDATE rag_jobs SET status = 'failed', error = ?, processing_by = NULL, updated_at = ? WHERE id = ? AND status = 'processing' AND processing_by = ?")
      .run(cause instanceof Error && /tidak valid|kosong|tidak didukung|tidak memiliki teks/.test(cause.message) ? cause.message : PUBLIC_FAILURE_MESSAGE, nowIso(), id, worker);
  }
  return true;
}

/** Loop polling di proses bot. Panggil stop() saat shutdown. */
export function startRagWorker(db: Db, embedder: Embedder | null, pollMs: number): { stop(): void } {
  const worker = randomUUID();
  let stopped = false;
  let running = false;
  const reindexed = reindexIfNeeded(db);
  if (reindexed > 0) logger.info("Dokumen lama diindeks ulang dengan pemotongan baru.", { reindexed });
  const recovered = recoverStaleJobs(db);
  if (recovered > 0) logger.warn("Job RAG macet dikembalikan ke antrean.", { recovered });

  const tick = async (): Promise<void> => {
    if (running || stopped) return;
    running = true;
    try {
      for (let count = 0; count < 5 && !stopped; count += 1) if (!(await processNextJob(db, embedder, worker))) break;
    } catch (cause: unknown) {
      logger.error("Polling RAG gagal; akan dicoba kembali.", { error: describeError(cause) });
    } finally { running = false; }
  };
  const timer = setInterval(() => void tick(), pollMs);
  timer.unref();
  void tick();
  logger.info("Worker RAG aktif.", { worker, pollMs, embedding: embedder ? "aktif" : "kata kunci saja" });
  return { stop: () => { stopped = true; clearInterval(timer); } };
}
