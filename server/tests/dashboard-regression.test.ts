import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID, scryptSync } from "node:crypto";
import { testDb } from "./helpers";
import { validateContent } from "../../src/lib/server/dashboard-content";

const digest = (v: string): string => createHash("sha256").update(v).digest("hex");
const hashPassword = (password: string, salt: string): string => scryptSync(password, salt, 64).toString("hex");

test("migrasi SQLite dashboard: tabel staf, izin, sesi, percobaan login, dan trigger order_milestones tersedia", () => {
  const db = testDb();
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r) => String(r.name));
  for (const name of ["dashboard_migrations", "staff_accounts", "staff_permissions", "admin_sessions", "login_attempts", "order_milestones"]) {
    assert.ok(tables.includes(name), `tabel ${name} harus ada`);
  }
  const version = db.prepare("SELECT version FROM dashboard_migrations WHERE version = 1").get();
  assert.equal(Number(version?.version), 1);
});

test("trigger dashboard_payment_timestamp mencatat paid_at dan completed_at otomatis saat pesanan dibayar/selesai", () => {
  const db = testDb();
  const orderId = randomUUID();
  const createdAt = "2026-11-10T08:00:00.000Z";
  const paidAt = "2026-11-10T08:05:00.000Z";
  const completedAt = "2026-11-10T08:12:00.000Z";

  db.prepare(
    `INSERT INTO orders (id, idempotency_key, queue_number, customer_name, phone, fulfillment, table_id, status, payment_status, total, paid_amount, source, created_at, updated_at)
     VALUES (?, ?, 1, 'Rina', '628123456789', 'dine_in', 'A1', 'waiting', 'unpaid', 50000, 0, 'web', ?, ?)`,
  ).run(orderId, `idem-${orderId}`, createdAt, createdAt);

  assert.equal(db.prepare("SELECT * FROM order_milestones WHERE order_id = ?").get(orderId), undefined);

  // Konfirmasi pembayaran kasir
  db.prepare("UPDATE orders SET payment_status = 'paid', paid_amount = total, updated_at = ? WHERE id = ?").run(paidAt, orderId);
  const afterPaid = db.prepare("SELECT * FROM order_milestones WHERE order_id = ?").get(orderId);
  assert.equal(afterPaid?.paid_at, paidAt);
  assert.equal(afterPaid?.completed_at, null);
  assert.equal(Number(afterPaid?.estimated), 0);

  // Selesaikan pesanan — paid_at pertama harus dipertahankan, completed_at terisi
  db.prepare("UPDATE orders SET status = 'completed', updated_at = ? WHERE id = ?").run(completedAt, orderId);
  const afterCompleted = db.prepare("SELECT * FROM order_milestones WHERE order_id = ?").get(orderId);
  assert.equal(afterCompleted?.paid_at, paidAt);
  assert.equal(afterCompleted?.completed_at, completedAt);
  assert.equal(Number(afterCompleted?.estimated), 0);
});

