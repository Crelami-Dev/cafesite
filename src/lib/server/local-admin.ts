import "server-only";
import { randomUUID } from "node:crypto";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { HttpError, numberValue, objectValue, textValue, uuidValue } from "./validation";
import { tableKey } from "./local-orders";
import { validateContent } from "./dashboard-content";
import { mirrorDeleteToSupabase, mirrorOrderToSupabase, mirrorWriteToSupabase } from "./cloud-sync";
import { cafeInfo } from "@/data/cafe";

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

export function listLocalOrders(params = new URLSearchParams()): { orders: Row[]; total: number; page: number; pages: number } {
  const db=getLocalDb(); const conditions:string[]=[]; const values:(string|number)[]=[];
  const active=params.get("view")==="active";
  if(active) conditions.push("status IN ('waiting','preparing','ready')");
  else if(params.get("view")==="history") conditions.push("status IN ('completed','cancelled')");
  if(params.get("id")){conditions.push("id=?");values.push(params.get("id")!);}
  const status=params.get("status"); if(status&&status!=="all"){if(!["waiting","preparing","ready","completed","cancelled"].includes(status))throw new HttpError(400,"Status tidak valid.");conditions.push("status=?");values.push(status);}
  const search=params.get("q")?.trim();if(search){conditions.push("(customer_name LIKE ? OR CAST(queue_number AS TEXT) LIKE ? OR table_id LIKE ?)");values.push(...Array(3).fill(`%${search.slice(0,100)}%`));}
  for(const key of ["from","to"]){const date=params.get(key);if(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date)))throw new HttpError(400,"Tanggal tidak valid.");conditions.push(`created_at ${key==="from"?">=":"<"} ?`);values.push(new Date(Date.parse(`${date}T00:00:00+07:00`)+(key==="to"?86400000:0)).toISOString());}}
  const where=conditions.length?`WHERE ${conditions.join(" AND ")}`:"";
  const total=Number(db.prepare(`SELECT COUNT(*) n FROM orders ${where}`).get(...values)?.n??0);
  const page=Math.max(1,Math.min(Math.ceil(total/25)||1,Number.parseInt(params.get("page")||"1",10)||1));
  const rows=db.prepare(`SELECT * FROM orders ${where} ORDER BY created_at ${active?"ASC":"DESC"} ${active?"":"LIMIT 25 OFFSET ?"}`).all(...values,...(active?[]:[(page-1)*25]));
  const getItems=db.prepare("SELECT id,order_id,menu_item_id,name,unit_price,quantity,notes FROM order_items WHERE order_id=? ORDER BY rowid");
  return {orders:rows.map(order=>orderRow(order,getItems.all(String(order.id)))),total,page,pages:Math.ceil(total/25)||1};
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
    if (input.expectedUpdatedAt !== undefined && input.expectedUpdatedAt !== current.updated_at) throw new HttpError(409, "Pesanan telah diperbarui staf lain. Muat ulang sebelum melanjutkan.");
    if (markPaid && ["completed", "cancelled"].includes(String(current.status))) throw new HttpError(409, "Pesanan sudah ditutup.");
    if (markPaid && nextStatus === "cancelled") throw new HttpError(409, "Pembayaran dan pembatalan tidak dapat dilakukan bersamaan.");
    if (nextStatus !== null && nextStatus !== current.status) {
      if (!(NEXT_STATUS[String(current.status)] ?? []).includes(nextStatus)) throw new HttpError(409, "Urutan status tidak valid.");
      if (nextStatus === "cancelled" && current.payment_status === "paid") throw new HttpError(409, "Pesanan sudah dibayar; hubungi admin untuk penanganan pengembalian.");
      if (nextStatus === "completed" && current.payment_status !== "paid" && !markPaid) throw new HttpError(409, "Konfirmasi pembayaran kasir sebelum menyelesaikan pesanan.");
    }
    const now = new Date(Math.max(Date.now(), Date.parse(String(current.updated_at))+1)).toISOString();
    db.prepare("UPDATE orders SET status = COALESCE(?, status), payment_status = CASE WHEN ? THEN 'paid' ELSE payment_status END, paid_amount = CASE WHEN ? THEN total ELSE paid_amount END, updated_at = ? WHERE id = ?")
      .run(nextStatus, markPaid ? 1 : 0, markPaid ? 1 : 0, now, id);
    if ((nextStatus === "completed" || nextStatus === "cancelled") && current.table_id) db.prepare("UPDATE cafe_tables SET status = 'dirty' WHERE id = ?").run(String(current.table_id));
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Row;
    const items = db.prepare("SELECT id, order_id, menu_item_id, name, unit_price, quantity, notes FROM order_items WHERE order_id = ? ORDER BY rowid").all(id);
    mirrorOrderToSupabase(id);
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
    return { data: row ? parse(row.data) : resource === "cafe" ? cafeInfo : [] };
  }
  if (resource === "menu") {
    const rows = db.prepare("SELECT id, data, is_available, sort_order FROM menu_items ORDER BY sort_order, id").all();
    return { data: rows.map((row) => ({ id: row.id, data: parse(row.data), is_available: Number(row.is_available) === 1, sort_order: row.sort_order })) };
  }
  if (resource === "tables") {
    const floors = db.prepare("SELECT id, name, sort_order FROM floors ORDER BY sort_order, name").all();
    const activeOrderStmt = db.prepare("SELECT id, queue_number, customer_name, status, total FROM orders WHERE table_id = ? AND status IN ('waiting','preparing','ready') ORDER BY created_at DESC LIMIT 1");
    const tables = db.prepare("SELECT id, floor_id, label, status FROM cafe_tables ORDER BY id").all().map((table) => {
      const order = activeOrderStmt.get(String(table.id));
      return {
        ...table,
        x: 10,
        y: 10,
        qr_key: tableKey(String(table.id)),
        active_order: order
          ? {
              id: String(order.id),
              queue_number: Number(order.queue_number),
              customer_name: String(order.customer_name),
              status: String(order.status) as "waiting" | "preparing" | "ready",
              total: Number(order.total),
            }
          : null,
      };
    });
    return { floors, tables };
  }
  return { data: [] };
}

