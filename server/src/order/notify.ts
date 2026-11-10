import { nowIso, type Db } from "../db/database";
import { logger, describeError } from "../whatsapp/logger";
import { normalizePhone } from "./orderFlow";
import { formatRupiah } from "./menuText";

/** Pesanan yang sudah "siap" lebih lama dari ini (mis. setelah bot lama mati) tidak diberi tahu lagi. */
const MAX_AGE_MS = 6 * 60 * 60_000;
const MAX_ATTEMPTS = 5;

export interface ReadyOrder { id: string; queue: number; name: string; phone: string; fulfillment: string; tableLabel: string | null; total: number; paid: boolean }

export function readyMessage(order: ReadyOrder): string {
  const where = order.fulfillment === "dine_in"
    ? (order.tableLabel ? `Pesananmu segera diantar ke *${order.tableLabel}*.` : "Silakan ambil di kasir ya, sebutkan nomor antrian.")
    : "Silakan diambil di kasir ya, sebutkan nomor antrian.";
  const pay = order.paid ? "" : `\nTotal ${formatRupiah(order.total)}, bayar di kasir ya.`;
  return `Halo kak ${order.name}! 🎉 Pesananmu nomor antrian *${order.queue}* sudah siap.\n${where}${pay}\nSelamat menikmati ☕`;
}

/** Pesanan berstatus "ready" yang belum diberi tahu, dengan nomor HP yang diisi pelanggan. */
export function pendingReadyOrders(db: Db, now = Date.now()): ReadyOrder[] {
  const since = new Date(now - MAX_AGE_MS).toISOString();
  const rows = db.prepare(
    `SELECT o.id, o.queue_number, o.customer_name, o.phone, o.fulfillment, o.total, o.payment_status, t.label AS table_label
     FROM orders o
     LEFT JOIN cafe_tables t ON t.id = o.table_id
     LEFT JOIN order_notifications n ON n.order_id = o.id AND n.status = 'ready'
     WHERE o.status = 'ready' AND o.updated_at >= ? AND (n.order_id IS NULL OR (n.sent_at IS NULL AND n.attempts < ?))
     ORDER BY o.updated_at`,
  ).all(since, MAX_ATTEMPTS);
  return rows.map((row) => ({
    id: String(row.id),
    queue: Number(row.queue_number),
    name: String(row.customer_name),
    phone: String(row.phone),
    fulfillment: String(row.fulfillment),
    tableLabel: row.table_label ? String(row.table_label) : null,
    total: Number(row.total),
    paid: String(row.payment_status) === "paid",
  }));
}

/**
 * Kirim "pesanan siap" ke nomor HP yang diisi pelanggan (default-nya nomor WhatsApp yang chat dengan bot).
 * Satu kali per pesanan; bila kirim gagal (mis. WhatsApp terputus) dicoba lagi sampai MAX_ATTEMPTS.
 * Mengembalikan jumlah pesan yang terkirim. Tidak pernah melempar error.
 */
export async function notifyReadyOrders(db: Db, send: (chatId: string, text: string) => Promise<void>, now = Date.now()): Promise<number> {
  let sent = 0;
  for (const order of pendingReadyOrders(db, now)) {
    const phone = normalizePhone(order.phone);
    const mark = (ok: boolean): void => {
      db.prepare(
        `INSERT INTO order_notifications (order_id, status, attempts, sent_at) VALUES (?, 'ready', 1, ?)
         ON CONFLICT(order_id, status) DO UPDATE SET attempts = attempts + 1, sent_at = excluded.sent_at`,
      ).run(order.id, ok ? nowIso() : null);
    };
    if (!phone) { db.prepare("INSERT OR REPLACE INTO order_notifications (order_id, status, attempts, sent_at) VALUES (?, 'ready', ?, NULL)").run(order.id, MAX_ATTEMPTS); continue; }
    try {
      await send(`${phone}@c.us`, readyMessage(order));
      mark(true);
      sent += 1;
      logger.info("Pemberitahuan pesanan siap terkirim.", { queue: order.queue });
    } catch (error: unknown) {
      mark(false);
      logger.warn("Pemberitahuan pesanan siap gagal, akan dicoba lagi.", { queue: order.queue, error: describeError(error) });
    }
  }
  return sent;
}
