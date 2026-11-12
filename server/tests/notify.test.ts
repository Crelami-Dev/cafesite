import test from "node:test";
import assert from "node:assert/strict";
import { notifyReadyOrders, readyMessage } from "../src/order/notify";
import { createCafeOrder } from "../src/order/orderApi";
import { nowIso } from "../src/db/database";
import { testDb } from "./helpers";

function makeOrder(db: ReturnType<typeof testDb>, phone: string, key: string): { id: string } {
  return createCafeOrder(db, { idempotencyKey: key, customerName: "Budi", phone, fulfillment: "takeaway", tableCode: null, cart: [{ menuItemId: "americano", name: "Americano", price: 22000, quantity: 2, notes: "" }] });
}
const setStatus = (db: ReturnType<typeof testDb>, id: string, status: string): void => { db.prepare("UPDATE orders SET status = ?, payment_status='paid',paid_amount=total, updated_at = ? WHERE id = ?").run(status, nowIso(), id); };

test("pesanan siap: pelanggan dikabari ke nomor HP yang diisi, sekali saja", async () => {
  const db = testDb();
  const order = makeOrder(db, "6281200000111", "n1");
  const sent: Array<[string, string]> = [];
  const send = async (chatId: string, text: string): Promise<void> => { sent.push([chatId, text]); };

  assert.equal(await notifyReadyOrders(db, send), 0, "belum siap: tidak ada pesan");
  setStatus(db, order.id, "preparing");
  assert.equal(await notifyReadyOrders(db, send), 0, "disiapkan: tidak ada pesan");
  setStatus(db, order.id, "ready");
  assert.equal(await notifyReadyOrders(db, send), 1);
  assert.equal(sent[0]?.[0], "6281200000111@c.us");
  assert.match(sent[0]?.[1] ?? "", /nomor antrian \*\d+\* sudah siap/);
  assert.equal(await notifyReadyOrders(db, send), 0, "tidak dikirim dua kali");
  assert.equal(sent.length, 1);
});

test("nomor 08xx dinormalkan; kirim gagal dicoba lagi lalu berhenti; pesanan lama tidak dikabari", async () => {
  const db = testDb();
  const order = makeOrder(db, "081200000222", "n2");
  setStatus(db, order.id, "ready");
  let calls = 0;
  const flaky = async (): Promise<void> => { calls += 1; throw new Error("WhatsApp belum tersambung."); };
  for (let i = 0; i < 8; i++) await notifyReadyOrders(db, flaky);
  assert.equal(calls, 5, "maksimal 5 percobaan");

  const old = testDb();
  const o = makeOrder(old, "6281200000333", "n3");
  old.prepare("UPDATE orders SET status = 'ready', payment_status='paid',paid_amount=total, updated_at = ? WHERE id = ?").run(new Date(Date.now() - 7 * 3_600_000).toISOString(), o.id);
  assert.equal(await notifyReadyOrders(old, async () => { throw new Error("tidak boleh dikirim"); }), 0);
});

test("isi pesan: bawa pulang vs dine-in bermeja, dan belum dibayar", () => {
  const base = { id: "x", queue: 7, name: "Budi", phone: "6281", total: 44000, paid: false };
  assert.match(readyMessage({ ...base, fulfillment: "takeaway", tableLabel: null }), /diambil di kasir[\s\S]*Rp44\.000/);
  assert.match(readyMessage({ ...base, fulfillment: "dine_in", tableLabel: "Meja A1", paid: true }), /Meja A1/);
});