export function writeLocalManage(resource: ManageResource, body: Row, revalidate: () => void): { ok: true } {
  const db = getLocalDb();
  if (resource === "categories" || (CONTENT_RESOURCES as readonly string[]).includes(resource)) {
    validateContent(resource, body.data);
    db.prepare("INSERT INTO content (key, data) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data").run(resource, JSON.stringify(body.data ?? null));
    mirrorWriteToSupabase(resource, { data: body.data ?? null });
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
      mirrorWriteToSupabase("menu", { reorder: body.reorder });
      revalidate();
      return { ok: true };
    }
    const item = objectValue(body.item);
    const id = textValue(item.id, "ID menu", 80);
    const price = numberValue(item.price, "Harga", 0, 10_000_000);
    textValue(item.name, "Nama menu", 120);
    const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;
    db.prepare("INSERT INTO menu_items (id, data, is_available, sort_order) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, is_available = excluded.is_available, sort_order = excluded.sort_order")
      .run(id, JSON.stringify({ ...item, id, price }), item.isAvailable === false ? 0 : 1, sortOrder);
    mirrorWriteToSupabase("menu", { item: { ...item, id, price }, sortOrder });
    revalidate();
    return { ok: true };
  }
  if (resource === "floors") {
    const floor = objectValue(body.floor);
    const name = textValue(floor.name, "Nama lantai", 80);
    const sortOrder = numberValue(floor.sortOrder, "Urutan lantai", 0, 10000);
    const id = floor.id !== undefined ? uuidValue(floor.id) : randomUUID();
    if (floor.id !== undefined) db.prepare("UPDATE floors SET name = ?, sort_order = ? WHERE id = ?").run(name, sortOrder, id);
    else db.prepare("INSERT INTO floors (id, name, sort_order) VALUES (?, ?, ?)").run(id, name, sortOrder);
    mirrorWriteToSupabase("floors", { floor: { id, name, sortOrder } });
    return { ok: true };
  }
  if (resource === "tables") {
    const table = objectValue(body.table);
    const id = tableId(table.id);
    const floorId = uuidValue(table.floorId);
    const label = textValue(table.label, "Nama meja", 80);
    const status = String(table.status);
    if (!["available", "occupied", "dirty"].includes(status)) throw new HttpError(400, "Status meja tidak valid.");
    if (!db.prepare("SELECT 1 FROM floors WHERE id = ?").get(floorId)) throw new HttpError(400, "Lantai tidak ditemukan.");
    db.prepare("INSERT INTO cafe_tables (id, floor_id, label, status) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET floor_id = excluded.floor_id, label = excluded.label, status = excluded.status")
      .run(id, floorId, label, status);
    mirrorWriteToSupabase("tables", { table: { id, floorId, label, status } });
    return { ok: true };
  }
  if (resource === "modules") return { ok: true }; // mode lokal: satu admin, semua modul aktif
  throw new HttpError(400, "Aksi tidak tersedia.");
}

export function deleteLocalManage(resource: ManageResource, body: Row, revalidate: () => void): { ok: true } {
  const db = getLocalDb();
  if (resource === "menu") {
    const id = textValue(body.id, "ID menu", 80);
    db.prepare("DELETE FROM menu_items WHERE id = ?").run(id);
    mirrorDeleteToSupabase("menu", id);
    revalidate();
    return { ok: true };
  }
  if (resource === "tables") {
    const id = tableId(body.id);
    if (db.prepare("SELECT 1 FROM orders WHERE table_id = ?").get(id)) throw new HttpError(409, "Data masih digunakan. Pindahkan atau selesaikan data terkait dahulu.");
    db.prepare("DELETE FROM cafe_tables WHERE id = ?").run(id);
    mirrorDeleteToSupabase("tables", id);
    return { ok: true };
  }
  if (resource === "floors") {
    const id = uuidValue(body.id);
    if (db.prepare("SELECT 1 FROM cafe_tables WHERE floor_id = ?").get(id)) throw new HttpError(409, "Data masih digunakan. Pindahkan atau selesaikan data terkait dahulu.");
    db.prepare("DELETE FROM floors WHERE id = ?").run(id);
    mirrorDeleteToSupabase("floors", id);
    return { ok: true };
  }
  throw new HttpError(400, "Penghapusan tidak tersedia.");
}
