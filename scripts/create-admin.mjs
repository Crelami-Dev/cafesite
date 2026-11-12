#!/usr/bin/env node
/**
 * Kelola akun dashboard LANGSUNG di database (bukan .env).
 *
 *   npm run admin:create -- --email admin@kedai.id --name "Nama Admin"
 *       Buat/ubah admin di SQLite lokal DAN Supabase. Tanpa --password, kata sandi acak dibuat
 *       dan dicetak sekali (wajib diganti saat login pertama).
 *   npm run admin:create -- --email ... --password "kata-sandi-12+karakter"
 *   npm run admin:create -- --email ... --sql
 *       Hanya MENCETAK kode SQL untuk ditempel di Supabase SQL Editor (tidak menulis apa pun).
 *   npm run admin:create -- --pull
 *       Salin semua akun dari Supabase ke SQLite lokal (tanpa perlu tahu kata sandinya).
 *   npm run admin:create -- --push
 *       Kirim semua akun SQLite ke Supabase (tabel akun + Authentication → Users).
 *
 * Opsi: --role admin|staff (default admin) · --local-only · --cloud-only
 * Kata sandi tidak pernah disimpan polos; yang disimpan hash scrypt + salt (sama dengan dashboard).
 */
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const MODULES = ["orders", "menu", "tables", "wa_bot", "cafe", "gallery", "testimonials", "faq", "location", "reports"];
const root = process.cwd();
const DB_FILE = path.join(root, ".data", "cafesite.dev.db");

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const next = process.argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
}

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

const hash = (password, salt) => scryptSync(password, salt, 64).toString("hex");
const sq = (v) => `'${String(v).replace(/'/g, "''")}'`;

function randomPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(18);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** Cerminkan akun ke Supabase Authentication (Authentication → Users). Login tetap dari tabel staff_accounts. */
async function syncAuthUser(cloud, { email, name, role, enabled, password }) {
  const metadata = { name, role, source: "cafesite-dashboard" };
  const ban_duration = enabled ? "none" : "876000h";
  let existingId = null;
  for (let page = 1; page <= 10 && !existingId; page += 1) {
    const { data, error } = await cloud.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    existingId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    if (data.users.length < 200) break;
  }
  if (existingId) {
    const { error } = await cloud.auth.admin.updateUserById(existingId, { user_metadata: metadata, ban_duration, ...(password ? { password } : {}) });
    if (error) throw error;
    return "diperbarui";
  }
  const { error } = await cloud.auth.admin.createUser({
    email, password: password ?? randomBytes(24).toString("base64url"), email_confirm: true, user_metadata: metadata,
    ...(enabled ? {} : { ban_duration }),
  });
  if (error) throw error;
  return "dibuat";
}

