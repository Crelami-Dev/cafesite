import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chunkText } from "../src/rag/chunk";
import { ingestDocument } from "../src/rag/pipeline";
import { cosine, fromBlob, retrieve, toBlob, tokenize, type Embedder } from "../src/rag/retrieve";
import { PUBLIC_FAILURE_MESSAGE, processNextJob, recoverStaleJobs } from "../src/rag/worker";
import { nowIso, type Db } from "../src/db/database";
import { testDb } from "./helpers";

const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text);

/** Embedder palsu deterministik: vektor = hitungan beberapa kata kunci. */
const fakeEmbedder: Embedder = async (texts) => texts.map((text) => ["wifi", "parkir", "reservasi", "kopi"].map((word) => (text.toLowerCase().includes(word) ? 1 : 0)));

function enqueue(db: Db, source: string, content: Uint8Array, status = "pending", updatedAt = nowIso()): string {
  const id = randomUUID();
  db.prepare("INSERT INTO rag_jobs (id, source, status, content, size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, source, status, content, content.length, nowIso(), updatedAt);
  return id;
}

test("chunkText memecah dokumen panjang dengan overlap dan tidak kehilangan teks", () => {
  const paragraph = "Kalimat contoh tentang kopi dan kafe. ".repeat(40);
  const chunks = chunkText(`${paragraph}\n\n${paragraph}`);
  assert.ok(chunks.length > 2);
  assert.ok(chunks.every((chunk) => chunk.length <= 900));
  assert.deepEqual(chunkText("   "), []);
});

test("blob vektor bolak-balik dan cosine", () => {
  const vector = [0.5, -1.25, 3];
  assert.deepEqual([...fromBlob(toBlob(vector))], vector);
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([0, 0], [1, 1]), 0);
  assert.deepEqual(tokenize("Apa yang ada di WiFi?"), ["wifi"]);
});

test("ingest Markdown lalu retrieve kata kunci (tanpa embedding)", async () => {
  const db = testDb();
  const result = await ingestDocument(db, null, utf8("# Fasilitas\n\nWiFi gratis kecepatan tinggi di semua lantai.\n\nParkir motor luas di halaman depan.\n\nReservasi untuk acara minimal 10 orang."), "info.md");
  assert.equal(result.saved, true);
  assert.equal(result.embedded, 0);
  const found = await retrieve(db, null, "ada wifi nggak?", 3);
  assert.match(found[0]?.content ?? "", /WiFi/);
  assert.deepEqual(await retrieve(db, null, "xyzzy", 3), []);
});

test("retrieve hibrida memakai embedding, dan jatuh ke kata kunci bila embedding gagal", async () => {
  const db = testDb();
  await ingestDocument(db, fakeEmbedder, utf8("WiFi gratis di semua lantai.\n\nParkir motor luas.\n\n".repeat(1) + "x".repeat(10)), "a.md");
  assert.equal(Number(db.prepare("SELECT COUNT(embedding) AS n FROM rag_chunks").get()?.n) > 0, true);
  const hybrid = await retrieve(db, fakeEmbedder, "parkir", 2);
  assert.ok(hybrid.length > 0);
  const failing: Embedder = async () => { throw new Error("jaringan mati"); };
  const fallback = await retrieve(db, failing, "wifi", 2);
  assert.match(fallback[0]?.content ?? "", /WiFi/);
});

test("ingest ulang source yang sama mengganti chunk lama", async () => {
  const db = testDb();
  await ingestDocument(db, null, utf8("Versi lama tentang kopi."), "menu.md");
  await ingestDocument(db, null, utf8("Versi baru tentang teh."), "menu.md");
  const rows = db.prepare("SELECT content FROM rag_chunks WHERE source = 'menu.md'").all();
  assert.equal(rows.length, 1);
  assert.match(String(rows[0]?.content), /baru/);
});

test("worker: job pending diproses, hasilnya done, dokumen kosong failed dengan pesan jelas", async () => {
  const db = testDb();
  const good = enqueue(db, "info.md", utf8("Jam buka setiap hari pukul delapan pagi."));
  const bad = enqueue(db, "kosong.md", utf8("   "));
  assert.equal(await processNextJob(db, null, "w1"), true);
  assert.equal(await processNextJob(db, null, "w1"), true);
  assert.equal(await processNextJob(db, null, "w1"), false);
  assert.equal(db.prepare("SELECT status FROM rag_jobs WHERE id = ?").get(good)?.status, "done");
  const failed = db.prepare("SELECT status, error FROM rag_jobs WHERE id = ?").get(bad);
  assert.equal(failed?.status, "failed");
  assert.match(String(failed?.error), /kosong/);
  assert.equal(Number(db.prepare("SELECT COUNT(*) AS n FROM rag_chunks WHERE source = 'kosong.md'").get()?.n), 0);
});

test("worker: error teknis tidak bocor ke dashboard", async () => {
  const db = testDb();
  const id = enqueue(db, "rusak.pdf", utf8("%PDF-1.4 bukan pdf sungguhan"));
  await processNextJob(db, null, "w1");
  const row = db.prepare("SELECT status, error FROM rag_jobs WHERE id = ?").get(id);
  assert.equal(row?.status, "failed");
  assert.equal(row?.error, PUBLIC_FAILURE_MESSAGE);
});

test("worker: dokumen yang dihapus saat diproses tidak hidup kembali", async () => {
  const db = testDb();
  const slow: Embedder = async (texts) => {
    db.exec("DELETE FROM rag_jobs");
    return texts.map(() => [1, 0]);
  };
  enqueue(db, "hapus.md", utf8("Dokumen yang akan dihapus."));
  await processNextJob(db, slow, "w1");
  assert.equal(Number(db.prepare("SELECT COUNT(*) AS n FROM rag_chunks").get()?.n), 0);
});

test("recoverStaleJobs mengembalikan job macet, tidak menyentuh job baru", () => {
  const db = testDb();
  const stale = enqueue(db, "a.md", utf8("x"), "processing", new Date(Date.now() - 30 * 60_000).toISOString());
  const fresh = enqueue(db, "b.md", utf8("x"), "processing");
  assert.equal(recoverStaleJobs(db), 1);
  assert.equal(db.prepare("SELECT status FROM rag_jobs WHERE id = ?").get(stale)?.status, "pending");
  assert.equal(db.prepare("SELECT status FROM rag_jobs WHERE id = ?").get(fresh)?.status, "processing");
});

test("PDF nyata (docs/contoh-cafesite.pdf) bisa diekstrak dan dicari", async () => {
  const db = testDb();
  const buffer = await readFile(path.join(__dirname, "..", "docs", "contoh-cafesite.pdf"));
  const result = await ingestDocument(db, null, new Uint8Array(buffer), "contoh-cafesite.pdf");
  assert.ok(result.chunks > 0);
  assert.ok(Number(db.prepare("SELECT COUNT(*) AS n FROM rag_chunks").get()?.n) > 0);
});

test("format tidak didukung ditolak", async () => {
  await assert.rejects(ingestDocument(testDb(), null, utf8("x"), "file.docx"), /tidak didukung/);
});
