import "server-only";
import {isCloudPrimaryEnv} from "./storage-mode";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { DatabaseSync } from "node:sqlite";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { getServiceSupabase } from "@/lib/supabase/server";
import { HttpError, textValue } from "./validation";
import type { DashboardAccount, StaffAccount, StaffCloudState, StaffRole } from "@/types";

export const SESSION_COOKIE = "cafesite_local_admin";
export const MODULE_IDS = ["orders", "menu", "tables", "wa_bot", "cafe", "gallery", "testimonials", "faq", "location", "reports"] as const;
const digest = (value: string): string => createHash("sha256").update(value).digest("hex");
const equal = (a: string, b: string): boolean => {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
export function passwordHash(password: string, salt: string): string { return scryptSync(password, salt, 64).toString("hex"); }
const ownerVersion = (): string => digest(`${process.env.LOCAL_ADMIN_EMAIL}:${process.env.LOCAL_ADMIN_PASSWORD}`);
const roleOf = (value: unknown): StaffRole => (value === "admin" ? "admin" : "staff");
const allModules = (): { id: string; enabled: boolean }[] => MODULE_IDS.map(id => ({ id, enabled: true }));

export async function dashboardAccount(): Promise<DashboardAccount | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  if (isCloudPrimaryEnv()) {
    try {
      return await (await import("./cloud-auth")).cloudAccount(token);
    } catch (err) {
      console.error("[dashboardAccount] Cloud account lookup failed:", err);
      return null;
    }
  }
  const db = getLocalDb();
  const session = db.prepare("SELECT * FROM admin_sessions WHERE token_hash=? AND expires_at>?").get(digest(token), Date.now());
  if (!session) return null;
  if (session.account_id === "owner") {
    if (!process.env.LOCAL_ADMIN_PASSWORD || session.owner_version !== ownerVersion()) return null;
    return { profile: { id: "owner", role: "admin", name: "Pemilik kedai", email: process.env.LOCAL_ADMIN_EMAIL ?? "" }, modules: allModules(), mustChangePassword: false };
  }
  const row = db.prepare("SELECT id,name,email,must_change_password,role FROM staff_accounts WHERE id=? AND enabled=1").get(String(session.account_id));
  if (!row) return null;
  const role = roleOf(row.role);
  return { profile: { id: String(row.id), role, name: String(row.name), email: String(row.email) }, modules: role === "admin" ? allModules() : db.prepare("SELECT module FROM staff_permissions WHERE account_id=?").all(String(row.id)).map(p => ({ id: String(p.module), enabled: true })), mustChangePassword: Boolean(row.must_change_password) };
}

/** Salin akun Supabase yang baru berhasil login ke SQLite lokal agar sesi lokal bisa memakainya. */
function adoptRemoteAccount(db: DatabaseSync, remote: import("./cloud-auth").CloudLoginAccount): string {
  if (db.prepare("SELECT id FROM staff_accounts WHERE email=? COLLATE NOCASE AND id<>?").get(remote.email, remote.id)) return "";
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO staff_accounts(id,name,email,password_hash,salt,enabled,must_change_password,role,created_at) VALUES(?,?,?,?,?,1,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,password_hash=excluded.password_hash,salt=excluded.salt,enabled=1,must_change_password=excluded.must_change_password,role=excluded.role")
      .run(remote.id, remote.name, remote.email, remote.passwordHash, remote.salt, remote.mustChange ? 1 : 0, remote.role, remote.createdAt);
    db.prepare("DELETE FROM staff_permissions WHERE account_id=?").run(remote.id);
    for (const mod of new Set(remote.modules)) db.prepare("INSERT INTO staff_permissions VALUES(?,?)").run(remote.id, mod);
    db.exec("COMMIT");
  } catch {
    db.exec("ROLLBACK");
    return "";
  }
  return remote.id;
}

