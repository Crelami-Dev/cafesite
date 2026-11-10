import type { AiConfig, BotEnv } from "./config/env";
import type { Db } from "./db/database";
import { handleChat } from "./ai/chatHandler";
import type { ChatMessage } from "./ai/types";
import { isOrderIntent } from "./order/intent";
import { cartTotal, renderCart } from "./order/cart";
import { fetchMenu } from "./order/menu";
import { formatRupiah } from "./order/menuText";
import { handleOrderMessage, startsOrderByItems } from "./order/orderFlow";
import { askCancelSaved, cancelSavedOrder, clearPendingCancel, describeLastOrder, editSavedMessage, hasPendingCancel, parseStatusRequest, recentOrder, renderStatus } from "./order/status";
import { clearSession, getSession, hasActiveSession } from "./order/session";
import { checkRateLimit, pruneRateLimitState } from "./queue/rateLimit";
import type { Embedder } from "./rag/retrieve";
import { ChatMemory } from "./ai/memory";
import { BotAccess } from "./whatsapp/botAccess";
import type { IncomingWaMessage } from "./whatsapp/client";
import { logger, describeError } from "./whatsapp/logger";

export const INTRO = "Halo! Saya asisten WhatsApp resmi CafeSite. Saya bisa bantu menu, harga, jam buka, lokasi, ketersediaan meja, dan membuat pesanan. Ada yang bisa dibantu atau mau pesan? (Ketik \"tutup bot\" untuk mengakhiri.)";
export const REMINDER = "Masih ada yang bisa saya bantu? Sesi bot akan berakhir dalam dua menit jika tidak ada pesan baru.";
export const DISABLED = "Bot dinonaktifkan untuk chat ini. Kirim “halo bot” jika ingin mengaktifkan lagi.";

export interface BotDeps {
  db: Db;
  env: Pick<BotEnv, "botIdleMs" | "botReminderMs" | "rateLimitMaxPerMinute" | "rateLimitWindowMs">;
  ai: AiConfig | null;
  embedder: Embedder | null;
  send(chatId: string, text: string): Promise<void>;
  /** Hanya untuk test: ganti pemanggil AI. */
  ask?: (config: AiConfig, messages: ChatMessage[]) => Promise<string>;
}

export interface Bot {
  handle(message: IncomingWaMessage): Promise<void>;
  /** Dipanggil berkala: bersihkan state kedaluwarsa dan kirim pengingat. */
  tick(): void;
  stats: { messagesHandled: number };
}

/**
 * Otak bot, terpisah dari transport WhatsApp: hanya "halo bot" yang mengaktifkan chat pribadi, sesi
 * 10 menit dengan pengingat, rate limit per nomor, lalu alur pesan (order flow) atau tanya jawab (chat).
 */
export function createBot(deps: BotDeps): Bot {
  const { db, env, send } = deps;
  const memory = new ChatMemory();
  const access = new BotAccess(env.botIdleMs, env.botReminderMs, (chatId) => { clearSession(chatId); memory.clear(chatId); });
  const stats = { messagesHandled: 0 };
  const limit = { maxPerMinute: env.rateLimitMaxPerMinute, windowMs: env.rateLimitWindowMs };

  async function handle(message: IncomingWaMessage): Promise<void> {
    if (message.fromMe || message.isGroupMsg || !message.body || message.from === "status@broadcast") return;
    const decision = access.accept(message.from, message.id, message.body);
    if (decision.kind === "enabled") return send(message.from, INTRO);
    if (decision.kind === "disabled") return send(message.from, DISABLED);
    if (decision.kind !== "message") return;
    if (!checkRateLimit(message.from, limit).allowed) return;
    if (!access.canReply(message.from, decision.token)) return;
    stats.messagesHandled += 1;
    try {
      const text = decision.text;
      const hasSession = hasActiveSession(message.from);
      const lowerText = text.toLowerCase().replace(/[.!?s]+$/g, "").trim();

      // Setelah pesanan tersimpan: status, batal (dengan konfirmasi), ubah, dan konfirmasi ganda.
      let reply: string | null = null;
      if (hasPendingCancel(message.from)) {
        if (/^(?:ya|iya|y|yes|ya batalkan|iya batalkan|batalkan|oke batalkan)$/.test(lowerText)) reply = cancelSavedOrder(db, message.from);
        else clearPendingCancel(message.from);
      }
      if (reply === null) {
        const request = parseStatusRequest(text);
        const cart = getSession(message.from)?.cart ?? [];
        if ((request === "status" || request === "recall") && cart.length > 0) {
          reply = [`Pesananmu sejauh ini (belum dikonfirmasi):`, renderCart(cart), `Total sementara: ${formatRupiah(cartTotal(cart))}`, `Mau tambah, ubah, atau lanjut? Ketik *konfirmasi* kalau sudah ☕`].join("\n");
        } else if (request === "status" || request === "recall") reply = renderStatus(db, message.from);
        else if (!hasSession && request === "cancel_saved") reply = askCancelSaved(db, message.from);
        else if (!hasSession && request === "edit_saved" && recentOrder(message.from, 24 * 60 * 60_000)) reply = editSavedMessage(message.from);
        else if (!hasSession && /^(?:konfirmasi|ya|iya|oke|ok)$/.test(lowerText) && recentOrder(message.from, 3 * 60_000)) {
          reply = `Pesananmu nomor antrian *${recentOrder(message.from)?.queue}* sudah tersimpan ✅ Ketik *status* untuk cek, atau *pesan* kalau mau pesan lagi ☕`;
        }
      }
      if (reply !== null) {
        if (access.canReply(message.from, decision.token)) await send(message.from, reply);
        return;
      }

      const menu = fetchMenu(db);
      const cartNow = getSession(message.from)?.cart ?? [];
      const customerContext = [
        cartNow.length ? ["Keranjang sekarang (belum dikonfirmasi):", renderCart(cartNow), `Total sementara ${formatRupiah(cartTotal(cartNow))}`].join("\n") : null,
        describeLastOrder(db, message.from),
      ].filter(Boolean).join("\n") || null;
      const ordering = hasSession || isOrderIntent(text, menu.map((item) => item.name)) || startsOrderByItems(text, menu);
      reply = ordering
        ? await handleOrderMessage({ db, ai: deps.ai, ...(deps.ask ? { ask: deps.ask } : {}) }, message.from, decision.text)
        : await handleChat({ db, ai: deps.ai, embedder: deps.embedder, history: memory.recent(message.from), recentOrderQueue: recentOrder(message.from)?.queue, customerContext, ...(deps.ask ? { ask: deps.ask } : {}) }, "Pelanggan", decision.text);
      // Percakapan pesanan juga diingat, jadi pertanyaan setelahnya ("tadi aku pesan apa?") nyambung.
      memory.add(message.from, "user", decision.text);
      memory.add(message.from, "assistant", reply);
      // Sesi bisa saja ditutup/kedaluwarsa selagi AI berpikir; jangan kirim jawaban basi.
      if (access.canReply(message.from, decision.token)) await send(message.from, reply);
    } catch (cause: unknown) {
      logger.error("Pesan bot gagal diproses.", { error: describeError(cause) });
    }
  }

  function tick(): void {
    access.prune();
    memory.prune();
    pruneRateLimitState(limit);
    for (const chatId of access.dueReminders()) void send(chatId, REMINDER).catch(() => undefined);
  }

  return { handle, tick, stats };
}
