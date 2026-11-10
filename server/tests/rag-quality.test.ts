import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { chunkText } from "../src/rag/chunk";
import { ingestDocument } from "../src/rag/pipeline";
import { retrieve } from "../src/rag/retrieve";
import { queryTerms, stem, tokenize } from "../src/rag/text";
import { reindexIfNeeded, RAG_INDEX_VERSION } from "../src/rag/worker";
import { retrievalQuery, handleChat, type ChatDeps } from "../src/ai/chatHandler";
import { ChatMemory } from "../src/ai/memory";
import { HELD_OUT, QUESTIONS } from "./fixtures/questions";
import { testDb } from "./helpers";
import type { ChatMessage } from "../src/ai/types";

const kedai = readFileSync(path.join(__dirname, "fixtures", "kedai.md"), "utf8");
const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text);

async function recall(set: { q: string; expect: string }[]): Promise<{ top1: number; top3: number; misses: string[] }> {
  const db = testDb();
  await ingestDocument(db, null, utf8(kedai), "kedai.md");
  let top1 = 0, top3 = 0;
  const misses: string[] = [];
  for (const { q, expect } of set) {
    const index = (await retrieve(db, null, q, 3)).findIndex((chunk) => chunk.content.includes(expect));
    if (index === 0) top1 += 1;
    if (index >= 0) top3 += 1; else misses.push(q);
  }
  return { top1: top1 / set.length, top3: top3 / set.length, misses };
}

test("kualitas pencarian: 34 pertanyaan gaya pelanggan (parafrase, gaul, berimbuhan)", async () => {
  const result = await recall(QUESTIONS);
  assert.ok(result.top1 >= 0.95, `top1 ${result.top1.toFixed(2)}; miss: ${result.misses.join(" | ")}`);
  assert.ok(result.top3 >= 0.97, `top3 ${result.top3.toFixed(2)}`);
});

test("kualitas pencarian: set held-out (tidak dipakai menyetel) minimal 90% di posisi 1", async () => {
  const result = await recall(HELD_OUT);
  assert.ok(result.top1 >= 0.9, `top1 ${result.top1.toFixed(2)}; miss: ${result.misses.join(" | ")}`);
});

test("pertanyaan di luar dokumen tidak mengembalikan potongan (agar bot bisa bilang belum tahu)", async () => {
  const db = testDb();
  await ingestDocument(db, null, utf8(kedai), "kedai.md");
  for (const q of ["siapa presiden indonesia", "harga bitcoin hari ini"]) assert.deepEqual(await retrieve(db, null, q, 3), [], q);
});

test("chunk: judul bagian jadi label, footer halaman dibuang, bagian panjang dipecah", () => {
  const chunks = chunkText("# Panduan\n\n## Parkir\nMotor gratis.\n\n-- 1 of 2 --\n\n## WiFi\nGratis untuk pelanggan.");
  assert.deepEqual(chunks, ["[Panduan > Parkir]\nMotor gratis.", "[Panduan > WiFi]\nGratis untuk pelanggan."]);
  const long = chunkText(`## Panjang\n${"Kalimat contoh yang cukup panjang untuk uji. ".repeat(40)}`);
  assert.ok(long.length > 1);
  assert.ok(long.every((chunk) => chunk.startsWith("[Panjang]") && chunk.length < 900));
});

test("chunk: gaya PDF tanpa markdown ('Judul:' dan HURUF BESAR)", () => {
  const chunks = chunkText("CafeSite - Info\nPromo Bulanan:\nSelasa beli 2 gratis 1.\nATURAN KEDAI\nDilarang membawa makanan luar.");
  assert.ok(chunks.some((chunk) => chunk.startsWith("[Promo Bulanan]") && chunk.includes("Selasa")));
  assert.ok(chunks.some((chunk) => chunk.startsWith("[ATURAN KEDAI]") && chunk.includes("Dilarang")));
});

test("stemmer dan ekspansi sinonim", () => {
  assert.equal(stem("parkiran"), "parkir");
  assert.equal(stem("pembayarannya"), "bayar");
  assert.deepEqual(tokenize("Ada WiFi gratis?"), ["wifi", "gratis"]);
  assert.equal(tokenize("08.00-22.00").join(" "), "0800 2200");
  const terms = queryTerms("bisa ngajak anabul gak").map((entry) => entry.term);
  assert.ok(terms.includes(stem("hewan")) && terms.includes(stem("peliharaan")));
  assert.ok(queryTerms("gopay").some((entry) => entry.term === stem("qris")));
});

