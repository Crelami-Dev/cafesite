// Dedicated local fixture only; never points at the real cafe database or Supabase.
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";
const file = ".data/order-flow-e2e.db";
fs.mkdirSync(".data", { recursive: true }); fs.mkdirSync(".vercel", { recursive: true });
const db = new DatabaseSync(file);
const source = fs.readFileSync("src/lib/db/dev-sqlite.ts", "utf8");
db.exec(source.match(/export const SCHEMA_SQL = `([\s\S]*?)`;/)[1]);
if (!db.prepare("pragma table_info(cafe_tables)").all().some(row => row.name === "order_mode")) db.exec("alter table cafe_tables add column order_mode text not null default 'dine_in'");
if (!db.prepare("pragma table_info(staff_accounts)").all().some(row => row.name === "role")) db.exec("alter table staff_accounts add column role text not null default 'staff'");
db.exec("insert or ignore into floors values('test-floor','Test floor',0); insert or ignore into cafe_tables(id,floor_id,label,order_mode) values('TEST-A1','test-floor','Meja test A1','dine_in'),('TKW-01','test-floor','Bawa pulang','takeaway');");
const password = randomBytes(20).toString("base64url"), salt = randomBytes(16).toString("hex");
db.prepare("insert into staff_accounts(id,name,email,password_hash,salt,role,enabled,must_change_password,created_at) values('test-admin','Test admin','test-admin@cafesite.example',?,?,'admin',1,0,?) on conflict(id) do update set password_hash=excluded.password_hash,salt=excluded.salt").run(scryptSync(password, salt, 64).toString("hex"), salt, new Date().toISOString());
fs.writeFileSync(".vercel/order-flow-e2e.json", JSON.stringify({ password, email: "test-admin@cafesite.example", db: file }));
db.close(); console.log("Isolated local test fixture ready; credentials remain in ignored .vercel directory.");