test("akun staf, izin modul, pencabutan sesi saat reset/nonaktif, dan batas percobaan login", () => {
  const db = testDb();
  const staffId = randomUUID();
  const salt1 = randomBytes(16).toString("hex");
  const tempPass = "TempPass-123456";

  db.prepare("INSERT INTO staff_accounts VALUES (?, ?, ?, ?, ?, 1, 1, ?)").run(
    staffId,
    "Kasir Pagi",
    "kasir@cafesite.local",
    hashPassword(tempPass, salt1),
    salt1,
    new Date().toISOString(),
  );
  db.prepare("INSERT INTO staff_permissions VALUES (?, 'orders'), (?, 'tables')").run(staffId, staffId);

  // Buat sesi aktif untuk staf
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO admin_sessions VALUES (?, ?, ?, NULL)").run(digest(token), staffId, Date.now() + 8 * 3600_000);
  assert.equal(Number(db.prepare("SELECT COUNT(*) n FROM admin_sessions WHERE account_id = ?").get(staffId)?.n), 1);

  // Ganti kata sandi staf -> mencabut sesi lama dan mematikan must_change_password
  const salt2 = randomBytes(16).toString("hex");
  const newPass = "KataSandiBaru12Karakter!";
  db.prepare("UPDATE staff_accounts SET salt = ?, password_hash = ?, must_change_password = 0 WHERE id = ?").run(
    salt2,
    hashPassword(newPass, salt2),
    staffId,
  );
  db.prepare("DELETE FROM admin_sessions WHERE account_id = ?").run(staffId);

  const updatedStaff = db.prepare("SELECT * FROM staff_accounts WHERE id = ?").get(staffId);
  assert.equal(Number(updatedStaff?.must_change_password), 0);
  assert.notEqual(updatedStaff?.salt, salt1);
  assert.equal(Number(db.prepare("SELECT COUNT(*) n FROM admin_sessions WHERE account_id = ?").get(staffId)?.n), 0);

  // Rate limiting 8 percobaan gagal
  const key = digest("kasir@cafesite.local");
  const exp = Date.now() + 900_000;
  for (let i = 0; i < 8; i++) {
    db.prepare(
      "INSERT INTO login_attempts VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1",
    ).run(key, exp);
  }
  const attempt = db.prepare("SELECT attempts, expires_at FROM login_attempts WHERE key = ?").get(key);
  assert.equal(Number(attempt?.attempts), 8);
  assert.ok(Number(attempt?.expires_at) > Date.now());
});

test("antrean aktif > 100 pesanan tidak terpotong oleh batas riwayat", () => {
  const db = testDb();
  const insert = db.prepare(
    `INSERT INTO orders (id, idempotency_key, queue_number, customer_name, phone, fulfillment, table_id, status, payment_status, total, paid_amount, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, '62811111111', 'takeaway', NULL, ?, 'unpaid', 22000, 0, 'web', ?, ?)`,
  );
  for (let i = 1; i <= 115; i++) {
    const id = randomUUID();
    const ts = new Date(Date.UTC(2026, 10, 10, 1, 0, i)).toISOString();
    const status = i % 3 === 0 ? "ready" : i % 2 === 0 ? "preparing" : "waiting";
    insert.run(id, `idem-${i}`, i, `Pelanggan ${i}`, status, ts, ts);
  }
  const activeRows = db
    .prepare("SELECT id FROM orders WHERE status IN ('waiting','preparing','ready') ORDER BY created_at ASC")
    .all();
  assert.equal(activeRows.length, 115);
});

