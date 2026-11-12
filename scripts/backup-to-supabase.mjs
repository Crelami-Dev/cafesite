#!/usr/bin/env node
/**
 * Kirim cadangan penuh SQLite lokal ke Supabase (tabel cafesite_backups, satu baris per kedai).
 * Sama dengan fungsi backup di dashboard, tapi bisa dijalankan dari terminal tanpa login.
 * Tidak menyentuh tabel live yang dibaca situs publik; hanya menyimpan salinan snapshot.
 *
 *   npm run backup:supabase
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const DB_FILE = path.join(root, ".data", "cafesite.dev.db");
const TABLES = ["content", "menu_items", "floors", "cafe_tables", "orders", "order_items", "order_milestones", "staff_accounts", "staff_permissions"];

function loadEnv() {
  const env = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    const full = path.join(root, file);
    if (!existsSync(full)) continue;
    for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

async function main() {
  const env = loadEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_URL.includes("PROJECT_ID")) {
    throw new Error("Supabase belum dikonfigurasi di .env.local.");
  }
  if (!existsSync(DB_FILE)) throw new Error(`Database lokal tidak ditemukan: ${DB_FILE}`);
  const sqlite = process.getBuiltinModule("node:sqlite");
  const db = new sqlite.DatabaseSync(DB_FILE);
  db.exec("PRAGMA busy_timeout = 5000;");

  const snapshot = { version: 1 };
  const counts = [];
  for (const table of TABLES) {
    const rows = db.prepare(`SELECT * FROM ${table}`).all().filter((row) => table !== "content" || !String(row.key).startsWith("_backup"));
    snapshot[table] = rows;
    counts.push(`${table}: ${rows.length}`);
  }

  const cloud = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const id = env.SQLITE_BACKUP_ID || "local-kedai";
  const { error } = await cloud.from("cafesite_backups").upsert({ id, snapshot, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Gagal menyimpan cadangan: ${error.message}`);

  // Tandai sudah tersimpan, sama seperti flushCloudBackup di aplikasi.
  const savedAt = new Date().toISOString();
  db.prepare("DELETE FROM content WHERE key='_backup_pending'").run();
  db.prepare("INSERT INTO content(key,data) VALUES('_backup_saved',?) ON CONFLICT(key) DO UPDATE SET data=excluded.data").run(JSON.stringify(savedAt));

  console.log(`✓ Cadangan tersimpan di Supabase (id: ${id}) pada ${savedAt}`);
  console.log(`  ${counts.join(" · ")}`);
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
