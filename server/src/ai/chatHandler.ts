import { createHash } from "node:crypto";
import { nowIso, type Db } from "../db/database";
import type { AiConfig } from "../config/env";
import { askAI } from "./nemotronClient";
import { checkMessage, OFF_TOPIC_REPLY } from "./guard";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { knowledgeFingerprint, localAnswer, renderFacts, renderMenuForPrompt } from "./knowledge";
import type { ChatMessage } from "./types";
import { fetchMenu, findCandidates, type MenuEntry } from "../order/menu";
import { parseAvailabilityQuestion, parseMenuRequest, renderMenu } from "../order/menuText";
import { retrieve, type Embedder, type RetrievedChunk } from "../rag/retrieve";
import { queryTerms } from "../rag/text";
import { logger, describeError } from "../whatsapp/logger";

export const UNKNOWN_REPLY = "Maaf, informasi itu belum tersedia di CafeSite. Saya bisa bantu menu, harga, jam buka, lokasi, meja, atau pemesanan ya.";
export const AI_ERROR_REPLY = "Sebentar ya, saya lagi gangguan koneksi. Coba lagi.";
const RAG_TOP_K = 4;
const MAX_CONTEXT_CHARS = 3500;
const CACHE_TTL_MS = 6 * 60 * 60_000;

export interface ChatDeps {
  db: Db;
  ai: AiConfig | null;
  embedder: Embedder | null;
  /** Nomor antrian pesanan yang baru saja tersimpan di chat ini (untuk menutup percakapan dengan hangat). */
  recentOrderQueue?: number | undefined;
  /** Keranjang berjalan dan/atau pesanan tersimpan milik pelanggan ini, agar AI tidak lupa apa yang ia pesan. */
  customerContext?: string | null;
  /** Percakapan sebelumnya di chat ini (ingatan singkat), terlama dulu. */
  history?: ChatMessage[];
  /** Dapat diganti di test. */
  ask?: (config: AiConfig, messages: ChatMessage[]) => Promise<string>;
}

function renderChunks(chunks: RetrievedChunk[]): string {
  let used = 0;
  const parts: string[] = [];
  for (const chunk of chunks) {
    const part = `(${parts.length + 1}) Dokumen ${chunk.source}:\n${chunk.content}`;
    if (used + part.length > MAX_CONTEXT_CHARS && parts.length > 0) break;
    parts.push(part);
    used += part.length;
  }
  return parts.join("\n\n");
}

function buildMessages(userName: string, text: string, menu: string, facts: string, chunks: RetrievedChunk[], history: ChatMessage[], customerContext: string | null): ChatMessage[] {
  const context = [
    `MENU (harga rupiah):\n${menu}`,
    facts ? `FAKTA KAFE:\n${facts}` : "",
    customerContext ? ["PESANAN PELANGGAN INI (pakai bila ia bertanya soal pesanannya; jangan menambah atau mengubah isinya):", customerContext].join("\n") : "",
    chunks.length ? `DOKUMEN (paling relevan dulu):\n${renderChunks(chunks)}` : "DOKUMEN: (tidak ada yang relevan dengan pertanyaan ini)",
  ].filter(Boolean).join("\n\n");
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `DATA CafeSite:\n${context}` },
    ...history,
    { role: "user", content: `Nama pelanggan: ${userName}\nPesan: ${text}` },
  ];
}

/**
 * Pertanyaan lanjutan ("kalau hari minggu?", "harganya?") terlalu pendek untuk dicari sendiri. Bila pesan hanya
 * memuat <= 2 kata bermakna, pencarian memakai pesan pelanggan sebelumnya ditambah pesan ini.
 */
export function retrievalQuery(text: string, history: ChatMessage[]): { query: string; usedHistory: boolean } {
  const previous = history.filter((message) => message.role === "user").slice(-2).map((message) => message.content.replace(/^Nama pelanggan:[^\n]*\nPesan:\s*/, ""));
  if (previous.length > 0 && queryTerms(text).filter((term) => term.weight === 1).length <= 2) return { query: `${previous.join(" ")} ${text}`, usedHistory: true };
  return { query: text, usedHistory: false };
}

function mentionsMenu(text: string, menu: { name: string }[]): boolean {
  const lower = text.toLowerCase();
  if (/\b(menu|harga|price|minum|minuman|makan|makanan|kopi|teh|snack|dessert|rekomendasi|enak|laris|termurah|termahal)\b/.test(lower)) return true;
  return menu.some((item) => item.name.toLowerCase().split(/\s+/).some((word) => word.length >= 4 && lower.includes(word)));
}

const CATEGORY_WORDS = new Set(["kopi", "coffee", "makanan", "makan", "minuman", "minum", "camilan", "cemilan", "snack", "dessert"]);

/**
 * Pelanggan menanyakan ketersediaan sesuatu ("ada pizza?"). Bila itu BUKAN menu kita (tidak ada nama atau deskripsi yang cocok,
 * tidak ada di dokumen), jawab maaf + daftar menu. Kata kategori ("ada kopi?") langsung menampilkan kategorinya.
 * null = serahkan ke alur biasa (menu memang ada, topik lain, atau dokumen membahasnya).
 */