test("ingatan percakapan: pertanyaan lanjutan memakai pesan sebelumnya; kedaluwarsa dan dibersihkan", () => {
  const memory = new ChatMemory();
  memory.add("a", "user", "jam buka berapa?", 0);
  memory.add("a", "assistant", "Senin-Kamis 08.00-22.00", 1);
  assert.equal(memory.recent("a", 5).length, 2);
  assert.equal(memory.recent("a", 11 * 60_000).length, 0);
  memory.clear("a");
  assert.equal(memory.recent("a", 5).length, 0);

  const history: ChatMessage[] = [{ role: "user", content: "Nama pelanggan: Budi\nPesan: jam buka berapa?" }, { role: "assistant", content: "..." }];
  assert.deepEqual(retrievalQuery("kalau minggu?", history), { query: "jam buka berapa? kalau minggu?", usedHistory: true });
  assert.deepEqual(retrievalQuery("apakah ada parkir motor untuk pelanggan?", history), { query: "apakah ada parkir motor untuk pelanggan?", usedHistory: false });
  assert.equal(retrievalQuery("kalau minggu?", []).usedHistory, false);
});

test("pertanyaan lanjutan menemukan dokumen yang benar dan tidak masuk cache bersama", async () => {
  const db = testDb();
  await ingestDocument(db, null, utf8(kedai), "kedai.md");
  let prompt = "";
  const deps: ChatDeps = {
    db, ai: { apiKey: "k", model: "m" }, embedder: null,
    history: [{ role: "user", content: "Nama pelanggan: Budi\nPesan: jam buka berapa?" }, { role: "assistant", content: "Senin sampai Kamis 08.00-22.00" }],
    ask: async (_c, messages) => { prompt = messages.map((m) => m.content).join("\n"); return "ok"; },
  };
  await handleChat(deps, "Budi", "kalau hari minggu?");
  assert.match(prompt, /07\.00 sampai 22\.00/);
  assert.match(prompt, /\[CafeSite - Panduan Pelanggan > Jam Operasional\]/);
  assert.equal(Number(db.prepare("SELECT COUNT(*) AS n FROM answer_cache").get()?.n), 0);
});

test("reindexIfNeeded: dokumen lama masuk antrean sekali saja", () => {
  const db = testDb();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO rag_jobs (id, source, status, content, size, created_at, updated_at) VALUES ('j1', 'a.md', 'done', x'41', 1, ?, ?)").run(now, now);
  assert.equal(reindexIfNeeded(db), 1);
  assert.equal(db.prepare("SELECT status FROM rag_jobs WHERE id = 'j1'").get()?.status, "pending");
  assert.equal(db.prepare("SELECT data FROM content WHERE key = 'rag_index_version'").get()?.data, JSON.stringify(RAG_INDEX_VERSION));
  db.exec("UPDATE rag_jobs SET status = 'done'");
  assert.equal(reindexIfNeeded(db), 0);
});

test("cache jawaban AI dihapus setiap dokumen diunggah/diganti, lalu dibuat ulang dari data terbaru", async () => {
  const db = testDb();
  await ingestDocument(db, null, utf8("# Parkir\nMotor gratis, mobil 5 slot."), "info.md");
  let answers = 0;
  const deps: ChatDeps = { db, ai: { apiKey: "k", model: "m" }, embedder: null, ask: async (_c, messages) => { answers += 1; return `v${answers}: ${messages.map((m) => m.content).join(" ").includes("8 slot") ? "8 slot" : "5 slot"}`; } };
  assert.equal(await handleChat(deps, "Budi", "parkir mobil berapa slot?"), "v1: 5 slot");
  assert.equal(await handleChat(deps, "Budi", "parkir mobil berapa slot?"), "v1: 5 slot"); // dari cache
  await ingestDocument(db, null, utf8("# Parkir\nMotor gratis, mobil 8 slot."), "info.md");
  assert.equal(Number(db.prepare("SELECT COUNT(*) AS n FROM answer_cache").get()?.n), 0);
  assert.equal(await handleChat(deps, "Budi", "parkir mobil berapa slot?"), "v2: 8 slot");
});
