import "server-only";
import { mkdirSync } from "node:fs";
import {isCloudPrimaryEnv} from "@/lib/server/storage-mode";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { cafeInfo } from "@/data/cafe";
import { menuItems } from "@/data/menu";
import { galleryPhotos } from "@/data/gallery";
import { locationFaqs, transportGuides } from "@/data/location";
import type { MenuItem, PublicContent } from "@/types";

/**
 * Penyimpanan konten publik untuk development (node:sqlite, tanpa dependency baru).
 * File: .data/cafesite.dev.db (diabaikan git). Dibuat dan diisi dari src/data saat pertama jalan.
 * Baris `cafe` di tabel content sengaja tidak di-seed: info kafe masih contoh, jadi mode pratinjau tetap aktif.
 * Ubah isi lewat DB (mis. DB Browser for SQLite) atau hapus filenya untuk seed ulang.
 */
const DB_FILE = path.join(process.cwd(), ".data", "cafesite.dev.db");

// Disimpan di globalThis agar tidak bocor tiap HMR reload.
const store = globalThis as typeof globalThis & { __cafeDevDb?: DatabaseSync; __cafeDevDbSchema?: string };

/**
 * Skema bersama dengan bot WhatsApp (server/src/db/database.ts). DDL ini HARUS identik;
 * server/tests/schema-sync.test.ts membandingkan keduanya.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  is_available INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS content (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS floors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cafe_tables (
  id TEXT PRIMARY KEY,
  floor_id TEXT REFERENCES floors(id),
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','dirty'))
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  queue_number INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  fulfillment TEXT NOT NULL CHECK (fulfillment IN ('dine_in','takeaway')),
  table_id TEXT REFERENCES cafe_tables(id),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','preparing','ready','completed','cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid')),
  total INTEGER NOT NULL DEFAULT 0,
  paid_amount INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'whatsapp',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_order_per_table ON orders(table_id)
  WHERE table_id IS NOT NULL AND status IN ('waiting','preparing','ready');
CREATE INDEX IF NOT EXISTS orders_created ON orders(created_at DESC);
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS order_items_order ON order_items(order_id);
CREATE TABLE IF NOT EXISTS order_notifications (
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT,
  PRIMARY KEY (order_id, status)
);
CREATE TABLE IF NOT EXISTS rag_jobs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  error TEXT,
  note TEXT,
  content BLOB NOT NULL,
  size INTEGER NOT NULL,
  processing_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS rag_jobs_status ON rag_jobs(status, created_at);
CREATE TABLE IF NOT EXISTS rag_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding BLOB
);
CREATE INDEX IF NOT EXISTS rag_chunks_source ON rag_chunks(source);
CREATE TABLE IF NOT EXISTS answer_cache (
  cache_key TEXT PRIMARY KEY,
  answer TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboard_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS staff_accounts (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL, salt TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
 must_change_password INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS staff_permissions (
 account_id TEXT NOT NULL REFERENCES staff_accounts(id) ON DELETE CASCADE,
 module TEXT NOT NULL, PRIMARY KEY(account_id,module)
);
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires_at INTEGER NOT NULL, owner_version TEXT
);
CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS order_milestones (
 order_id TEXT PRIMARY KEY REFERENCES orders(id), paid_at TEXT, completed_at TEXT, estimated INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO order_milestones(order_id,paid_at,completed_at,estimated)
 SELECT id, CASE WHEN payment_status='paid' THEN updated_at END, CASE WHEN status='completed' THEN updated_at END,1 FROM orders
 WHERE payment_status='paid' OR status='completed';
CREATE TRIGGER IF NOT EXISTS dashboard_payment_timestamp AFTER UPDATE OF payment_status,status ON orders
BEGIN
 INSERT INTO order_milestones(order_id,paid_at,completed_at,estimated)
 VALUES(NEW.id,CASE WHEN NEW.payment_status='paid' THEN NEW.updated_at END,CASE WHEN NEW.status='completed' THEN NEW.updated_at END,0)
 ON CONFLICT(order_id) DO UPDATE SET
 paid_at=COALESCE(order_milestones.paid_at,excluded.paid_at),completed_at=COALESCE(order_milestones.completed_at,excluded.completed_at);
END;
INSERT OR IGNORE INTO dashboard_migrations VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
`;

function open(): DatabaseSync {
  if (isCloudPrimaryEnv()) throw new Error("SQLite is disabled in cloud mode; use Supabase.");
  if (store.__cafeDevDb) {
    if (store.__cafeDevDbSchema !== SCHEMA_SQL) {
      store.__cafeDevDb.exec(SCHEMA_SQL);
      store.__cafeDevDbSchema = SCHEMA_SQL;
    }
    return store.__cafeDevDb;
  }
  // getBuiltinModule (Node 22.3+) dipakai agar bundler tidak me-resolve node:sqlite saat build produksi.
  const sqlite = process.getBuiltinModule("node:sqlite") as typeof import("node:sqlite") | undefined;
  if (!sqlite) throw new Error("node:sqlite tidak tersedia (butuh Node 22.5+)");
  const Sqlite = sqlite.DatabaseSync;
  mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const conn = new Sqlite(DB_FILE);
  // WAL + busy_timeout: dashboard dan bot WhatsApp menulis ke file yang sama tanpa saling mengunci.
  conn.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  conn.exec(SCHEMA_SQL);
  const seeded = conn.prepare("SELECT 1 AS n FROM content WHERE key = '_initialized'").get()?.n;
  if (!seeded) {
    const insertMenu = conn.prepare(
      "INSERT OR IGNORE INTO menu_items (id, data, is_available, sort_order) VALUES (?, ?, ?, ?)",
    );
    const existing = Number(conn.prepare("SELECT COUNT(*) AS n FROM menu_items").get()?.n ?? 0);
    (existing ? [] : menuItems).forEach((item, index) => {
      const { id, isAvailable, ...rest } = item;
      insertMenu.run(id, JSON.stringify(rest), isAvailable === false ? 0 : 1, index);
    });
    const insertContent = conn.prepare("INSERT OR IGNORE INTO content (key, data) VALUES (?, ?)");
    insertContent.run("gallery", JSON.stringify(galleryPhotos));
    insertContent.run("faq", JSON.stringify(locationFaqs));
    insertContent.run("location", JSON.stringify(transportGuides));
    insertContent.run("testimonials", JSON.stringify([]));
    insertContent.run("_initialized", "true");
  }
  store.__cafeDevDb = conn;
  store.__cafeDevDbSchema = SCHEMA_SQL;
  return conn;
}

/** Koneksi SQLite bersama (dipakai route admin lokal, mis. WhatsApp Bot). */
export function getLocalDb(): DatabaseSync {
  return open();
}

export function readDevContent(): PublicContent {
  const conn = open();
  const entries = Object.fromEntries(
    conn
      .prepare("SELECT key, data FROM content")
      .all()
      .map((row) => [String(row.key), JSON.parse(String(row.data))]),
  );
  const menu = conn
    .prepare("SELECT id, data, is_available FROM menu_items ORDER BY sort_order")
    .all()
    .map(
      (row) =>
        ({
          ...JSON.parse(String(row.data)),
          id: String(row.id),
          isAvailable: Number(row.is_available) === 1,
        }) as MenuItem,
    );

  return {
    cafeConfirmed: Boolean(entries.cafe),
    cafe: entries.cafe ?? cafeInfo,
    menu,
    categories: Array.isArray(entries.categories) && entries.categories.length > 0 ? entries.categories : undefined,
    gallery: entries.gallery ?? galleryPhotos,
    testimonials: entries.testimonials ?? [],
    faq: entries.faq ?? locationFaqs,
    location: entries.location ?? transportGuides,
    configured: Boolean(entries.cafe),
  };
}
