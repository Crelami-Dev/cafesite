import "server-only";
import { randomUUID } from "node:crypto";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { HttpError, numberValue, objectValue, textValue, uuidValue } from "./validation";

/**
 * Backend admin mode lokal: semua data di SQLite bersama (.data/cafesite.dev.db), tanpa Supabase.
 * Aturan bisnis (urutan status pesanan, meja, pembayaran) diport dari RPC update_cafe_order dkk.
 */
type Row = Record<string, unknown>;

const CONTENT_RESOURCES = ["cafe", "gallery", "testimonials", "faq", "location"] as const;
export const MANAGE_RESOURCES = ["menu", "tables", "floors", "cafe", "gallery", "testimonials", "faq", "location", "reports", "modules", "categories"] as const;
export type ManageResource = (typeof MANAGE_RESOURCES)[number];

export function localBootstrap(): { profile: { id: string; role: "admin" }; modules: [] } {
  return { profile: { id: "local-admin", role: "admin" }, modules: [] };
}

function parse(value: unknown): unknown {
  try { return JSON.parse(String(value)); } catch { return null; }
}

function inTransaction<T>(fn: () => T): T {
  const db = getLocalDb();
  db.exec("BEGIN IMMEDIATE");
  try { const result = fn(); db.exec("COMMIT"); return result; }
  catch (error) { db.exec("ROLLBACK"); throw error; }
}

/* ---------------------------------------------------------------- pesanan */

function orderRow(order: Row, items: Row[]): Row {
  return { ...order, user_id: "local", payment_method: "cod", items };
}

export function listLocalOrders(): { orders: Row[] } {
  const db = getLocalDb();
  const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100").all();
  const items = db.prepare("SELECT id, order_id, menu_item_id, name, unit_price, quantity, notes FROM order_items WHERE order_id IN (SELECT id FROM (SELECT id FROM orders ORDER BY created_at DESC LIMIT 100)) ORDER BY rowid").all();
  return { orders: orders.map((order) => orderRow(order, items.filter((item) => item.order_id === order.id))) };
}

const NEXT_STATUS: Record<string, string[]> = { waiting: ["preparing", "cancelled"], preparing: ["ready"], ready: ["completed"] };

export function updateLocalOrder(input: Row): { order: Row } {
  const id = uuidValue(input.id);
  const nextStatus = input.status === undefined || input.status === null ? null : textValue(input.status, "Status", 20);
  const markPaid = input.markPaid === true;
  return inTransaction(() => {
    const db = getLocalDb();
    const current = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!current) throw new HttpError(404, "Pesanan tidak ditemukan.");
    if (markPaid && ["completed", "cancelled"].includes(String(current.status))) throw new HttpError(409, "Pesanan sudah ditutup.");
    if (markPaid && nextStatus === "cancelled") throw new HttpError(409, "Pembayaran dan pembatalan tidak dapat dilakukan bersamaan.");
    if (nextStatus !== null && nextStatus !== current.status) {
      if (!(NEXT_STATUS[String(current.status)] ?? []).includes(nextStatus)) throw new HttpError(409, "Urutan status tidak valid.");
      if (nextStatus === "cancelled" && current.payment_status === "paid") throw new HttpError(409, "Pesanan sudah dibayar; hubungi admin untuk penanganan pengembalian.");
      if (nextStatus === "completed" && current.payment_status !== "paid" && !markPaid) throw new HttpError(409, "Konfirmasi pembayaran kasir sebelum menyelesaikan pesanan.");
    }
    const now = new Date().toISOString();
    db.prepare("UPDATE orders SET status = COALESCE(?, status), payment_status = CASE WHEN ? THEN 'paid' ELSE payment_status END, paid_amount = CASE WHEN ? THEN total ELSE paid_amount END, updated_at = ? WHERE id = ?")
      .run(nextStatus, markPaid ? 1 : 0, markPaid ? 1 : 0, now, id);
    if ((nextStatus === "completed" || nextStatus === "cancelled") && current.table_id) db.prepare("UPDATE cafe_tables SET status = 'dirty' WHERE id = ?").run(String(current.table_id));
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Row;
    const items = db.prepare("SELECT id, order_id, menu_item_id, name, unit_price, quantity, notes FROM order_items WHERE order_id = ? ORDER BY rowid").all(id);
    return { order: orderRow(order, items) };
  });
}

/* ------------------------------------------------------------------ kelola */

function tableId(value: unknown): string {
  const id = textValue(value, "ID meja", 40);
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) throw new HttpError(400, "ID meja hanya boleh berisi huruf, angka, garis bawah, atau tanda hubung.");
  return id;
}

