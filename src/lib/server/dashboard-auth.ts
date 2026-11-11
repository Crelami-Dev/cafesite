import "server-only";
import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { HttpError, textValue } from "./validation";
import type { DashboardAccount, StaffAccount } from "@/types";

export const SESSION_COOKIE = "cafesite_local_admin";
export const MODULE_IDS = ["orders", "menu", "tables", "wa_bot", "cafe", "gallery", "testimonials", "faq", "location", "reports"] as const;
const digest = (value: string): string => createHash("sha256").update(value).digest("hex");
const equal = (a: string, b: string): boolean => {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
export function passwordHash(password: string, salt: string): string { return scryptSync(password, salt, 64).toString("hex"); }
const ownerVersion = (): string => digest(`${process.env.LOCAL_ADMIN_EMAIL}:${process.env.LOCAL_ADMIN_PASSWORD}`);

function createOwnerSignedToken(email: string, now = Date.now()): string {
  const payload = `${Buffer.from(email).toString("base64url")}.${Math.floor(now / 1000) + 8 * 3600}`;
  const sig = createHmac("sha256", `cafesite-local-session:${process.env.LOCAL_ADMIN_PASSWORD ?? ""}`)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

function verifyLegacyOwnerToken(token: string): number | null {
  if (!process.env.LOCAL_ADMIN_PASSWORD || !process.env.LOCAL_ADMIN_EMAIL) return null;
  const [emailPart, expiry, signature] = token.split(".");
  if (!emailPart || !expiry || !signature) return null;
  const expected = createHmac("sha256", `cafesite-local-session:${process.env.LOCAL_ADMIN_PASSWORD}`)
    .update(`${emailPart}.${expiry}`)
    .digest("base64url");
  if (!equal(signature, expected)) return null;
  const expiresAt = Number(expiry) * 1000;
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  const email = Buffer.from(emailPart, "base64url").toString();
  return email.toLowerCase() === process.env.LOCAL_ADMIN_EMAIL.trim().toLowerCase() ? expiresAt : null;
}

export async function dashboardAccount(): Promise<DashboardAccount | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getLocalDb();
  let session = db.prepare("SELECT * FROM admin_sessions WHERE token_hash=? AND expires_at>?").get(digest(token), Date.now());
  if (!session) {
    const legacyExpiresAt = verifyLegacyOwnerToken(token);
    if (legacyExpiresAt) {
      db.prepare("INSERT OR IGNORE INTO admin_sessions VALUES(?,?,?,?)").run(digest(token), "owner", legacyExpiresAt, ownerVersion());
      session = db.prepare("SELECT * FROM admin_sessions WHERE token_hash=? AND expires_at>?").get(digest(token), Date.now());
    }
  }
  if (!session) return null;
  if (session.account_id === "owner") {
    if (!process.env.LOCAL_ADMIN_PASSWORD || session.owner_version !== ownerVersion()) return null;
    return { profile: { id: "owner", role: "admin", name: "Pemilik kedai", email: process.env.LOCAL_ADMIN_EMAIL ?? "" }, modules: MODULE_IDS.map(id => ({ id, enabled: true })), mustChangePassword: false };
  }
  const row = db.prepare("SELECT id,name,email,must_change_password FROM staff_accounts WHERE id=? AND enabled=1").get(String(session.account_id));
  if (!row) return null;
  return { profile: { id: String(row.id), role: "staff", name: String(row.name), email: String(row.email) }, modules: db.prepare("SELECT module FROM staff_permissions WHERE account_id=?").all(String(row.id)).map(p => ({ id: String(p.module), enabled: true })), mustChangePassword: Boolean(row.must_change_password) };
}

export async function authenticate(email: string, password: string): Promise<string> {
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
  if (!id) {
    db.prepare("INSERT INTO login_attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires_at<? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<? THEN excluded.expires_at ELSE expires_at END").run(key, Date.now()+900000, Date.now(), Date.now());
    throw new HttpError(401, "Email atau kata sandi tidak cocok.");
  }
  db.prepare("DELETE FROM login_attempts WHERE key=?").run(key);
  db.prepare("DELETE FROM admin_sessions WHERE expires_at<=?").run(Date.now());
  const token = id === "owner" ? createOwnerSignedToken(normalized) : randomBytes(32).toString("base64url");
  db.prepare("INSERT OR REPLACE INTO admin_sessions VALUES(?,?,?,?)").run(digest(token), id, Date.now()+8*3600000, id === "owner" ? ownerVersion() : null);
  return token;
}
export async function revokeCurrentSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) getLocalDb().prepare("DELETE FROM admin_sessions WHERE token_hash=?").run(digest(token));
}
export function staffList(): StaffAccount[] {
  const db = getLocalDb();
  return db.prepare("SELECT id,name,email,enabled,must_change_password FROM staff_accounts ORDER BY name").all().map(row => ({ id: String(row.id), name: String(row.name), email: String(row.email), enabled: Boolean(row.enabled), mustChangePassword: Boolean(row.must_change_password), modules: db.prepare("SELECT module FROM staff_permissions WHERE account_id=?").all(String(row.id)).map(p => String(p.module)) }));
}
export function saveStaff(body: Record<string, unknown>): { temporaryPassword?: string } {
  const db = getLocalDb(); const id = body.id ? textValue(body.id, "Akun", 80) : randomUUID();
  const existing = db.prepare("SELECT * FROM staff_accounts WHERE id=?").get(id);
  if (body.id && !existing) throw new HttpError(404, "Akun tidak ditemukan.");
  const name = textValue(body.name, "Nama", 80); const email = textValue(body.email, "Email", 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === process.env.LOCAL_ADMIN_EMAIL?.toLowerCase()) throw new HttpError(400, "Email tidak valid atau sudah digunakan pemilik.");
  if (db.prepare("SELECT id FROM staff_accounts WHERE email=? COLLATE NOCASE AND id<>?").get(email,id)) throw new HttpError(409,"Email sudah digunakan.");
  if (!Array.isArray(body.modules) || body.modules.some(m => !(MODULE_IDS as readonly unknown[]).includes(m))) throw new HttpError(400, "Izin modul tidak valid.");
  const temporaryPassword = !existing || body.resetPassword === true ? randomBytes(12).toString("base64url") : undefined;
  const salt = temporaryPassword ? randomBytes(16).toString("hex") : String(existing?.salt);
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO staff_accounts VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,password_hash=excluded.password_hash,salt=excluded.salt,enabled=excluded.enabled,must_change_password=excluded.must_change_password").run(id,name,email,temporaryPassword ? passwordHash(temporaryPassword,salt) : String(existing?.password_hash),salt,body.enabled === false ? 0 : 1,temporaryPassword ? 1 : Number(existing?.must_change_password ?? 1),new Date().toISOString());
    db.prepare("DELETE FROM staff_permissions WHERE account_id=?").run(id);
    for (const mod of new Set(body.modules as string[])) db.prepare("INSERT INTO staff_permissions VALUES(?,?)").run(id,mod);
    if (temporaryPassword || body.enabled === false) db.prepare("DELETE FROM admin_sessions WHERE account_id=?").run(id);
    db.exec("COMMIT");
  } catch(error) { db.exec("ROLLBACK"); throw error; }
  void (async () => {
    try {
      const { mirrorStaffToSupabase } = await import("./cloud-sync");
      mirrorStaffToSupabase(id);
    } catch {
      // Abaikan eror mirror ke cloud
    }
  })();
  return temporaryPassword ? { temporaryPassword } : {};
}
export function changeStaffPassword(id: string, current: string, password: string): void {
  const db = getLocalDb(); const row = db.prepare("SELECT * FROM staff_accounts WHERE id=? AND enabled=1").get(id);
  if (!row || !equal(passwordHash(current,String(row.salt)),String(row.password_hash))) throw new HttpError(400,"Kata sandi saat ini tidak cocok.");
  if (password.length < 12 || password.length > 128) throw new HttpError(400,"Gunakan kata sandi 12–128 karakter.");
  const salt = randomBytes(16).toString("hex");
  db.exec("BEGIN IMMEDIATE");
  try { db.prepare("UPDATE staff_accounts SET salt=?,password_hash=?,must_change_password=0 WHERE id=?").run(salt,passwordHash(password,salt),id); db.prepare("DELETE FROM admin_sessions WHERE account_id=?").run(id); db.exec("COMMIT"); }
  catch(error) { db.exec("ROLLBACK"); throw error; }
  void (async () => {
    try {
      const { mirrorStaffToSupabase } = await import("./cloud-sync");
      mirrorStaffToSupabase(id);
    } catch {
      // Abaikan eror mirror ke cloud
    }
  })();
}
