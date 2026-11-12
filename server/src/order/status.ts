import { nowIso, transaction, type Db } from "../db/database";
import { formatRupiah } from "./menuText";

/**
 * Langkah setelah pesanan tersimpan: cek status, batalkan (selagi belum diproses), dan pesan lagi.
 * Pesanan terakhir tiap chat diingat di memori; bila bot restart, pencarian jatuh ke nomor HP di chat id.
 */
interface Remembered { id: string; queue: number; at: number }

const lastByChat = new Map<string, Remembered>();
const pendingCancel = new Map<string, number>();
const RECENT_MS = 30 * 60_000;
const CANCEL_CONFIRM_MS = 2 * 60_000;

export function rememberOrder(chatId: string, order: { id: string; queue_number: number }, now = Date.now()): void {
  lastByChat.set(chatId, { id: order.id, queue: order.queue_number, at: now });
}

/** Pesanan terakhir chat ini bila masih "baru" (default 30 menit), selain itu null. */
export function recentOrder(chatId: string, maxAgeMs = RECENT_MS, now = Date.now()): Remembered | null {
  const found = lastByChat.get(chatId);
  return found && now - found.at <= maxAgeMs ? found : null;
}

export function resetStatusState(): void { lastByChat.clear(); pendingCancel.clear(); }

export type StatusRequest = "status" | "cancel_saved" | "edit_saved" | "recall" | null;

const STATUS = /^(?:status|cek status|status pesanan|status order|cek pesanan|pesanan(?:ku| saya| aku)?(?: gimana| bagaimana| udah jadi| sudah jadi| sampai mana| sampe mana)?|udah jadi belum|sudah jadi belum|udah siap belum|sudah siap belum|antrian(?:ku| saya)?|nomor antrian(?:ku| saya)?|pesananku|pesanan tadi)$/;
/** "tadi saya pesan apa?", "pesanan saya apa aja", "yang sudah saya pesan apa", "isi keranjang": pelanggan menanyakan isi pesanannya. */
const RECALL = /^(?:tadi|barusan|td)\s+(?:(?:saya|aku|gue|gw)\s+)?(?:pesan|pesen|order|beli)\s+apa(?:\s+(?:aja|saja|ya|tadi|sih))*$|^(?:saya|aku|gue|gw)\s+(?:pesan|pesen|order)\s+apa(?:\s+(?:aja|saja))?\s+(?:tadi|barusan)$|^(?:apa\s+(?:aja|saja)\s+)?(?:yang\s+)?(?:udah|sudah|tadi|barusan)\s+(?:saya\s+|aku\s+)?(?:pesan|pesen|order)(?:\s+(?:apa|apa aja|apa saja|aja|ya))*$|^(?:pesanan|order)\s+(?:saya|aku|ku)?\s*(?:apa|isinya apa|apa aja|apa saja)(?:\s+(?:aja|ya|tadi))*$|^(?:isi|lihat|liat|cek)\s+(?:keranjang|pesanan|pesananku)(?:\s+(?:saya|ku|dong|ya))*$|^keranjang(?:\s+(?:saya|ku|dong|ya))*$/;
const CANCEL_SAVED = /^(?:batalkan|batalin|cancel|batal)\s+(?:pesanan|order)(?:ku| saya| tadi| terakhir)?$/;
const EDIT_SAVED = /^(?:ubah|edit|ganti|revisi|ralat|tambah(?:in|kan)?|nambah)\s*(?:pesanan|order)?(?:ku| saya| tadi)?$/;

export function parseStatusRequest(text: string): StatusRequest {
  const lower = text.toLowerCase().replace(/\s+/g, " ").replace(/[?.!]+$/g, "").trim();
  if (CANCEL_SAVED.test(lower)) return "cancel_saved";
  if (RECALL.test(lower)) return "recall";
  if (STATUS.test(lower)) return "status";
  if (EDIT_SAVED.test(lower)) return "edit_saved";
  return null;
}

const STATUS_TEXT: Record<string, string> = {
  waiting: "menunggu diproses kasir",
  preparing: "sedang disiapkan ☕",
  ready: "sudah siap! Silakan diambil 🎉",
  completed: "sudah selesai",
  cancelled: "dibatalkan",
};

interface OrderRow { id: string; queue_number: number; status: string; payment_status: string; total: number; table_id: string | null; fulfillment: string }

/** Cari pesanan terakhir chat ini: yang diingat, atau (setelah restart) yang terbaru dengan nomor HP sama dengan chat id. */
export function findOrder(db: Db, chatId: string): OrderRow | null {
  const remembered = lastByChat.get(chatId);
  const byId = remembered ? db.prepare("SELECT * FROM orders WHERE id = ?").get(remembered.id) : undefined;
  const digits = /^([0-9]{8,15})@c\.us$/.exec(chatId)?.[1];
  const row = byId ?? (digits ? db.prepare("SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC LIMIT 1").get(digits) : undefined);
  return row ? ({ ...row } as unknown as OrderRow) : null;
}

