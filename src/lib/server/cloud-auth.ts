import "server-only";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cloudDb, cloudRpc, checkCloud } from "./cloud-db";
import { HttpError, textValue } from "./validation";
import { MODULE_IDS } from "./dashboard-auth";
import type { DashboardAccount, StaffAccount } from "@/types";
const digest = (v: string): string => createHash("sha256").update(v).digest("hex");
const hash = (v: string, salt: string): string => scryptSync(v, salt, 64).toString("hex");
const equal = (a: string, b: string): boolean => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const ownerVersion = (): string => digest(`${process.env.LOCAL_ADMIN_EMAIL}:${process.env.LOCAL_ADMIN_PASSWORD}`);

export async function cloudAccount(token: string): Promise<DashboardAccount | null> {
  const db = cloudDb();
  const session = await db.from("admin_sessions").select("account_id,owner_version").eq("token_hash", digest(token)).gt("expires_at", Date.now()).maybeSingle();
  checkCloud(session.error);
  if (!session.data) return null;
  if (session.data.account_id === "owner") {
    if (!process.env.LOCAL_ADMIN_PASSWORD || session.data.owner_version !== ownerVersion()) return null;
    return { profile: { id: "owner", role: "admin", name: "Pemilik kedai", email: process.env.LOCAL_ADMIN_EMAIL ?? "" }, modules: MODULE_IDS.map(id => ({ id, enabled: true })), mustChangePassword: false };
  }
  const row = await db.from("staff_accounts").select("id,name,email,must_change_password").eq("id", session.data.account_id).eq("enabled", 1).maybeSingle();
  checkCloud(row.error);
  if (!row.data) return null;
  const permissions = await db.from("staff_permissions").select("module").eq("account_id", row.data.id);
  checkCloud(permissions.error);
  return { profile: { id: row.data.id, name: row.data.name, email: row.data.email, role: "staff" }, modules: (permissions.data ?? []).map(p => ({ id: p.module, enabled: true })), mustChangePassword: Boolean(row.data.must_change_password) };
}
export async function cloudAuthenticate(email: string, password: string): Promise<string> {
  const db = cloudDb(); const normalized = email.trim().toLowerCase(); const key = digest(normalized);
  
  // Periksa login attempt langsung via tabel login_attempts (tanpa bergantung pada stored procedure)
  const existingAttempt = await db.from("login_attempts").select("attempts,expires_at").eq("key", key).maybeSingle();
  if (existingAttempt.data && Number(existingAttempt.data.expires_at) > Date.now() && Number(existingAttempt.data.attempts) >= 8) {
    throw new HttpError(429, "Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
  }

  let id = "";
  if (process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase() === normalized && process.env.LOCAL_ADMIN_PASSWORD && equal(digest(password), digest(process.env.LOCAL_ADMIN_PASSWORD))) id = "owner";
  else {
    const row = await db.from("staff_accounts").select("id,password_hash,salt").eq("email", normalized).eq("enabled", 1).maybeSingle();
    const actual = hash(password, row.data?.salt ?? "cafesite-invalid-login");
    if (row.data && equal(actual, row.data.password_hash)) id = row.data.id;
  }

  if (!id) {
    const nextAttempts = (existingAttempt.data?.attempts ?? 0) + 1;
    await db.from("login_attempts").upsert({ key, attempts: nextAttempts, expires_at: Date.now() + 900000 });
    throw new HttpError(401, "Email atau kata sandi tidak cocok.");
  }

  await db.from("login_attempts").delete().eq("key", key);
  await db.from("admin_sessions").delete().lte("expires_at", Date.now());
  const token = randomBytes(32).toString("base64url");
  await db.from("admin_sessions").insert({ token_hash: digest(token), account_id: id, expires_at: Date.now() + 8 * 3600000, owner_version: id === "owner" ? ownerVersion() : null });
  return token;
}
export async function cloudRevoke(token: string): Promise<void> {
  checkCloud((await cloudDb().from("admin_sessions").delete().eq("token_hash", digest(token))).error);
}
export async function cloudStaffList(): Promise<StaffAccount[]> {
  const db = cloudDb(); const rows = await db.from("staff_accounts").select("id,name,email,enabled,must_change_password,staff_permissions(module)").order("name");
  checkCloud(rows.error);
  return (rows.data ?? []).map(r => ({ id: r.id, name: r.name, email: r.email, enabled: Boolean(r.enabled), mustChangePassword: Boolean(r.must_change_password), modules: r.staff_permissions.map(p => p.module) }));
}
export async function cloudSaveStaff(body: Record<string, unknown>): Promise<{ temporaryPassword?: string }> {
  const id = body.id ? textValue(body.id, "Akun", 80) : randomUUID(); const db = cloudDb();
  const result = await db.from("staff_accounts").select("*").eq("id", id).maybeSingle(); checkCloud(result.error);
  const existing = result.data;
  if (body.id && !existing) throw new HttpError(404, "Akun tidak ditemukan.");
  const name = textValue(body.name, "Nama", 80); const email = textValue(body.email, "Email", 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase()) throw new HttpError(400, "Email tidak valid atau sudah digunakan pemilik.");
  if (!Array.isArray(body.modules) || body.modules.some(m => !(MODULE_IDS as readonly unknown[]).includes(m))) throw new HttpError(400, "Izin modul tidak valid.");
  const temporaryPassword = !existing || body.resetPassword === true ? randomBytes(12).toString("base64url") : undefined;
  const salt = temporaryPassword ? randomBytes(16).toString("hex") : existing.salt;
  await cloudRpc("cafesite_save_staff", { input: { id, name, email, salt, password_hash: temporaryPassword ? hash(temporaryPassword, salt) : existing.password_hash, enabled: body.enabled === false ? 0 : 1, must_change_password: temporaryPassword ? 1 : existing.must_change_password, created_at: existing?.created_at ?? new Date().toISOString() }, permissions: body.modules, revoke_sessions: Boolean(temporaryPassword) || body.enabled === false });
  return temporaryPassword ? { temporaryPassword } : {};
}
export async function cloudChangePassword(id: string, current: string, password: string): Promise<void> {
  const row = await cloudDb().from("staff_accounts").select("password_hash,salt").eq("id", id).eq("enabled", 1).maybeSingle(); checkCloud(row.error);
  if (!row.data || !equal(hash(current, row.data.salt), row.data.password_hash)) throw new HttpError(400, "Kata sandi saat ini tidak cocok.");
  if (password.length < 12 || password.length > 128) throw new HttpError(400, "Gunakan kata sandi 12–128 karakter.");
  const salt = randomBytes(16).toString("hex");
  await cloudRpc("cafesite_change_password", { account: id, expected_hash: row.data.password_hash, new_hash: hash(password, salt), new_salt: salt });
}