export async function authenticate(email: string, password: string): Promise<string> {
  if (isCloudPrimaryEnv()) return (await import("./cloud-auth")).cloudAuthenticate(email,password);
  const db = getLocalDb();
  const normalized = email.trim().toLowerCase();
  const key = digest(normalized);
  const attempt = db.prepare("SELECT attempts,expires_at FROM login_attempts WHERE key=?").get(key);
  if (attempt && Number(attempt.expires_at) > Date.now() && Number(attempt.attempts) >= 8) throw new HttpError(429, "Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
  let id = "";
  const owner = process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase();
  if (owner && process.env.LOCAL_ADMIN_PASSWORD && equal(normalized, owner) && equal(password, process.env.LOCAL_ADMIN_PASSWORD)) id = "owner";
  else {
    const row = db.prepare("SELECT * FROM staff_accounts WHERE email=? COLLATE NOCASE AND enabled=1").get(normalized);
    const hash = passwordHash(password, row ? String(row.salt) : "cafesite-invalid-login");
    if (row && equal(hash, String(row.password_hash))) id = String(row.id);
  }
  // Mode lokal juga menerima akun yang dibuat di Supabase (mis. dibuat dari situs publik).
  if (!id && getServiceSupabase()) {
    const remote = await (await import("./cloud-auth")).cloudFindStaffForLogin(normalized, password);
    if (remote) id = adoptRemoteAccount(db, remote);
  }
  if (!id) {
    db.prepare("INSERT INTO login_attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires_at<? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<? THEN excluded.expires_at ELSE expires_at END").run(key, Date.now()+900000, Date.now(), Date.now());
    throw new HttpError(401, "Email atau kata sandi tidak cocok.");
  }
  db.prepare("DELETE FROM login_attempts WHERE key=?").run(key);
  db.prepare("DELETE FROM admin_sessions WHERE expires_at<=?").run(Date.now());
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT OR REPLACE INTO admin_sessions VALUES(?,?,?,?)").run(digest(token), id, Date.now()+8*3600000, id === "owner" ? ownerVersion() : null);
  return token;
}
export async function revokeCurrentSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token && isCloudPrimaryEnv()) return (await import("./cloud-auth")).cloudRevoke(token);
  if (token) getLocalDb().prepare("DELETE FROM admin_sessions WHERE token_hash=?").run(digest(token));
}
export async function staffList(): Promise<StaffAccount[]> {
  if (isCloudPrimaryEnv()) return (await import("./cloud-auth")).cloudStaffList();
  const db = getLocalDb();
  return db.prepare("SELECT id,name,email,enabled,must_change_password,role FROM staff_accounts ORDER BY name").all().map(row => ({ id: String(row.id), name: String(row.name), email: String(row.email), role: roleOf(row.role), enabled: Boolean(row.enabled), mustChangePassword: Boolean(row.must_change_password), modules: db.prepare("SELECT module FROM staff_permissions WHERE account_id=?").all(String(row.id)).map(p => String(p.module)) }));
}
/**
 * Simpan akun staf/admin. Mode lokal: tulis ke SQLite lalu langsung salin ke Supabase (bila terhubung);
 * `cloud` memberi tahu hasil salinannya. Mode cloud: langsung ke Supabase.
 */
