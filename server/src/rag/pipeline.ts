import { PDFParse } from "pdf-parse";
import { nowIso, transaction, type Db } from "../db/database";
import { chunkText } from "./chunk";
import { toBlob, type Embedder } from "./retrieve";
import { logger, describeError } from "../whatsapp/logger";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export async function extractPdfText(buffer: Uint8Array): Promise<string> {
  if (buffer.length > MAX_DOCUMENT_BYTES || Buffer.from(buffer.subarray(0, 5)).toString() !== "%PDF-") throw new Error("PDF tidak valid atau melebihi 10 MB.");
  const parser = new PDFParse({ data: buffer });
  try { return (await parser.getText()).text; }
  finally { await parser.destroy(); }
}

export async function extractDocumentText(buffer: Uint8Array, source: string): Promise<string> {
  const ext = source.toLowerCase().slice(source.lastIndexOf("."));
  if (ext === ".md") {
    if (buffer.length > MAX_DOCUMENT_BYTES) throw new Error("Ukuran Markdown melebihi 10 MB.");
    const text = Buffer.from(buffer).toString("utf-8").trim();
    if (!text) throw new Error("File Markdown kosong.");
    return text;
  }
  if (ext === ".pdf") return extractPdfText(buffer);
  throw new Error(`Format file "${ext}" tidak didukung. Gunakan PDF (.pdf) atau Markdown (.md).`);
}

export interface IngestResult {
  chunks: number;
  /** Jumlah chunk yang punya vektor; 0 berarti pencarian memakai kata kunci saja. */
  embedded: number;
  saved: boolean;
}

/**
 * Ekstrak -> pecah -> (opsional) embed -> simpan. Chunk lama dari `source` yang sama diganti
 * secara atomik. Bila `job` diberikan, penyimpanan hanya terjadi kalau job masih berstatus
 * 'processing' milik worker ini (dokumen yang dihapus saat diproses tidak "hidup kembali").
 * Embedding bersifat best-effort: kalau gagal/tidak dikonfigurasi, dokumen tetap tersimpan.
 */
export async function ingestDocument(
  db: Db,
  embedder: Embedder | null,
  buffer: Uint8Array,
  source: string,
  job?: { id: string; worker: string },
): Promise<IngestResult> {
  const text = await extractDocumentText(buffer, source);
  const chunks = chunkText(text);
  if (!chunks.length) throw new Error("Dokumen tidak memiliki teks yang dapat dibaca. Pastikan dokumen berisi teks.");

  let embeddings: number[][] | null = null;
  if (embedder) {
    try {
      const all: number[][] = [];
      for (let start = 0; start < chunks.length; start += 20) all.push(...await embedder(chunks.slice(start, start + 20), "passage"));
      if (all.length === chunks.length) embeddings = all;
    } catch (error: unknown) {
      logger.warn("Embedding dokumen gagal; dokumen disimpan untuk pencarian kata kunci.", { source, error: describeError(error) });
    }
  }

  const saved = transaction(db, () => {
    if (job) {
      const current = db.prepare("SELECT status, processing_by FROM rag_jobs WHERE id = ?").get(job.id);
      if (!current || current.status !== "processing" || current.processing_by !== job.worker) return false;
    }
    db.prepare("DELETE FROM rag_chunks WHERE source = ?").run(source);
    // Pengetahuan berubah: semua jawaban AI yang tersimpan basi dan harus dibuat ulang dari data terbaru.
    db.prepare("DELETE FROM answer_cache").run();
    const insert = db.prepare("INSERT INTO rag_chunks (source, position, content, embedding) VALUES (?, ?, ?, ?)");
    chunks.forEach((content, index) => insert.run(source, index, content, embeddings?.[index] ? toBlob(embeddings[index]) : null));
    if (job) {
      const note = embeddings ? null : "Disimpan tanpa embedding; pencarian memakai kata kunci.";
      db.prepare("UPDATE rag_jobs SET status = 'done', error = NULL, note = ?, processing_by = NULL, updated_at = ? WHERE id = ?").run(note, nowIso(), job.id);
    }
    return true;
  });

  return { chunks: chunks.length, embedded: embeddings ? chunks.length : 0, saved };
}
