import { createHash } from "node:crypto";
import type { Db } from "../db/database";
import { fetchMenu, type MenuEntry } from "../order/menu";
import { formatRupiah } from "../order/orderFlow";
import type { RetrievedChunk } from "../rag/retrieve";

function readContent(db: Db, key: string): unknown {
  const row = db.prepare("SELECT data FROM content WHERE key = ?").get(key);
  if (!row) return null;
  try { return JSON.parse(String(row.data)); } catch { return null; }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function renderMenuForPrompt(menu: MenuEntry[]): string {
  const lines = menu.map((item) => `- ${item.name} | ${item.category || "lainnya"} | ${formatRupiah(item.price)} | ${item.isAvailable ? "tersedia" : "HABIS"}${item.description ? ` | ${item.description}` : ""}`);
  return lines.length ? lines.join("\n") : "(menu belum diisi)";
}

/**
 * Fakta yang boleh dijawab bot, dari baris `content` di SQLite: info kafe, FAQ, panduan lokasi.
 * Baris yang belum diisi dilewati - bot tidak boleh mengarang jam buka atau alamat.
 */
export function renderFacts(db: Db): string {
  const parts: string[] = [];
  const cafe = asRecord(readContent(db, "cafe"));
  if (cafe) {
    if (typeof cafe.name === "string") parts.push(`Nama: ${cafe.name}`);
    if (typeof cafe.address === "string") parts.push(`Alamat: ${cafe.address}${typeof cafe.city === "string" ? `, ${cafe.city}` : ""}`);
    if (typeof cafe.landmark === "string") parts.push(`Patokan: ${cafe.landmark}`);
    if (Array.isArray(cafe.openingHours)) {
      const hours = cafe.openingHours.map(asRecord).filter((entry): entry is Record<string, unknown> => entry !== null);
      parts.push(`Jam buka: ${hours.map((entry) => `${String(entry.day)} ${entry.isOpen === false ? "tutup" : String(entry.hours)}`).join("; ")}`);
    }
    if (typeof cafe.googleMapsUrl === "string") parts.push(`Peta: ${cafe.googleMapsUrl}`);
  }
  for (const key of ["faq", "location"] as const) {
    const items = readContent(db, key);
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const record = asRecord(item);
      if (!record) continue;
      const question = record.question ?? record.title;
      const answer = record.answer ?? record.description;
      if (typeof question === "string" && typeof answer === "string") parts.push(`${question}: ${answer}`);
    }
  }
  return parts.join("\n");
}

/** Sidik jari data yang memengaruhi jawaban; cache jawaban otomatis tidak berlaku saat data berubah. */
export function knowledgeFingerprint(db: Db): string {
  const hash = createHash("sha256");
  for (const row of db.prepare("SELECT id, data, is_available FROM menu_items ORDER BY id").all()) hash.update(`${row.id}|${row.data}|${row.is_available}\n`);
  for (const row of db.prepare("SELECT key, data FROM content ORDER BY key").all()) hash.update(`${row.key}|${row.data}\n`);
  const chunks = db.prepare("SELECT COUNT(*) AS n, COALESCE(MAX(id), 0) AS last FROM rag_chunks").get();
  hash.update(`chunks:${chunks?.n}:${chunks?.last}`);
  return hash.digest("hex").slice(0, 16);
}

function norm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Jawaban tanpa AI, murni dari data: dipakai saat NVIDIA_API_KEY belum diisi atau AI gagal.
 * Mengembalikan null bila data tidak cukup untuk menjawab (pemanggil memberi pesan "belum tersedia").
 */
export function localAnswer(db: Db, text: string, chunks: RetrievedChunk[]): string | null {
  const query = norm(text);
  const menu = fetchMenu(db);

  // Item disebut bila nama lengkapnya ada, atau kata bermakna dari namanya (>= 4 huruf); skor tertinggi menang.
  const queryWords = new Set(query.split(" "));
  const scored = menu
    .map((item) => {
      const name = norm(item.name);
      const hits = name.split(" ").filter((word) => word.length >= 4 && queryWords.has(word)).length;
      return { item, score: query.includes(name) ? 100 : hits };
    })
    .filter((entry) => entry.score > 0);
  const best = Math.max(0, ...scored.map((entry) => entry.score));
  const named = scored.filter((entry) => entry.score === best).map((entry) => entry.item);
  if (named.length > 0 && /harga|berapa|price|rp/.test(query)) {
    return named.map((item) => `${item.name}: ${formatRupiah(item.price)}${item.isAvailable ? "" : " (sedang habis)"}`).join("\n");
  }
  if (named.length > 0) {
    return named.map((item) => `${item.name} - ${formatRupiah(item.price)}${item.isAvailable ? "" : " (sedang habis)"}${item.description ? `\n${item.description}` : ""}`).join("\n\n");
  }
  if (/\b(menu|daftar|ada apa|rekomendasi|minuman|makanan|kopi|snack|dessert)\b/.test(query) && menu.length > 0) {
    const available = menu.filter((item) => item.isAvailable);
    return `Menu yang tersedia:\n${available.map((item) => `- ${item.name} (${formatRupiah(item.price)})`).join("\n")}\n\nKetik "pesan" untuk mulai memesan.`;
  }
  if (chunks.length > 0) {
    return chunks.slice(0, 2).map((chunk) => chunk.content).join("\n\n").slice(0, 700);
  }
  return null;
}
