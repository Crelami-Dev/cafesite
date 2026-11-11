import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type Db = DatabaseSync;

/**
 * Skema bersama untuk bot dan dashboard (src/lib/db/dev-sqlite.ts di Next.js).
 * Kedua sisi membuka file SQLite yang sama, jadi DDL ini HARUS identik; tests/schema-sync.test.ts
 * membandingkan keduanya. Semua statement idempotent (IF NOT EXISTS).
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

export function openDatabase(file: string): Db {
  if (file !== ":memory:") mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new DatabaseSync(file);
  // WAL + busy_timeout: dashboard (Next.js) dan bot menulis ke file yang sama tanpa saling mengunci.
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA_SQL);
  return db;
}

/** Jalankan fn dalam transaksi IMMEDIATE (kunci tulis di awal, aman dari race antar proses). */
export function transaction<T>(db: Db, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* transaksi sudah berakhir */ }
    throw error;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}
