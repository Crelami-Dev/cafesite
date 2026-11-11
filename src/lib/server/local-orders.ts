import "server-only";
import { isCloudPrimaryEnv } from "./storage-mode";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { HttpError, itemInputs, objectValue, textValue, uuidValue } from "./validation";
import type { CatalogResponse, MenuItem } from "@/types";
import type { CafeTable, Order } from "@/types/operations";

/**
 * Pemesanan dari website dalam mode lokal (SQLite bersama dengan dashboard dan bot WhatsApp).
 * Aturan sama dengan pesanan WhatsApp (server/src/order/orderApi.ts): harga dan ketersediaan dibaca ulang
 * dari menu_items, meja harus kosong, idempotency key mencegah pesanan ganda, maks 5 pesanan per nomor per 10 menit.
 * Pelanggan tidak punya akun: akses ke halaman status memakai token HMAC per pesanan yang hanya dipegang browser pemesan.
 */
type Row = Record<string, unknown>;

const RATE_LIMIT_ORDERS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const SECRET_FILE = path.join(process.cwd(), ".data", "order-access.secret");

let secret: string | null = null;
function accessSecret(): string {
  if (secret) return secret;
  if (process.env.ORDER_ACCESS_SECRET && process.env.ORDER_ACCESS_SECRET.length >= 16) return (secret = process.env.ORDER_ACCESS_SECRET);
  if (isCloudPrimaryEnv()) throw new HttpError(503, "Kunci QR dan pesanan cloud belum dikonfigurasi.");
  // Kunci acak yang dibuat sekali dan disimpan di folder data (tidak ikut git), supaya token tidak bisa ditebak.
  if (existsSync(SECRET_FILE)) secret = readFileSync(SECRET_FILE, "utf8").trim();
  if (!secret || secret.length < 32) {
    mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
    secret = randomBytes(32).toString("base64url");
    writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
  }
  return secret;
}

export function orderAccessToken(orderId: string): string {
  return createHmac("sha256", accessSecret()).update(`order:${orderId}`).digest("base64url");
}

/**
 * Kunci QR meja: QR yang dicetak dari dashboard berisi /order?meja=<id>&k=<kunci>. Tanpa kunci yang benar
 * (mis. alamat diketik sendiri dari rumah), halaman pesan tidak terbuka dan server menolak pesanan.
 */
export function tableKey(tableId: string): string {
  return createHmac("sha256", accessSecret()).update(`table:${tableId}`).digest("base64url").slice(0, 16);
}

function sameText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export interface ScannedTable { id: string; label: string; status: CafeTable["status"]; key: string }

/** Meja dari hasil scan QR, atau null bila kode meja/kuncinya tidak cocok. */
export function resolveScannedTable(tableId: unknown, key: unknown): ScannedTable | null {
  if (typeof tableId !== "string" || typeof key !== "string" || !tableId || tableId.length > 40 || key.length > 64) return null;
  if (!sameText(key, tableKey(tableId))) return null;
  const row = getLocalDb().prepare("SELECT id, label, status FROM cafe_tables WHERE id = ?").get(tableId);
  return row ? { id: String(row.id), label: String(row.label), status: row.status as CafeTable["status"], key } : null;
}

function validToken(orderId: string, token: string | null): boolean {
  if (!token) return false;
  const given = Buffer.from(token);
  const wanted = Buffer.from(orderAccessToken(orderId));
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

function parseData(value: unknown): Row {
  try { return JSON.parse(String(value)) as Row; } catch { return {}; }
}

/** Menu dan meja untuk halaman /order, langsung dari database yang diubah lewat dashboard. */
export function localCatalog(): CatalogResponse {
  const db = getLocalDb();
  const menu = db.prepare("SELECT id, data, is_available FROM menu_items WHERE is_available = 1 ORDER BY sort_order").all()
    .map((row) => ({ ...parseData(row.data), id: String(row.id), isAvailable: true }) as MenuItem);
  const tables = db.prepare("SELECT t.id, t.floor_id, t.label, t.status FROM cafe_tables t LEFT JOIN floors f ON f.id = t.floor_id ORDER BY f.sort_order, t.label").all()
    .map((row): CafeTable => ({ id: String(row.id), floor_id: String(row.floor_id ?? ""), label: String(row.label), x: 0, y: 0, status: row.status as CafeTable["status"] }));
  return { menu, tables, configured: true, onlinePayment: false };
}

function orderDocument(id: string): Order {
  const db = getLocalDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!order) throw new HttpError(404, "Pesanan tidak ditemukan.");
  const items = db.prepare("SELECT id, menu_item_id, name, unit_price, quantity, notes FROM order_items WHERE order_id = ? ORDER BY rowid").all(id);
  return { ...(order as Row), user_id: "local", payment_method: "cod", items } as unknown as Order;
}

