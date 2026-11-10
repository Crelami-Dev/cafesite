import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createCafeOrder, OrderError } from "../src/order/orderApi";
import { testDb } from "./helpers";

const line = (menuItemId: string, quantity: number) => ({ menuItemId, name: "ignored", price: 1, quantity, notes: "" });
const base = { customerName: "Budi", phone: "628123456789", fulfillment: "takeaway" as const, tableCode: null };

test("harga dihitung dari menu_items, bukan dari keranjang sesi", () => {
  const db = testDb();
  const order = createCafeOrder(db, { ...base, idempotencyKey: randomUUID(), cart: [line("americano", 2), line("nasi-goreng", 1)] });
  assert.equal(order.total, 22000 * 2 + 35000);
  assert.equal(order.queue_number, 1);
  assert.equal(order.payment_status, "unpaid");
  assert.deepEqual(order.items.map((i) => i.name), ["Americano", "Nasi Goreng"]);
});

test("idempotency key yang sama mengembalikan pesanan yang sama", () => {
  const db = testDb();
  const key = randomUUID();
  const a = createCafeOrder(db, { ...base, idempotencyKey: key, cart: [line("americano", 1)] });
  const b = createCafeOrder(db, { ...base, idempotencyKey: key, cart: [line("americano", 1)] });
  assert.equal(a.id, b.id);
  assert.equal(Number(db.prepare("SELECT COUNT(*) AS n FROM orders").get()?.n), 1);
});

test("nomor antrian naik, menu habis ditolak, rollback tidak meninggalkan pesanan", () => {
  const db = testDb();
  createCafeOrder(db, { ...base, idempotencyKey: randomUUID(), cart: [line("americano", 1)] });
  assert.throws(() => createCafeOrder(db, { ...base, idempotencyKey: randomUUID(), cart: [line("americano", 1), line("cheesecake", 1)] }), OrderError);
  assert.throws(() => createCafeOrder(db, { ...base, idempotencyKey: randomUUID(), cart: [line("tidak-ada", 1)] }), OrderError);
  assert.equal(Number(db.prepare("SELECT COUNT(*) AS n FROM orders").get()?.n), 1);
  assert.equal(createCafeOrder(db, { ...base, idempotencyKey: randomUUID(), cart: [line("latte", 1)] }).queue_number, 2);
});

test("dine-in: meja harus available, lalu berubah occupied", () => {
  const db = testDb();
  const dine = { ...base, fulfillment: "dine_in" as const };
  assert.throws(() => createCafeOrder(db, { ...dine, tableCode: "A2", idempotencyKey: randomUUID(), cart: [line("latte", 1)] }), /Meja tidak tersedia/);
  assert.throws(() => createCafeOrder(db, { ...dine, tableCode: "XX", idempotencyKey: randomUUID(), cart: [line("latte", 1)] }), /Meja tidak tersedia/);
  const order = createCafeOrder(db, { ...dine, tableCode: "A1", idempotencyKey: randomUUID(), cart: [line("latte", 1)] });
  assert.equal(order.table_id, "A1");
  assert.equal(db.prepare("SELECT status FROM cafe_tables WHERE id='A1'").get()?.status, "occupied");
  assert.throws(() => createCafeOrder(db, { ...dine, tableCode: "A1", idempotencyKey: randomUUID(), cart: [line("latte", 1)] }), /Meja tidak tersedia/);
});

test("validasi input dan batas 5 pesanan per 10 menit per nomor", () => {
  const db = testDb();
  assert.throws(() => createCafeOrder(db, { ...base, customerName: "B", idempotencyKey: randomUUID(), cart: [line("latte", 1)] }), /Nama/);
  assert.throws(() => createCafeOrder(db, { ...base, phone: "abc", idempotencyKey: randomUUID(), cart: [line("latte", 1)] }), /Nomor HP/);
  assert.throws(() => createCafeOrder(db, { ...base, idempotencyKey: randomUUID(), cart: [line("latte", 21)] }), /tidak valid/);
  for (let i = 0; i < 5; i += 1) createCafeOrder(db, { ...base, idempotencyKey: randomUUID(), cart: [line("latte", 1)] });
  assert.throws(() => createCafeOrder(db, { ...base, idempotencyKey: randomUUID(), cart: [line("latte", 1)] }), /Terlalu banyak/);
});