export function renderStatus(db: Db, chatId: string): string {
  const order = findOrder(db, chatId);
  if (!order) return "Belum ada pesanan dari chat ini. Ketik *pesan* untuk mulai memesan ☕";
  const items = db.prepare("SELECT name, quantity FROM order_items WHERE order_id = ? ORDER BY rowid").all(order.id).map((row) => `• ${row.quantity}x ${row.name}`);
  const pay = order.payment_status === "paid" ? "sudah dibayar" : "bayar di kasir (COD)";
  return [
    `Pesanan nomor antrian *${order.queue_number}*: ${STATUS_TEXT[order.status] ?? order.status}`,
    ...items,
    `Total ${formatRupiah(order.total)} - ${pay}.`,
    order.status === "waiting" ? "Mau dibatalkan? Ketik *batalkan pesanan* (selagi belum disiapkan)." : "Mau pesan lagi? Ketik *pesan* ☕",
  ].join("\n");
}

/** Minta konfirmasi sebelum membatalkan pesanan tersimpan. */
export function askCancelSaved(db: Db, chatId: string, now = Date.now()): string {
  const order = findOrder(db, chatId);
  if (!order) return "Belum ada pesanan dari chat ini yang bisa dibatalkan.";
  if (order.status !== "waiting") return `Pesanan nomor ${order.queue_number} sudah ${order.status === "cancelled" ? "dibatalkan" : "diproses"}, jadi tidak bisa dibatalkan lewat chat. Silakan hubungi kasir ya.`;
  pendingCancel.set(chatId, now + CANCEL_CONFIRM_MS);
  return `Batalkan pesanan nomor antrian *${order.queue_number}* (${formatRupiah(order.total)})? Balas *ya* untuk membatalkan, atau abaikan kalau tidak jadi.`;
}

export function hasPendingCancel(chatId: string, now = Date.now()): boolean {
  const until = pendingCancel.get(chatId);
  if (until === undefined) return false;
  if (until < now) { pendingCancel.delete(chatId); return false; }
  return true;
}

export function clearPendingCancel(chatId: string): void { pendingCancel.delete(chatId); }

/** Batalkan pesanan terakhir bila masih 'waiting' dan belum dibayar; meja dilepas (kotor) bila dine-in. */
export function cancelSavedOrder(db: Db, chatId: string): string {
  pendingCancel.delete(chatId);
  const order = findOrder(db, chatId);
  if (!order) return "Pesanan tidak ditemukan.";
  const result = transaction(db, () => {
    const current = db.prepare("SELECT status, payment_status, table_id FROM orders WHERE id = ?").get(order.id);
    if (!current || current.status !== "waiting" || current.payment_status !== "unpaid") return false;
    db.prepare("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?").run(nowIso(), order.id);
    if (current.table_id) db.prepare("UPDATE cafe_tables SET status = 'dirty' WHERE id = ? AND NOT EXISTS(SELECT 1 FROM orders WHERE table_id=cafe_tables.id AND status IN ('waiting','preparing','ready'))").run(String(current.table_id));
    return true;
  });
  return result
    ? `Pesanan nomor antrian ${order.queue_number} sudah dibatalkan ✅ Kalau mau pesan lagi, ketik *pesan* kapan saja ☕`
    : `Maaf, pesanan nomor ${order.queue_number} baru saja diproses kasir sehingga tidak bisa dibatalkan lewat chat. Silakan hubungi kasir ya.`;
}

export function editSavedMessage(chatId: string): string {
  const recent = recentOrder(chatId, 24 * 60 * 60_000);
  const label = recent ? `nomor antrian *${recent.queue}*` : "kamu";
  return `Pesanan ${label} sudah masuk ke kasir, jadi tidak bisa diubah lewat chat. Pilihan:\n• Mau tambah? Ketik *pesan* untuk membuat pesanan tambahan baru.\n• Mau ganti? Ketik *batalkan pesanan* (selagi belum disiapkan), lalu pesan ulang.\n• Atau sampaikan langsung ke kasir ☕`;
}

/** Ringkasan pesanan tersimpan terakhir chat ini (maks. 24 jam) untuk konteks AI; null bila tidak ada. */
export function describeLastOrder(db: Db, chatId: string, now = Date.now()): string | null {
  const order = findOrder(db, chatId) as (OrderRow & { created_at?: string }) | null;
  if (!order) return null;
  const created = Date.parse(String((order as { created_at?: string }).created_at ?? ""));
  if (Number.isFinite(created) && now - created > 24 * 60 * 60_000) return null;
  const items = db.prepare("SELECT name, quantity, notes FROM order_items WHERE order_id = ? ORDER BY rowid").all(order.id)
    .map((row) => `${row.quantity}x ${row.name}${row.notes ? ` (${row.notes})` : ""}`);
  return `Pesanan tersimpan nomor antrian ${order.queue_number} (${STATUS_TEXT[order.status] ?? order.status}): ${items.join(", ")}. Total ${formatRupiah(order.total)}.`;
}
