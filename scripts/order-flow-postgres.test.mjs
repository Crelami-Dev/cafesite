// Test-only PostgreSQL runtime: npm install --prefix .vercel/pg-check --no-save @electric-sql/pglite
import { PGlite } from "../.vercel/pg-check/node_modules/@electric-sql/pglite/dist/index.js";
import fs from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
const db = new PGlite();
const base = fs.readFileSync(new URL("../supabase/01_schema.sql",import.meta.url),"utf8");
const dashboard = fs.readFileSync(new URL("../supabase/08_cloud_dashboard.sql",import.meta.url),"utf8");
const migration = fs.readFileSync(new URL("../supabase/12_customer_order_flow.sql",import.meta.url),"utf8");
await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key);");
await db.exec(base.slice(base.indexOf("create table if not exists public.menu_items"),base.indexOf("create table if not exists public.order_requests")));
await db.exec("alter table orders alter column user_id drop not null; alter table orders add column source text default 'website'; create table order_milestones(order_id uuid primary key,paid_at timestamptz,completed_at timestamptz,estimated integer default 0);");
await db.exec(dashboard.slice(dashboard.indexOf("create or replace function public.cafesite_order_document"),dashboard.indexOf("create or replace function public.cafesite_update_order")));
await db.exec(migration);
await db.exec(migration);
const floor = (await db.query("insert into floors(name) values('Test floor') returning id")).rows[0].id;
await db.query("insert into cafe_tables(id,floor_id,label,order_mode) values('A1',$1,'Meja A1','dine_in'),('TKW-01',$1,'Bawa pulang','takeaway')",[floor]);
await db.query("insert into menu_items(id,data) values('coffee',$1::jsonb)",[JSON.stringify({name:"Test coffee",price:22000,category:"coffee"})]);
async function rpc(name,input) { return (await db.query(`select public.${name}($1::jsonb) result`,[JSON.stringify(input)])).rows[0].result; }
let phone = 820000000;
async function order(source="A1") {
  const hash = randomUUID(), payload={ customerName:"Test",phone:String(++phone),idempotencyKey:randomUUID(),tableCode:"FORGED",fulfillment:"takeaway",items:[{menuItemId:"coffee",quantity:1,notes:""}],ticketHash:hash,browserHash:"browser",payloadHash:hash };
  await db.query("insert into order_scan_tickets(token_hash,browser_hash,source_id,expires_at) values($1,'browser',$2,now()+interval '15 minutes')",[hash,source]);
  return {payload,result:await rpc("cafesite_checkout",payload)};
}
test("PostgreSQL: migration repeats, canonical QR mode, multiple orders per table, one-use ticket", async () => {
  const first=await order(),second=await order();
  assert.equal(first.result.fulfillment,"dine_in");assert.equal(first.result.table_id,"A1");assert.notEqual(first.result.id,second.result.id);
  assert.equal((await rpc("cafesite_checkout",first.payload)).id,first.result.id);
  await assert.rejects(rpc("cafesite_checkout",{...first.payload,idempotencyKey:randomUUID()}),/Scan QR baru/);
  await assert.rejects(rpc("cafesite_checkout",{...first.payload,browserHash:"other"}),/browser ini/);
  const takeaway=await order("TKW-01");assert.equal(takeaway.result.fulfillment,"takeaway");assert.equal(takeaway.result.table_id,null);
});
test("PostgreSQL: edit/payment race, paid status guards and no duplicate payment", async () => {
  const {result:before}=await order("TKW-01");
  await assert.rejects(rpc("cafesite_update_order",{id:before.id,status:"preparing",expectedUpdatedAt:before.updated_at}),/pembayaran/);
  const edited=await rpc("cafesite_edit_customer_order",{id:before.id,expectedUpdatedAt:before.updated_at,items:[{menuItemId:"coffee",quantity:2,notes:""}]});
  assert.equal(edited.total,44000);
  await assert.rejects(rpc("cafesite_update_order",{id:before.id,status:"preparing",markPaid:true,expectedUpdatedAt:before.updated_at}),/diperbarui/);
  const paid=(await rpc("cafesite_update_order",{id:before.id,status:"preparing",markPaid:true,expectedUpdatedAt:edited.updated_at})).order;
  assert.equal(paid.payment_status,"paid");assert.equal(paid.paid_amount,44000);
  await assert.rejects(rpc("cafesite_update_order",{id:paid.id,markPaid:true,expectedUpdatedAt:paid.updated_at}),/sudah dikonfirmasi/);
  await assert.rejects(rpc("cafesite_edit_customer_order",{id:paid.id,expectedUpdatedAt:paid.updated_at,items:[{menuItemId:"coffee",quantity:3,notes:""}]}),/berubah atau dibayar/);
});
test("PostgreSQL: closing one order leaves shared table occupied until its last active order closes", async () => {
  const active=(await db.query("select id,updated_at from orders where table_id='A1' and status='waiting' order by created_at")).rows;
  const first=active[0];
  await rpc("cafesite_update_order",{id:first.id,status:"cancelled",expectedUpdatedAt:first.updated_at});
  assert.equal((await db.query("select status from cafe_tables where id='A1'")).rows[0].status,"occupied");
  for(const value of active.slice(1))await rpc("cafesite_update_order",{id:value.id,status:"cancelled",expectedUpdatedAt:value.updated_at});
  assert.equal((await db.query("select status from cafe_tables where id='A1'")).rows[0].status,"dirty");
});
test("PostgreSQL: anonymous users cannot read scan grants or call checkout/edit RPCs", async () => {
  await db.exec("set role anon");
  await assert.rejects(db.query("select * from order_scan_tickets"), /permission denied/);
  await assert.rejects(rpc("cafesite_checkout", {}), /permission denied/);
  await assert.rejects(rpc("cafesite_edit_customer_order", {}), /permission denied/);
  await db.exec("reset role");
});
test.after(async()=>{await db.close();});