export async function saveStaff(body: Record<string, unknown>, actorId?: string): Promise<{ temporaryPassword?: string; cloud: StaffCloudState }> {
  if (isCloudPrimaryEnv()) return { ...(await (await import("./cloud-auth")).cloudSaveStaff(body, actorId)), cloud: "saved" };
  const db = getLocalDb(); const id = body.id ? textValue(body.id, "Akun", 80) : randomUUID();
  const existing = db.prepare("SELECT * FROM staff_accounts WHERE id=?").get(id);
  if (body.id && !existing) throw new HttpError(404, "Akun tidak ditemukan.");
  const name = textValue(body.name, "Nama", 80); const email = textValue(body.email, "Email", 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === process.env.LOCAL_ADMIN_EMAIL?.toLowerCase()) throw new HttpError(400, "Email tidak valid atau sudah digunakan pemilik.");
  if (db.prepare("SELECT id FROM staff_accounts WHERE email=? COLLATE NOCASE AND id<>?").get(email,id)) throw new HttpError(409,"Email sudah digunakan.");
  const role: StaffRole = body.role === "admin" ? "admin" : "staff";
  if (actorId && id === actorId && (role !== "admin" || body.enabled === false)) throw new HttpError(400, "Anda tidak bisa menurunkan atau menonaktifkan akun Anda sendiri.");
  if (role === "staff" && (!Array.isArray(body.modules) || body.modules.some(m => !(MODULE_IDS as readonly unknown[]).includes(m)))) throw new HttpError(400, "Izin modul tidak valid.");
  if (getServiceSupabase() && await (await import("./cloud-auth")).cloudEmailTakenByOther(email, id)) throw new HttpError(409, "Email sudah dipakai akun lain di Supabase.");
  const modules: string[] = role === "admin" ? [...MODULE_IDS] : [...new Set(body.modules as string[])];
  const temporaryPassword = !existing || body.resetPassword === true ? randomBytes(12).toString("base64url") : undefined;
  const salt = temporaryPassword ? randomBytes(16).toString("hex") : String(existing?.salt);
  const revoke = Boolean(temporaryPassword) || body.enabled === false;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO staff_accounts(id,name,email,password_hash,salt,enabled,must_change_password,role,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,password_hash=excluded.password_hash,salt=excluded.salt,enabled=excluded.enabled,must_change_password=excluded.must_change_password,role=excluded.role")
      .run(id,name,email,temporaryPassword ? passwordHash(temporaryPassword,salt) : String(existing?.password_hash),salt,body.enabled === false ? 0 : 1,temporaryPassword ? 1 : Number(existing?.must_change_password ?? 1),role,String(existing?.created_at ?? new Date().toISOString()));
    db.prepare("DELETE FROM staff_permissions WHERE account_id=?").run(id);
    for (const mod of modules) db.prepare("INSERT INTO staff_permissions VALUES(?,?)").run(id,mod);
    if (revoke) db.prepare("DELETE FROM admin_sessions WHERE account_id=?").run(id);
    db.exec("COMMIT");
  } catch(error) { db.exec("ROLLBACK"); throw error; }
  const { mirrorStaffToSupabase } = await import("./cloud-sync");
  const cloud = await mirrorStaffToSupabase(id, revoke);
  return { ...(temporaryPassword ? { temporaryPassword } : {}), cloud };
}
export async function changeStaffPassword(id: string, current: string, password: string): Promise<void> {
  if (isCloudPrimaryEnv()) return (await import("./cloud-auth")).cloudChangePassword(id,current,password);
  const db = getLocalDb(); const row = db.prepare("SELECT * FROM staff_accounts WHERE id=? AND enabled=1").get(id);
  if (!row || !equal(passwordHash(current,String(row.salt)),String(row.password_hash))) throw new HttpError(400,"Kata sandi saat ini tidak cocok.");
  if (password.length < 12 || password.length > 128) throw new HttpError(400,"Gunakan kata sandi 12–128 karakter.");
  const salt = randomBytes(16).toString("hex");
  db.exec("BEGIN IMMEDIATE");
  try { db.prepare("UPDATE staff_accounts SET salt=?,password_hash=?,must_change_password=0 WHERE id=?").run(salt,passwordHash(password,salt),id); db.prepare("DELETE FROM admin_sessions WHERE account_id=?").run(id); db.exec("COMMIT"); }
  catch(error) { db.exec("ROLLBACK"); throw error; }
  const { mirrorStaffToSupabase } = await import("./cloud-sync");
  await mirrorStaffToSupabase(id, true);
}
