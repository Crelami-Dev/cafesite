import { randomUUID } from "node:crypto";
import { nowIso, transaction, type Db } from "../db/database";
import type { CartLine } from "./session";

export interface OrderDocument {
  id: string;
  queue_number: number;
  customer_name: string;
  phone: string;
  fulfillment: "dine_in" | "takeaway";
  table_id: string | null;
  status: string;
  payment_status: string;
  total: number;
  items: { name: string; unit_price: number; quantity: number }[];
}

export class OrderError extends Error {}

const RATE_LIMIT_ORDERS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const MAX_PORTIONS = 100;

function orderDocument(db: Db, id: string): OrderDocument {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!order) throw new OrderError("Pesanan tidak ditemukan.");
  const items = db
    .prepare("SELECT name, unit_price, quantity FROM order_items WHERE order_id = ? ORDER BY rowid")
    .all(id)
    .map((row) => ({ name: String(row.name), unit_price: Number(row.unit_price), quantity: Number(row.quantity) }));
  return {
    id: String(order.id),
    queue_number: Number(order.queue_number),
    customer_name: String(order.customer_name),
    phone: String(order.phone),
    fulfillment: order.fulfillment as OrderDocument["fulfillment"],
    table_id: order.table_id === null ? null : String(order.table_id),
    status: String(order.status),
    payment_status: String(order.payment_status),
    total: Number(order.total),
    items,
  };
}

export interface CreateOrderInput {
  idempotencyKey: string;
  customerName: string;
  phone: string;
  fulfillment: "dine_in" | "takeaway";
  tableCode: string | null;
  cart: CartLine[];
  source?: string;
}

/**
 * Buat pesanan COD secara atomik. Port dari RPC create_cafe_order: harga dan ketersediaan
 * SELALU dibaca ulang dari menu_items (bukan dari keranjang sesi), meja harus 'available',
 * idempotency key mencegah pesanan ganda, dan maksimal 5 pesanan per nomor per 10 menit.
 */
export function createCafeOrder(db: Db, input: CreateOrderInput): OrderDocument {
  return transaction(db, () => {
    const existing = db.prepare("SELECT id FROM orders WHERE idempotency_key = ?").get(input.idempotencyKey);
    if (existing) return orderDocument(db, String(existing.id));

    if (input.customerName.length < 2 || input.customerName.length > 80) throw new OrderError("Nama harus 2-80 karakter.");
    if (!/^[0-9]{8,15}$/.test(input.phone)) throw new OrderError("Nomor HP harus 8-15 digit.");
    if (input.cart.length < 1 || input.cart.length > 30) throw new OrderError("Pesanan harus berisi 1-30 item.");

    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const recent = Number(db.prepare("SELECT COUNT(*) AS n FROM orders WHERE phone = ? AND created_at > ?").get(input.phone, since)?.n ?? 0);
    if (recent >= RATE_LIMIT_ORDERS) throw new OrderError("Terlalu banyak pesanan. Tunggu beberapa menit atau hubungi kasir.");

    let tableId: string | null = null;
    if (input.fulfillment === "dine_in") {
      const configured = Number(db.prepare("SELECT COUNT(*) AS n FROM cafe_tables WHERE order_mode='dine_in'").get()?.n ?? 0);
      // Kafe yang belum mengatur meja di dashboard: makan di tempat tanpa nomor meja (kasir yang mengarahkan).
      if (configured > 0 || input.tableCode) {
        const table = db.prepare("SELECT id, status, order_mode FROM cafe_tables WHERE id = ?").get(input.tableCode ?? "");
        if (!table || table.status === "dirty" || table.order_mode === "takeaway") throw new OrderError("Meja tidak tersedia. Hubungi kasir atau pilih meja lain.");
        tableId = String(table.id);
      }
    }

    const lines: { id: string; name: string; price: number; quantity: number; notes: string }[] = [];
    let total = 0;
    let portions = 0;
    for (const line of input.cart) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20 || line.notes.length > 300) throw new OrderError("Jumlah atau catatan tidak valid.");
      const row = db.prepare("SELECT id, data, is_available FROM menu_items WHERE id = ?").get(line.menuItemId);
      if (!row || Number(row.is_available) !== 1) throw new OrderError("Salah satu menu habis atau tidak tersedia. Perbarui keranjang.");
      const data = JSON.parse(String(row.data)) as { name?: string; price?: number };
      const price = typeof data.price === "number" ? data.price : 0;
      portions += line.quantity;
      if (portions > MAX_PORTIONS) throw new OrderError("Maksimal 100 porsi dalam satu pesanan.");
      total += price * line.quantity;
      lines.push({ id: String(row.id), name: data.name ?? String(row.id), price, quantity: line.quantity, notes: line.notes });
    }

    const id = randomUUID();
    const now = nowIso();
    const queue = Number(db.prepare("SELECT COALESCE(MAX(queue_number), 0) + 1 AS n FROM orders").get()?.n ?? 1);
    db.prepare(
      `INSERT INTO orders (id, idempotency_key, queue_number, customer_name, phone, fulfillment, table_id, total, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, input.idempotencyKey, queue, input.customerName, input.phone, input.fulfillment, tableId, total, input.source ?? "whatsapp", now, now);
    const insertItem = db.prepare("INSERT INTO order_items (id, order_id, menu_item_id, name, unit_price, quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const line of lines) insertItem.run(randomUUID(), id, line.id, line.name, line.price, line.quantity, line.notes);
    if (tableId) db.prepare("UPDATE cafe_tables SET status = 'occupied' WHERE id = ?").run(tableId);
    return orderDocument(db, id);
  });
}