async function missingItemReply(deps: ChatDeps, menu: MenuEntry[], asked: string): Promise<string | null> {
  if (menu.length === 0) return null;
  if (CATEGORY_WORDS.has(asked)) return `Ada kak! Ini daftarnya:\n\n${renderMenu(deps.db, { filter: /^(?:minuman|minum)$/.test(asked) ? null : asked })}`;
  if (findCandidates(asked, menu).length > 0) return null;
  const haystack = menu.map((entry) => `${entry.name} ${entry.description}`.toLowerCase()).join(" | ");
  if (asked.split(" ").some((word) => word.length >= 3 && haystack.includes(word))) return null;
  try { if ((await retrieve(deps.db, deps.embedder, asked, RAG_TOP_K)).length > 0) return null; }
  catch (error: unknown) { logger.warn("Retrieve RAG gagal saat cek menu.", { error: describeError(error) }); }
  return `Maaf kak, *${asked}* belum ada di menu kami 🙏 Ini menu yang tersedia:\n\n${renderMenu(deps.db)}`;
}

function cacheKey(db: Db, text: string): string {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  return createHash("sha256").update(`${knowledgeFingerprint(db)}|${normalized}`).digest("hex");
}

/**
 * Alur chat: guard (tanpa AI untuk sapaan/di luar topik/permintaan terlarang) -> cache jawaban ->
 * pencarian dokumen (dengan konteks percakapan) -> konteks (menu + fakta + dokumen) -> AI.
 * Tanpa dasar data sama sekali bot menjawab "belum tersedia" tanpa memanggil AI. Tanpa AI atau saat AI
 * gagal, jawaban lokal dari data. Tidak pernah melempar error ke pemanggil.
 */
export async function handleChat(deps: ChatDeps, userName: string, text: string): Promise<string> {
  const { db } = deps;
  const menu = fetchMenu(db);
  // Daftar menu selalu langsung dari database (tanpa AI) agar nama dan harga pasti sama dengan dashboard.
  const menuRequest = parseMenuRequest(text);
  if (menuRequest) return renderMenu(db, { filter: menuRequest.filter, detail: /detail|lengkap|deskripsi|penjelasan/i.test(text) });
  const verdict = checkMessage(text, menu.map((item) => item.name), (deps.history?.length ?? 0) > 0);
  // Menu yang ditanyakan tidak ada: minta maaf dan langsung tampilkan menu (tanpa AI, tanpa pelanggan perlu mengetik "menu").
  if (verdict.kind === "allow" || verdict.text === OFF_TOPIC_REPLY) {
    const asked = parseAvailabilityQuestion(text);
    const reply = asked ? await missingItemReply(deps, menu, asked) : null;
    if (reply) return reply;
  }
  if (verdict.kind === "reply") {
    logger.info("Guard menjawab tanpa AI.", { textLength: text.length });
    if (verdict.smalltalk === "thanks" && deps.recentOrderQueue) {
      return `Sama-sama kak! 😊 Pesananmu nomor antrian ${deps.recentOrderQueue} lagi diproses. Ketik *status* untuk cek kapan siap, atau *pesan* kalau mau pesan lagi ☕`;
    }
    return verdict.text;
  }

  const history = deps.history ?? [];
  const { query, usedHistory } = retrievalQuery(text, history);
  // Jawaban yang bergantung pada percakapan sebelumnya tidak boleh dipakai ulang untuk orang lain.
  const key = usedHistory || deps.customerContext ? null : cacheKey(db, text);
  if (key) {
    const cached = db.prepare("SELECT answer FROM answer_cache WHERE cache_key = ? AND expires_at > ?").get(key, Date.now());
    if (cached) return String(cached.answer);
  }

  let chunks: RetrievedChunk[] = [];
  try { chunks = await retrieve(db, deps.embedder, query, RAG_TOP_K); }
  catch (error: unknown) { logger.warn("Retrieve RAG gagal, lanjut tanpa dokumen.", { error: describeError(error) }); }

  const facts = renderFacts(db);
  if (chunks.length === 0 && !facts && !deps.customerContext && !mentionsMenu(query, menu)) return UNKNOWN_REPLY;

  if (deps.ai) {
    try {
      const answer = await (deps.ask ?? askAI)(deps.ai, buildMessages(userName, text, renderMenuForPrompt(menu), facts, chunks, history, deps.customerContext ?? null));
      if (key) {
        db.prepare("INSERT OR REPLACE INTO answer_cache (cache_key, answer, expires_at) VALUES (?, ?, ?)").run(key, answer, Date.now() + CACHE_TTL_MS);
        db.prepare("DELETE FROM answer_cache WHERE expires_at <= ?").run(Date.now());
      }
      return answer;
    } catch (error: unknown) {
      logger.error("Gagal mendapatkan jawaban dari AI, memakai jawaban lokal.", { error: describeError(error), at: nowIso() });
    }
  }
  return localAnswer(db, query, chunks) ?? (deps.ai ? AI_ERROR_REPLY : UNKNOWN_REPLY);
}