test("laporan penjualan lintas tengah malam WIB (Asia/Jakarta), mengecualikan belum lunas & batal", () => {
  const db = testDb();
  const insertOrder = db.prepare(
    `INSERT INTO orders (id, idempotency_key, queue_number, customer_name, phone, fulfillment, table_id, status, payment_status, total, paid_amount, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, '628122233344', 'takeaway', NULL, ?, ?, ?, ?, 'web', ?, ?)`,
  );
  const insertItem = db.prepare(
    "INSERT INTO order_items (id, order_id, menu_item_id, name, unit_price, quantity, notes) VALUES (?, ?, ?, ?, ?, ?, '')",
  );

  // 1) 2026-11-10 23:30 WIB = 2026-11-10T16:30:00.000Z (Masuk tanggal 2026-11-10 WIB, lunas)
  const o1 = randomUUID();
  insertOrder.run(o1, "k1", 1, "Andi", "completed", "paid", 44000, 44000, "2026-11-10T16:20:00.000Z", "2026-11-10T16:30:00.000Z");
  db.prepare("INSERT INTO order_milestones VALUES (?, '2026-11-10T16:30:00.000Z', '2026-11-10T16:35:00.000Z', 0)").run(o1);
  insertItem.run(randomUUID(), o1, "americano", "Americano", 22000, 2);

  // 2) 2026-11-11 00:30 WIB = 2026-11-10T17:30:00.000Z (Masuk tanggal 2026-11-11 WIB, BUKAN 2026-11-10 WIB!)
  const o2 = randomUUID();
  insertOrder.run(o2, "k2", 2, "Budi", "completed", "paid", 28000, 28000, "2026-11-10T17:20:00.000Z", "2026-11-10T17:30:00.000Z");
  db.prepare("INSERT INTO order_milestones VALUES (?, '2026-11-10T17:30:00.000Z', '2026-11-10T17:35:00.000Z', 0)").run(o2);
  insertItem.run(randomUUID(), o2, "latte", "Caffe Latte", 28000, 1);

  // 3) 2026-11-10 14:00 WIB belum lunas (dikecualikan dari penjualan)
  const o3 = randomUUID();
  insertOrder.run(o3, "k3", 3, "Citra", "waiting", "unpaid", 35000, 0, "2026-11-10T07:00:00.000Z", "2026-11-10T07:00:00.000Z");

  // 4) 2026-11-10 15:00 WIB batal (dikecualikan dari penjualan)
  const o4 = randomUUID();
  insertOrder.run(o4, "k4", 4, "Dodi", "cancelled", "unpaid", 25000, 0, "2026-11-10T08:00:00.000Z", "2026-11-10T08:05:00.000Z");

  const start = new Date("2026-11-10T00:00:00+07:00").toISOString();
  const end = new Date(Date.parse("2026-11-10T00:00:00+07:00") + 86400_000).toISOString();

  const filter = "o.payment_status='paid' AND o.status<>'cancelled' AND COALESCE(m.paid_at,o.updated_at)>=? AND COALESCE(m.paid_at,o.updated_at)<?";
  const join = "orders o LEFT JOIN order_milestones m ON m.order_id=o.id";
  const totals = db
    .prepare(`SELECT COALESCE(SUM(o.paid_amount),0) revenue, COUNT(*) count FROM ${join} WHERE ${filter}`)
    .get(start, end);

  assert.equal(Number(totals?.revenue), 44000);
  assert.equal(Number(totals?.count), 1);

  const daily = db
    .prepare(`SELECT date(COALESCE(m.paid_at,o.updated_at),'+7 hours') day, SUM(o.paid_amount) revenue FROM ${join} WHERE ${filter} GROUP BY day`)
    .all(start, end);
  assert.deepEqual(daily.map((r) => ({ day: r.day, revenue: Number(r.revenue) })), [{ day: "2026-11-10", revenue: 44000 }]);
});

test("validasi konten dashboard menolak input tidak valid dan menerima data lengkap", () => {
  // Kategori menu
  assert.throws(() => validateContent("categories", []), /Minimal 1 kategori/);
  assert.throws(() => validateContent("categories", [{ id: "Kopi Spasi", name: "Kopi" }]), /huruf kecil/);
  assert.ok(validateContent("categories", [{ id: "coffee", name: "Kopi" }]));

  // Testimoni: rating 1-5 wajib
  assert.throws(
    () => validateContent("testimonials", [{ id: "t1", name: "Ari", source: "Google Maps", rating: 6, comment: "Bagus" }]),
    /Rating harus 1 sampai 5/,
  );
  assert.ok(validateContent("testimonials", [{ id: "t1", name: "Ari", source: "Google Maps", rating: 5, comment: "Kopi mantap" }]));

  // Galeri: src wajib path lokal atau https
  assert.throws(
    () =>
      validateContent("gallery", [
        { id: "g1", title: "Sudut", src: "javascript:alert(1)", alt: "Sudut", category: "interior", aspect: "landscape" },
      ]),
    /Alamat foto tidak valid/,
  );
  assert.ok(
    validateContent("gallery", [
      { id: "g1", title: "Sudut", src: "/api/media/gallery/12345678-1234-1234-1234-1234567890ab.jpg", alt: "Sudut kedai", category: "interior", aspect: "landscape" },
    ]),
  );
});