export function createLocalOrder(body: unknown): { order: Order; accessToken: string } {
  const raw = objectValue(body);
  const idempotencyKey = uuidValue(raw.idempotencyKey);
  const customerName = textValue(raw.customerName, "Nama", 80, 2);
  const phone = textValue(raw.phone, "Nomor HP", 20, 8).replace(/[\s()+-]/g, "");
  if (!/^\d{8,15}$/.test(phone)) throw new HttpError(400, "Nomor HP tidak valid.");
  if (raw.fulfillment !== "dine_in" && raw.fulfillment !== "takeaway") throw new HttpError(400, "Pilih makan di tempat atau bawa pulang.");
  if (raw.paymentMethod !== undefined && raw.paymentMethod !== "cod") throw new HttpError(400, "Pembayaran online segera hadir. Gunakan bayar di kasir.");
  const fulfillment: "dine_in" | "takeaway" = raw.fulfillment;
  const items = itemInputs(raw.items);
  // Wajib scan QR meja (anti iseng): pesanan web hanya diterima dari orang yang ada di kedai.
  // Makan di tempat memakai meja dari QR; bawa pulang tetap butuh scan sebagai bukti hadir.
  const scanned = resolveScannedTable(raw.tableCode, raw.tableKey);
  if (!scanned) throw new HttpError(403, "Scan QR di meja dulu untuk memesan dari website.");

  accessSecret(); // siapkan kunci token sebelum transaksi; kegagalan di sini tidak boleh terjadi setelah pesanan tersimpan
  const id = insertOrder({ idempotencyKey, customerName, phone, fulfillment, tableCode: fulfillment === "dine_in" ? scanned.id : null, items });
  return { order: orderDocument(id), accessToken: orderAccessToken(id) };
}

interface OrderInput {
  idempotencyKey: string;
  customerName: string;
  phone: string;
  fulfillment: "dine_in" | "takeaway";
  tableCode: string | null;
  items: ReturnType<typeof itemInputs>;
}

/** Simpan pesanan secara atomik; mengembalikan id (pesanan lama bila idempotency key sudah dipakai). */
function insertOrder({ idempotencyKey, customerName, phone, fulfillment, tableCode, items }: OrderInput): string {
  const db = getLocalDb();
  db.exec("BEGIN IMMEDIATE");
  let committed = false;
  try {
    const existing = db.prepare("SELECT id FROM orders WHERE idempotency_key = ?").get(idempotencyKey);
    if (existing) {
      db.exec("COMMIT");
      committed = true;
      return String(existing.id);
    }
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    if (Number(db.prepare("SELECT COUNT(*) AS n FROM orders WHERE phone = ? AND created_at > ?").get(phone, since)?.n ?? 0) >= RATE_LIMIT_ORDERS) {
      throw new HttpError(429, "Terlalu banyak pesanan dari nomor ini. Tunggu beberapa menit atau hubungi kasir.");
    }

    let tableId: string | null = null;
    if (fulfillment === "dine_in" && tableCode) {
      const table = db.prepare("SELECT id, status FROM cafe_tables WHERE id = ?").get(tableCode);
      if (!table) throw new HttpError(400, "Meja tidak ditemukan. Scan ulang QR di meja.");
      // Satu pesanan aktif per meja (indeks one_active_order_per_table, sama dengan pesanan WhatsApp dan dashboard).
      if (table.status !== "available") throw new HttpError(409, "Meja ini masih punya pesanan aktif. Untuk tambah pesanan, sampaikan ke kasir, atau pilih bawa pulang.");
      tableId = String(table.id);
    }

    let total = 0;
    const lines = items.map((item) => {
      const row = db.prepare("SELECT id, data, is_available FROM menu_items WHERE id = ?").get(item.menuItemId);
      if (!row || Number(row.is_available) !== 1) throw new HttpError(409, "Salah satu menu habis atau tidak tersedia. Perbarui keranjang.");
      const data = parseData(row.data);
      const price = typeof data.price === "number" ? data.price : 0;
      total += price * item.quantity;
      return { id: String(row.id), name: typeof data.name === "string" ? data.name : String(row.id), price, quantity: item.quantity, notes: item.notes };
    });

    const id = randomUUID();
    const now = new Date().toISOString();
    const queue = Number(db.prepare("SELECT COALESCE(MAX(queue_number), 0) + 1 AS n FROM orders").get()?.n ?? 1);
    db.prepare(
      `INSERT INTO orders (id, idempotency_key, queue_number, customer_name, phone, fulfillment, table_id, total, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'web', ?, ?)`,
    ).run(id, idempotencyKey, queue, customerName, phone, fulfillment, tableId, total, now, now);
    const insertItem = db.prepare("INSERT INTO order_items (id, order_id, menu_item_id, name, unit_price, quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const line of lines) insertItem.run(randomUUID(), id, line.id, line.name, line.price, line.quantity, line.notes);
    if (tableId) db.prepare("UPDATE cafe_tables SET status = 'occupied' WHERE id = ?").run(tableId);
    db.exec("COMMIT");
    committed = true;
    void (async () => {
      try {
        const { mirrorOrderToSupabase } = await import("./cloud-sync");
        mirrorOrderToSupabase(id);
      } catch {
        // Abaikan eror mirror pesanan ke cloud agar tidak mengganggu transaksi kasir
      }
    })();
    return id;
  } catch (error) {
    if (!committed) db.exec("ROLLBACK");
    throw error;
  }
}

/** Status pesanan untuk browser pemesan; tanpa token yang benar, pesanan diperlakukan seperti tidak ada. */
export function readLocalOrder(id: string, token: string | null): Order {
  const orderId = uuidValue(id);
  if (!validToken(orderId, token)) throw new HttpError(404, "Pesanan tidak ditemukan di browser ini. Buka dari browser yang dipakai saat memesan, atau tanyakan ke kasir.");
  return orderDocument(orderId);
}