export function readLocalManage(resource: ManageResource): unknown {
  const db = getLocalDb();
  if (resource === "categories") {
    const row = db.prepare("SELECT data FROM content WHERE key = 'categories'").get();
    if (row) return { data: parse(row.data) };
    const cafe = parse(db.prepare("SELECT data FROM content WHERE key = 'cafe'").get()?.data) as { categories?: unknown } | null;
    return { data: Array.isArray(cafe?.categories) ? cafe.categories : null };
  }
  if ((CONTENT_RESOURCES as readonly string[]).includes(resource)) {
    const row = db.prepare("SELECT data FROM content WHERE key = ?").get(resource);
    return { data: row ? parse(row.data) : null };
  }
  if (resource === "menu") {
    const rows = db.prepare("SELECT id, data, is_available, sort_order FROM menu_items ORDER BY sort_order, id").all();
    return { data: rows.map((row) => ({ id: row.id, data: parse(row.data), is_available: Number(row.is_available) === 1, sort_order: row.sort_order })) };
  }
  if (resource === "tables") {
    const floors = db.prepare("SELECT id, name, sort_order FROM floors ORDER BY sort_order, name").all();
    const tables = db.prepare("SELECT id, floor_id, label, status FROM cafe_tables ORDER BY id").all().map((table) => ({ ...table, x: 10, y: 10 }));
    return { floors, tables };
  }
  return { data: [] };
}

export function writeLocalManage(resource: ManageResource, body: Row, revalidate: () => void): { ok: true } {
  const db = getLocalDb();
  if (resource === "categories" || (CONTENT_RESOURCES as readonly string[]).includes(resource)) {
    db.prepare("INSERT INTO content (key, data) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data").run(resource, JSON.stringify(body.data ?? null));
    revalidate();
    return { ok: true };
  }
  if (resource === "menu") {
    if (Array.isArray(body.reorder)) {
      inTransaction(() => {
        for (const raw of body.reorder as unknown[]) {
          const row = objectValue(raw);
          db.prepare("UPDATE menu_items SET sort_order = ? WHERE id = ?").run(numberValue(row.sort_order, "Urutan", 0, 100000), textValue(row.id, "ID menu", 80));
        }
      });
      revalidate();
      return { ok: true };
    }
    const item = objectValue(body.item);
    const id = textValue(item.id, "ID menu", 80);
    const price = numberValue(item.price, "Harga", 0, 10_000_000);
    textValue(item.name, "Nama menu", 120);
    db.prepare("INSERT INTO menu_items (id, data, is_available, sort_order) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, is_available = excluded.is_available, sort_order = excluded.sort_order")
      .run(id, JSON.stringify({ ...item, id, price }), item.isAvailable === false ? 0 : 1, typeof body.sortOrder === "number" ? body.sortOrder : 0);
    revalidate();
    return { ok: true };
  }
  if (resource === "floors") {
    const floor = objectValue(body.floor);
    const name = textValue(floor.name, "Nama lantai", 80);
    const sortOrder = numberValue(floor.sortOrder, "Urutan lantai", 0, 10000);
    if (floor.id !== undefined) db.prepare("UPDATE floors SET name = ?, sort_order = ? WHERE id = ?").run(name, sortOrder, uuidValue(floor.id));
    else db.prepare("INSERT INTO floors (id, name, sort_order) VALUES (?, ?, ?)").run(randomUUID(), name, sortOrder);
    return { ok: true };
  }
  if (resource === "tables") {
    const table = objectValue(body.table);
    const id = tableId(table.id);
    const floorId = uuidValue(table.floorId);
    if (!["available", "occupied", "dirty"].includes(String(table.status))) throw new HttpError(400, "Status meja tidak valid.");
    if (!db.prepare("SELECT 1 FROM floors WHERE id = ?").get(floorId)) throw new HttpError(400, "Lantai tidak ditemukan.");
    db.prepare("INSERT INTO cafe_tables (id, floor_id, label, status) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET floor_id = excluded.floor_id, label = excluded.label, status = excluded.status")
      .run(id, floorId, textValue(table.label, "Nama meja", 80), String(table.status));
    return { ok: true };
  }
  if (resource === "modules") return { ok: true }; // mode lokal: satu admin, semua modul aktif
  throw new HttpError(400, "Aksi tidak tersedia.");
}

export function deleteLocalManage(resource: ManageResource, body: Row, revalidate: () => void): { ok: true } {
  const db = getLocalDb();
  if (resource === "menu") {
    db.prepare("DELETE FROM menu_items WHERE id = ?").run(textValue(body.id, "ID menu", 80));
    revalidate();
    return { ok: true };
  }
  if (resource === "tables") {
    const id = tableId(body.id);
    if (db.prepare("SELECT 1 FROM orders WHERE table_id = ?").get(id)) throw new HttpError(409, "Data masih digunakan. Pindahkan atau selesaikan data terkait dahulu.");
    db.prepare("DELETE FROM cafe_tables WHERE id = ?").run(id);
    return { ok: true };
  }
  if (resource === "floors") {
    const id = uuidValue(body.id);
    if (db.prepare("SELECT 1 FROM cafe_tables WHERE floor_id = ?").get(id)) throw new HttpError(409, "Data masih digunakan. Pindahkan atau selesaikan data terkait dahulu.");
    db.prepare("DELETE FROM floors WHERE id = ?").run(id);
    return { ok: true };
  }
  throw new HttpError(400, "Penghapusan tidak tersedia.");
}