function openLocal() {
  const sqlite = process.getBuiltinModule("node:sqlite");
  if (!sqlite) throw new Error("node:sqlite tidak tersedia (butuh Node 22.5+).");
  mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const db = new sqlite.DatabaseSync(DB_FILE);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_accounts (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL, salt TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS staff_permissions (
      account_id TEXT NOT NULL REFERENCES staff_accounts(id) ON DELETE CASCADE,
      module TEXT NOT NULL, PRIMARY KEY(account_id, module)
    );
  `);
  if (!db.prepare("PRAGMA table_info(staff_accounts)").all().some((c) => c.name === "role")) {
    db.exec("ALTER TABLE staff_accounts ADD COLUMN role TEXT NOT NULL DEFAULT 'staff'");
  }
  return db;
}

function upsertLocal(db, a) {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      `INSERT INTO staff_accounts(id,name,email,password_hash,salt,enabled,must_change_password,role,created_at)
       VALUES(?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,password_hash=excluded.password_hash,
         salt=excluded.salt,enabled=excluded.enabled,must_change_password=excluded.must_change_password,role=excluded.role`,
    ).run(a.id, a.name, a.email, a.password_hash, a.salt, a.enabled, a.must_change_password, a.role, a.created_at);
    db.prepare("DELETE FROM staff_permissions WHERE account_id=?").run(a.id);
    for (const m of a.modules) db.prepare("INSERT INTO staff_permissions VALUES(?,?)").run(a.id, m);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

async function main() {
  const env = loadEnv();
  const cloudUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const cloudKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const cloudReady = Boolean(cloudUrl && cloudKey && !cloudUrl.includes("PROJECT_ID"));
  const cloud = cloudReady ? createClient(cloudUrl, cloudKey, { auth: { persistSession: false } }) : null;
  const localOnly = arg("local-only") === true;
  const cloudOnly = arg("cloud-only") === true;

  // --- Salin akun dari Supabase ke SQLite ---
  if (arg("pull")) {
    if (!cloud) throw new Error("Supabase belum dikonfigurasi di .env.local (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    let r = await cloud.from("staff_accounts").select("id,name,email,password_hash,salt,enabled,must_change_password,role,created_at,staff_permissions(module)");
    if (r.error?.code === "42703") {
      r = await cloud.from("staff_accounts").select("id,name,email,password_hash,salt,enabled,must_change_password,created_at,staff_permissions(module)");
    }
    if (r.error) throw new Error(`Gagal membaca Supabase: ${r.error.message}`);
    const db = openLocal();
    let count = 0;
    for (const row of r.data ?? []) {
      const role = row.role === "admin" ? "admin" : "staff";
      upsertLocal(db, {
        id: row.id, name: row.name, email: String(row.email).toLowerCase(), password_hash: row.password_hash, salt: row.salt,
        enabled: row.enabled ? 1 : 0, must_change_password: row.must_change_password ? 1 : 0, role, created_at: row.created_at,
        modules: role === "admin" ? MODULES : (row.staff_permissions ?? []).map((p) => p.module),
      });
      console.log(`  ✓ ${row.email} (${role})`);
      count += 1;
    }
    console.log(`Selesai: ${count} akun disalin dari Supabase ke SQLite.`);
    return;
  }

  // --- Kirim semua akun SQLite ke Supabase (tabel akun + Authentication) ---
  if (arg("push")) {
    if (!cloud) throw new Error("Supabase belum dikonfigurasi di .env.local.");
    const db = openLocal();
    const rows = db.prepare("SELECT * FROM staff_accounts").all();
    for (const row of rows) {
      const modules = db.prepare("SELECT module FROM staff_permissions WHERE account_id=?").all(row.id).map((p) => String(p.module));
      const { error } = await cloud.rpc("cafesite_save_staff", {
        input: { id: row.id, name: row.name, email: String(row.email).toLowerCase(), salt: row.salt, password_hash: row.password_hash, enabled: Number(row.enabled) === 1 ? 1 : 0, must_change_password: Number(row.must_change_password) === 1 ? 1 : 0, role: row.role === "admin" ? "admin" : "staff", created_at: row.created_at },
        permissions: modules,
        revoke_sessions: false,
      });
      if (error) {
        console.log(`  ✗ ${row.email}: ${error.message}`);
        continue;
      }
      let authNote = "";
      try {
        authNote = `Authentication ${await syncAuthUser(cloud, { email: String(row.email).toLowerCase(), name: row.name, role: row.role === "admin" ? "admin" : "staff", enabled: Number(row.enabled) === 1 })}`;
      } catch (e) {
        authNote = `Authentication GAGAL (${e instanceof Error ? e.message : e})`;
      }
      console.log(`  ✓ ${row.email} (${row.role}) → tabel akun Supabase · ${authNote}`);
    }
    console.log(`Selesai: ${rows.length} akun dikirim ke Supabase.`);
    return;
  }

  // --- Buat / ubah satu akun ---
  const email = String(arg("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Isi --email yang valid, mis. --email admin@kedai.id");
  const name = String(arg("name") && arg("name") !== true ? arg("name") : "Administrator").trim().slice(0, 80);
  const role = arg("role") === "staff" ? "staff" : "admin";
  let password = typeof arg("password") === "string" ? arg("password") : "";
  const generated = !password;
  if (generated) password = randomPassword();
  if (password.length < 12 || password.length > 128) throw new Error("Kata sandi harus 12–128 karakter.");

  const salt = randomBytes(16).toString("hex");
  const account = {
    id: randomUUID(), name, email, password_hash: hash(password, salt), salt, enabled: 1,
    must_change_password: generated ? 1 : 0, role, created_at: new Date().toISOString(), modules: role === "admin" ? MODULES : [],
  };

  if (arg("sql")) {
    const modules = account.modules.map((m) => `  (${sq(account.id)}, ${sq(m)})`).join(",\n");
    console.log(`-- Jalankan di Supabase SQL Editor (butuh supabase/09_staff_roles.sql sudah dijalankan).
begin;

insert into public.staff_accounts (id, name, email, password_hash, salt, enabled, must_change_password, role, created_at)
values (${sq(account.id)}, ${sq(name)}, ${sq(email)},
  ${sq(account.password_hash)},
  ${sq(salt)},
  1, ${account.must_change_password}, ${sq(role)}, now())
on conflict (email) do update set
  name = excluded.name, password_hash = excluded.password_hash, salt = excluded.salt,
  enabled = 1, must_change_password = excluded.must_change_password, role = excluded.role;
${modules ? `
delete from public.staff_permissions where account_id = (select id from public.staff_accounts where email = ${sq(email)});
insert into public.staff_permissions (account_id, module)
select id, m from public.staff_accounts, unnest(array[${MODULES.map(sq).join(", ")}]) as m
where email = ${sq(email)};
` : ""}
commit;`);
    if (generated) console.error(`\nKata sandi sementara (catat, tidak disimpan di mana pun): ${password}`);
    return;
  }

  // Pakai id yang sudah ada bila email itu sudah terdaftar (di mana pun), agar tidak dobel.
  const db = cloudOnly ? null : openLocal();
  if (db) {
    const row = db.prepare("SELECT id FROM staff_accounts WHERE email=? COLLATE NOCASE").get(email);
    if (row) account.id = String(row.id);
  }
  if (cloud && !localOnly) {
    const found = await cloud.from("staff_accounts").select("id").eq("email", email).maybeSingle();
    if (found.data?.id) account.id = found.data.id;
  }

  const done = [];
  if (db) {
    upsertLocal(db, account);
    done.push("SQLite lokal");
  }
  if (!localOnly) {
    if (!cloud) {
      console.warn("! Supabase belum dikonfigurasi, akun hanya disimpan di SQLite.");
    } else {
      const { error } = await cloud.rpc("cafesite_save_staff", {
        input: { id: account.id, name, email, salt, password_hash: account.password_hash, enabled: 1, must_change_password: account.must_change_password, role, created_at: account.created_at },
        permissions: account.modules,
        revoke_sessions: true,
      });
      if (error) throw new Error(`Gagal menyimpan ke Supabase: ${error.message}${error.code === "42703" ? " (jalankan supabase/09_staff_roles.sql dulu)" : ""}`);
      done.push("Supabase");
      try {
        await syncAuthUser(cloud, { email, name, role, enabled: true, password });
        done.push("Supabase Authentication");
      } catch (e) {
        console.warn(`! Gagal menyalin ke Supabase Authentication: ${e instanceof Error ? e.message : e}`);
      }
    }
  }
  console.log(`✓ Akun ${role} ${email} tersimpan di: ${done.join(" + ")}`);
  if (generated) console.log(`  Kata sandi sementara (tampil sekali, wajib diganti saat login): ${password}`);
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
