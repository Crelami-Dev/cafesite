import type { ChatMessage } from "./types";

interface Turn { role: "user" | "assistant"; content: string; at: number }

const TTL_MS = 10 * 60_000;
const MAX_TURNS = 14;
const MAX_CHARS = 700;

/**
 * Ingatan percakapan singkat per chat (hanya di memori, tidak disimpan ke disk): cukup agar pertanyaan lanjutan
 * seperti "kalau hari minggu?" atau "harganya?" dipahami. Menyimpan 14 pesan terakhir, kedaluwarsa 10 menit dan dihapus saat sesi bot ditutup.
 */
export class ChatMemory {
  private readonly chats = new Map<string, Turn[]>();

  add(chatId: string, role: Turn["role"], content: string, now = Date.now()): void {
    const turns = (this.chats.get(chatId) ?? []).filter((turn) => now - turn.at < TTL_MS);
    turns.push({ role, content: content.slice(0, MAX_CHARS), at: now });
    this.chats.set(chatId, turns.slice(-MAX_TURNS));
  }

  recent(chatId: string, now = Date.now()): ChatMessage[] {
    return (this.chats.get(chatId) ?? []).filter((turn) => now - turn.at < TTL_MS).map(({ role, content }) => ({ role, content }));
  }

  clear(chatId: string): void { this.chats.delete(chatId); }

  prune(now = Date.now()): void {
    for (const [chatId, turns] of this.chats) if (!turns.some((turn) => now - turn.at < TTL_MS)) this.chats.delete(chatId);
  }
}
