import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import ts from "typescript";
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "src/lib/db/dev-sqlite.ts"), "utf8");
const db = new DatabaseSync(":memory:");
db.exec(source.match(/export const SCHEMA_SQL = `([\s\S]*?)`;/)[1]);
db.exec("ALTER TABLE cafe_tables ADD COLUMN order_mode TEXT NOT NULL DEFAULT 'dine_in'; INSERT INTO floors VALUES('f','Test',0); INSERT INTO cafe_tables(id,floor_id,label,order_mode) VALUES('A1','f','Meja A1','dine_in'),('TKW-01','f','Takeaway','takeaway');");
db.prepare("INSERT INTO menu_items(id,data) VALUES(?,?)").run("coffee", JSON.stringify({ name: "Test coffee", price: 22000, category: "coffee" }));
const cookie = new Map();
const modules = new Map();
function load(filename) {
  const file = path.resolve(root, filename);
  const normalized = file.replaceAll("\\", "/");
  if (modules.has(file)) return modules.get(file);
  if (normalized.endsWith("src/lib/db/dev-sqlite.ts")) return { getLocalDb: () => db };
  if (normalized.endsWith("src/lib/server/cloud-sync.ts")) return { mirrorOrderToSupabase() {}, mirrorWriteToSupabase() {}, mirrorDeleteToSupabase() {} };
  if (normalized.endsWith("src/lib/server/cloud-db.ts")) return {};
  const exports = {}; modules.set(file, exports);
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  vm.runInNewContext(compiled, {
    exports, Buffer, console, process: { ...process, env: { ...process.env, CONTENT_SOURCE: "sqlite", VERCEL: "0", ORDER_ACCESS_SECRET: "local-test-secret-never-use-in-production" } },
    require(name) {
      if (name === "server-only") return {};
      if (name === "next/headers") return { cookies: async () => ({ get: key => cookie.has(key) ? { value: cookie.get(key) } : undefined, set: (key,value) => cookie.set(key,value) }) };
      if (name.startsWith("@/")) return load("src/" + name.slice(2) + ".ts");
      if (name.startsWith(".")) return load(path.relative(root,path.resolve(path.dirname(file),name + ".ts")));
      return require(name);
    },
  }, { filename: file });
  return exports;
}
const tickets = load("src/lib/server/order-tickets.ts"), security = load("src/lib/server/order-security.ts"), local = load("src/lib/server/local-orders.ts"), customer = load("src/lib/server/customer-orders.ts"), admin = load("src/lib/server/local-admin.ts");
let phone = 810000000;
async function create(source = "A1", overrides = {}) {
  const grant = await tickets.issueScanGrant(source,security.tableKey(source));
  const browser = await tickets.scanBrowserHash();
  const payload = { scanTicket: grant.ticket, customerName: "Test", phone: String(++phone), paymentMethod: "cod", idempotencyKey: randomUUID(), items: [{ menuItemId: "coffee", quantity: 1, notes: "" }], ...overrides };
  return { grant, browser, payload, result: await local.createLocalOrder(payload,browser) };
}
test("QR mode is authoritative, shared table orders stay independent, owner token is required", async () => {
  const first = await create("A1", { fulfillment: "takeaway" });
  const second = await create("A1");
  assert.equal(first.result.order.fulfillment,"dine_in"); assert.notEqual(first.result.order.id,second.result.order.id);
  assert.equal(first.result.order.table_id,"A1");
  assert.throws(() => local.readLocalOrder(first.result.order.id,second.result.accessToken),/browser ini/);
  const takeaway = await create("TKW-01",{ fulfillment: "dine_in" });
  assert.equal(takeaway.result.order.fulfillment,"takeaway"); assert.equal(takeaway.result.order.table_id,null);
});
test("one scan grants one order; same retry is idempotent, other browser/expired tickets rejected", async () => {
  const attempt = await create("TKW-01");
  assert.equal((await local.createLocalOrder(attempt.payload,attempt.browser)).order.id,attempt.result.order.id);
  await assert.rejects(local.createLocalOrder({ ...attempt.payload,idempotencyKey:randomUUID() },attempt.browser),/Scan QR baru/);
  await assert.rejects(local.createLocalOrder(attempt.payload,"another-browser"),/browser ini/);
  const grant = await tickets.issueScanGrant("TKW-01",security.tableKey("TKW-01"));
  db.prepare("UPDATE order_scan_tickets SET expires_at=? WHERE token_hash=?").run("2000-01-01T00:00:00Z",security.digestValue(grant.ticket));
  await assert.rejects(local.createLocalOrder({ ...attempt.payload,scanTicket:grant.ticket },attempt.browser),/kedaluwarsa/);
});
test("unpaid edit recalculates total, rejects stale cashier total, atomic paid-and-process locks edits", async () => {
  const { result } = await create("TKW-01");
  const before = result.order;
  assert.throws(() => admin.updateLocalOrder({ id:before.id,status:"preparing",expectedUpdatedAt:before.updated_at }),/pembayaran/);
  assert.throws(() => db.prepare("UPDATE orders SET status='ready' WHERE id=?").run(before.id),/pembayaran/);
  const edited = await customer.editCustomerOrder(before.id,result.accessToken,{ expectedUpdatedAt:before.updated_at,items:[{menuItemId:"coffee",quantity:2,notes:"less ice"}] });
  assert.equal(edited.order.total,44000);
  assert.throws(() => admin.updateLocalOrder({id:before.id,status:"preparing",markPaid:true,expectedUpdatedAt:before.updated_at}),/diperbarui/);
  admin.updateLocalOrder({id:before.id,status:"preparing",markPaid:true,expectedUpdatedAt:edited.order.updated_at});
  const paid = local.readLocalOrder(before.id,result.accessToken);
  assert.equal(paid.payment_status,"paid"); assert.equal(paid.paid_amount,44000); assert.equal(paid.status,"preparing");
  await assert.rejects(customer.editCustomerOrder(before.id,result.accessToken,{ expectedUpdatedAt:paid.updated_at,items:[{menuItemId:"coffee",quantity:3,notes:""}] }),/berubah atau dibayar/);
  assert.throws(() => admin.updateLocalOrder({id:before.id,markPaid:true,expectedUpdatedAt:paid.updated_at}),/sudah dikonfirmasi/);
});
test("cashier proof is purpose-separated from customer token", async () => {
  const { result } = await create("TKW-01");
  const proof = security.cashierQr(result.order.id);
  assert.equal(security.cashierOrderId(proof),result.order.id);
  assert.equal(proof.includes(result.accessToken),false);
  assert.throws(() => security.cashierOrderId(proof.slice(0,-1)+"!"),/tidak valid/);
});
test("shared table closes only after its last active order", async () => {
  db.exec("INSERT INTO cafe_tables(id,floor_id,label,order_mode) VALUES('A2','f','Meja A2','dine_in')");
  const first = (await create("A2")).result, second = (await create("A2")).result;
  admin.updateLocalOrder({ id: first.order.id, status: "cancelled", expectedUpdatedAt: first.order.updated_at });
  assert.equal(db.prepare("SELECT status FROM cafe_tables WHERE id='A2'").get().status, "occupied");
  admin.updateLocalOrder({ id: second.order.id, status: "cancelled", expectedUpdatedAt: second.order.updated_at });
  assert.equal(db.prepare("SELECT status FROM cafe_tables WHERE id='A2'").get().status, "dirty");
});
