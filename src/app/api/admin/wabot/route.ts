import { randomUUID } from "node:crypto";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { localError, localJson } from "@/lib/server/local-api";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { sourceFromFilename } from "@/lib/server/rag-source";
import { HttpError, objectValue, textValue, uuidValue } from "@/lib/server/validation";

const MAX_BYTES = 10 * 1024 * 1024;

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return objectValue(await request.json().catch(() => null));
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireLocalAdmin(request);
    const rows = getLocalDb()
      .prepare(
        `SELECT j.id, j.source, j.status, j.error, j.note, j.size, j.created_at, j.updated_at,
                (SELECT COUNT(*) FROM rag_chunks c WHERE c.source = j.source) AS chunks
         FROM rag_jobs j ORDER BY j.created_at DESC, j.id`,
      )
      .all();
    return localJson({ data: rows });
  } catch (error) { return localError(error); }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireLocalAdmin(request);
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Pilih file PDF (.pdf) atau Markdown (.md).");
    if (file.size === 0) throw new HttpError(400, "File kosong.");
    if (file.size > MAX_BYTES) throw new HttpError(413, "Ukuran file maksimal 10 MB.");
    const source = sourceFromFilename(file.name);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (source.endsWith(".pdf") && new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") throw new HttpError(400, "File harus berupa PDF yang valid.");
    if (source.endsWith(".md") && !new TextDecoder().decode(bytes).trim()) throw new HttpError(400, "File Markdown tidak boleh kosong.");

    const db = getLocalDb();
    const now = new Date().toISOString();
    const id = randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      // Unggah ulang nama yang sama = menggantikan: riwayat lama dibuang, pengetahuan lama diganti saat job selesai.
      db.prepare("DELETE FROM rag_jobs WHERE source = ? AND status IN ('done','failed')").run(source);
      db.prepare("DELETE FROM answer_cache").run(); // dokumen berubah: jawaban AI tersimpan dibuat ulang
      db.prepare("INSERT INTO rag_jobs (id, source, status, content, size, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?, ?, ?)").run(id, source, bytes, bytes.length, now, now);
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    return localJson({ ok: true, id, source }, 201);
  } catch (error) { return localError(error); }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    await requireLocalAdmin(request);
    const body = await readBody(request);
    const now = new Date().toISOString();
    const result = getLocalDb()
      .prepare("UPDATE rag_jobs SET status = 'pending', error = NULL, note = NULL, processing_by = NULL, created_at = ?, updated_at = ? WHERE id = ? AND status IN ('done','failed')")
      .run(now, now, uuidValue(body.id));
    if (Number(result.changes) === 0) throw new HttpError(409, "Dokumen sudah dihapus atau masih diproses.");
    return localJson({ ok: true });
  } catch (error) { return localError(error); }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    await requireLocalAdmin(request);
    const body = await readBody(request);
    const source = sourceFromFilename(textValue(body.source, "Nama Dokumen", 80));
    const db = getLocalDb();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("DELETE FROM rag_chunks WHERE source = ?").run(source);
      db.prepare("DELETE FROM rag_jobs WHERE source = ?").run(source);
      db.prepare("DELETE FROM answer_cache").run();
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    return localJson({ ok: true });
  } catch (error) { return localError(error); }
}
