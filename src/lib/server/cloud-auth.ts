import "server-only";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cloudDb, cloudRpc, checkCloud } from "./cloud-db";
import { HttpError, textValue } from "./validation";
import { MODULE_IDS } from "./dashboard-auth";
import type { DashboardAccount, StaffAccount, StaffCloudState, StaffRole } from "@/types";
const digest = (v: string): string => createHash("sha256").update(v).digest("hex");
const hash = (v: string, salt: string): string => scryptSync(v, salt, 64).toString("hex");
const equal = (a: string, b: string): boolean => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const roleOf = (value: unknown): StaffRole => (value === "admin" ? "admin" : "staff");
const allModules = (): { id: string; enabled: boolean }[] => MODULE_IDS.map(id => ({ id, enabled: true }));

/** Cache singkat agar tiap request tidak menambah query hanya untuk memeriksa skema/peran. */
const memo = globalThis as typeof globalThis & { __cafeRoleCol?: { ok: boolean; at: number } };

/** Apakah migrasi 09_staff_roles.sql sudah dijalankan (kolom role ada)? Bila belum, semua akun = staf. */
async function hasRoleColumn(db: SupabaseClient): Promise<boolean> {
  const cached = memo.__cafeRoleCol;
  if (cached && Date.now() - cached.at < 60_000) return cached.ok;
  const probe = await db.from("staff_accounts").select("role").limit(1);
  const ok = !(probe.error && probe.error.code === "42703");
  memo.__cafeRoleCol = { ok, at: Date.now() };
  return ok;
}
const staffColumns = async (db: SupabaseClient, base: string): Promise<string> => ((await hasRoleColumn(db)) ? `${base},role` : base);

/** Cek email+kata sandi ke Supabase Authentication (klien anon, tanpa menyimpan sesi). */
async function verifyWithSupabaseAuth(email: string, password: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new HttpError(503, "NEXT_PUBLIC_SUPABASE_ANON_KEY belum diatur di server, login lewat Supabase Authentication tidak bisa dipakai.");
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    if (error && error.status && error.status >= 500) console.error("[cloudAuthenticate] Supabase Auth bermasalah:", error.message);
    return false;
  }
  await client.auth.signOut().catch(() => undefined);
  return true;
}

interface CloudStaffRow { id: string; name: string; email: string; must_change_password: number; role?: string }

/**
 * Cache sesi singkat per instance server: polling dashboard memanggil API tiap beberapa detik, dan tanpa ini
 * setiap panggilan mengulang 2-3 query hanya untuk memeriksa sesi. Perubahan izin/penonaktifan akun berlaku
 * paling lambat setelah SESSION_CACHE_MS; logout menghapus entri saat itu juga.
 */
const SESSION_CACHE_MS = 20_000;
const sessionCache = (globalThis as typeof globalThis & { __cafeSessionCache?: Map<string, { account: DashboardAccount; at: number }> });
const sessions = (): Map<string, { account: DashboardAccount; at: number }> => (sessionCache.__cafeSessionCache ??= new Map());

export async function cloudAccount(token: string): Promise<DashboardAccount | null> {
  const key = digest(token);
  const hit = sessions().get(key);
  if (hit && Date.now() - hit.at < SESSION_CACHE_MS) return hit.account;
  const account = await loadCloudAccount(token);
  if (account) {
    if (sessions().size > 500) sessions().clear();
    sessions().set(key, { account, at: Date.now() });
  } else sessions().delete(key);
  return account;
}

async function loadCloudAccount(token: string): Promise<DashboardAccount | null> {
  try {
    const db = cloudDb();
    const session = await db.from("admin_sessions").select("account_id").eq("token_hash", digest(token)).gt("expires_at", Date.now()).maybeSingle();
    if (session.error) {
      console.warn("[cloudAccount] Gagal membaca sesi admin:", session.error.code, session.error.message);
      return null;
    }
    if (!session.data) return null;
    const found = await db.from("staff_accounts").select(await staffColumns(db, "id,name,email,must_change_password")).eq("id", session.data.account_id).eq("enabled", 1).maybeSingle();
    if (found.error || !found.data) {
      if (found.error) console.warn("[cloudAccount] Gagal membaca staff:", found.error.code, found.error.message);
      return null;
    }
    const row = found.data as unknown as CloudStaffRow | null;
    if (!row) return null;
    const role = roleOf(row.role);
    // Admin selalu punya semua modul: tidak perlu query izin.
    if (role === "admin") return { profile: { id: row.id, name: row.name, email: row.email, role }, modules: allModules(), mustChangePassword: Boolean(row.must_change_password) };
    const permissions = await db.from("staff_permissions").select("module").eq("account_id", row.id);
    if (permissions.error) {
      console.warn("[cloudAccount] Gagal membaca izin modul:", permissions.error.code, permissions.error.message);
      return null;
    }
    return { profile: { id: row.id, name: row.name, email: row.email, role }, modules: (permissions.data ?? []).map(p => ({ id: p.module, enabled: true })), mustChangePassword: Boolean(row.must_change_password) };
  } catch (err) {
    console.error("[cloudAccount] Kesalahan sesi cloud:", err);
    return null;
  }
}
export async function cloudAuthenticate(email: string, password: string): Promise<string> {
  const db = cloudDb(); const normalized = email.trim().toLowerCase(); const key = digest(normalized);

  // Periksa login attempt jika tabel login_attempts tersedia
  let existingAttempts = 0;
  try {
    const existingAttempt = await db.from("login_attempts").select("attempts,expires_at").eq("key", key).maybeSingle();
    if (!existingAttempt.error && existingAttempt.data) {
      existingAttempts = Number(existingAttempt.data.attempts ?? 0);
      if (Number(existingAttempt.data.expires_at) > Date.now() && existingAttempts >= 8) {
        throw new HttpError(429, "Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
      }
    }
  } catch (err) {
    if (err instanceof HttpError) throw err;
    // abaikan jika tabel login_attempts belum ada
  }

  let id = "";
  // Situs publik: kata sandi diverifikasi oleh Supabase Authentication; tabel staff_accounts
  // hanya dipakai untuk peran, izin modul, dan status aktif akun.
  if (await verifyWithSupabaseAuth(normalized, password)) {
    const row = await db.from("staff_accounts").select("id").eq("email", normalized).eq("enabled", 1).maybeSingle();
    if (row.error) {
      console.error("[cloudAuthenticate] Gagal membaca akun staff:", row.error.code, row.error.message);
      throw new HttpError(503, "Database cloud belum siap. Pastikan tabel staff_accounts sudah dibuat di Supabase.");
    }
    if (row.data) id = row.data.id;
  }

  if (!id) {
    try {
      await db.from("login_attempts").upsert({ key, attempts: existingAttempts + 1, expires_at: Date.now() + 900000 });
    } catch {
      // abaikan jika tabel login_attempts belum ada
    }
    throw new HttpError(401, "Email atau kata sandi tidak cocok.");
  }

  try {
    await db.from("login_attempts").delete().eq("key", key);
  } catch {
    // abaikan jika tabel login_attempts belum ada
  }

  try {
    await db.from("admin_sessions").delete().lte("expires_at", Date.now());
  } catch {
    // abaikan jika tabel admin_sessions belum ada
  }

  const token = randomBytes(32).toString("base64url");
  const insertRes = await db.from("admin_sessions").insert({
    token_hash: digest(token),
    account_id: id,
    expires_at: Date.now() + 8 * 3600000
  });

  if (insertRes.error) {
    console.error("[cloudAuthenticate] Gagal menyimpan sesi:", insertRes.error.code, insertRes.error.message);
    if (insertRes.error.code === "PGRST205") {
      throw new HttpError(503, "Tabel 'admin_sessions' belum dibuat di Supabase. Silakan jalankan script SQL sesi di Supabase SQL Editor.");
    }
    throw new HttpError(503, "Gagal membuat sesi login di database cloud.");
  }

  return token;
}

export interface CloudLoginAccount { id: string; name: string; email: string; passwordHash: string; salt: string; mustChange: boolean; role: StaffRole; createdAt: string; modules: string[] }
/**
 * Dipakai login MODE LOKAL: cari akun di Supabase dan verifikasi kata sandinya.
 * Mengembalikan null bila tidak cocok / Supabase tidak terjangkau (login lokal tetap jalan).
 */
export async function cloudFindStaffForLogin(email: string, password: string): Promise<CloudLoginAccount | null> {
  try {
    const db = cloudDb();
    const cols = await staffColumns(db, "id,name,email,password_hash,salt,must_change_password,created_at");
    const found = await db.from("staff_accounts").select(`${cols},staff_permissions(module)`).eq("email", email.trim().toLowerCase()).eq("enabled", 1).abortSignal(AbortSignal.timeout(4000)).maybeSingle();
    if (found.error || !found.data) return null;
    const row = found.data as unknown as CloudStaffRow & { password_hash: string; salt: string; created_at: string; staff_permissions?: { module: string }[] };
    if (!equal(hash(password, row.salt), row.password_hash)) return null;
    return { id: row.id, name: row.name, email: row.email, passwordHash: row.password_hash, salt: row.salt, mustChange: Boolean(row.must_change_password), role: roleOf(row.role), createdAt: row.created_at, modules: (row.staff_permissions ?? []).map(p => p.module) };
  } catch {
    return null;
  }
}
/** Email sudah dipakai akun lain di Supabase? (dipakai saat membuat akun dari mode lokal) */
export async function cloudEmailTakenByOther(email: string, id: string): Promise<boolean> {
  try {
    const r = await cloudDb().from("staff_accounts").select("id").eq("email", email.toLowerCase()).neq("id", id).abortSignal(AbortSignal.timeout(4000)).limit(1);
    return !r.error && (r.data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}
export async function cloudRevoke(token: string): Promise<void> {
  sessions().delete(digest(token));
  try {
    await cloudDb().from("admin_sessions").delete().eq("token_hash", digest(token));
  } catch (err) {
    console.warn("[cloudRevoke] Gagal menghapus sesi cloud:", err);
  }
}
export async function cloudStaffList(): Promise<StaffAccount[]> {
  const db = cloudDb(); const rows = await db.from("staff_accounts").select(`${await staffColumns(db, "id,name,email,enabled,must_change_password")},staff_permissions(module)`).order("name");
  checkCloud(rows.error);
  type Row = CloudStaffRow & { enabled: number; staff_permissions: { module: string }[] };
  return ((rows.data ?? []) as unknown as Row[]).map(r => ({ id: r.id, name: r.name, email: r.email, role: roleOf(r.role), enabled: Boolean(r.enabled), mustChangePassword: Boolean(r.must_change_password), modules: r.staff_permissions.map(p => p.module) }));
}
export async function cloudSaveStaff(body: Record<string, unknown>, actorId?: string): Promise<{ temporaryPassword?: string; auth: StaffCloudState }> {
  const id = body.id ? textValue(body.id, "Akun", 80) : randomUUID(); const db = cloudDb();
  const result = await db.from("staff_accounts").select("*").eq("id", id).maybeSingle(); checkCloud(result.error);
  const existing = result.data;
  if (body.id && !existing) throw new HttpError(404, "Akun tidak ditemukan.");
  const name = textValue(body.name, "Nama", 80); const email = textValue(body.email, "Email", 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Email tidak valid.");
  const role: StaffRole = body.role === "admin" ? "admin" : "staff";
  if (actorId && id === actorId && (role !== "admin" || body.enabled === false)) throw new HttpError(400, "Anda tidak bisa menurunkan atau menonaktifkan akun Anda sendiri.");
  if (role === "staff" && (!Array.isArray(body.modules) || body.modules.some(m => !(MODULE_IDS as readonly unknown[]).includes(m)))) throw new HttpError(400, "Izin modul tidak valid.");
  const modules: string[] = role === "admin" ? [...MODULE_IDS] : [...new Set(body.modules as string[])];
  if (role === "admin") {
    memo.__cafeRoleCol = undefined;
    if (!(await hasRoleColumn(db))) throw new HttpError(409, "Peran admin butuh migrasi database: jalankan supabase/09_staff_roles.sql di Supabase SQL Editor.");
  }
  const temporaryPassword = !existing || body.resetPassword === true ? randomBytes(12).toString("base64url") : undefined;
  const salt = temporaryPassword ? randomBytes(16).toString("hex") : existing.salt;
  await cloudRpc("cafesite_save_staff", { input: { id, name, email, role, salt, password_hash: temporaryPassword ? hash(temporaryPassword, salt) : existing.password_hash, enabled: body.enabled === false ? 0 : 1, must_change_password: temporaryPassword ? 1 : existing.must_change_password, created_at: existing?.created_at ?? new Date().toISOString() }, permissions: modules, revoke_sessions: Boolean(temporaryPassword) || body.enabled === false });
  const { upsertAuthUser } = await import("./supabase-auth-users");
  const auth = await upsertAuthUser(db, { email, name, role, enabled: body.enabled !== false, password: temporaryPassword });
  return { ...(temporaryPassword ? { temporaryPassword } : {}), auth };
}
export async function cloudDeleteStaff(id: string, actorId?: string): Promise<{ cloud: StaffCloudState; auth: StaffCloudState }> {
  const db = cloudDb();
  if (actorId && id === actorId) throw new HttpError(400, "Anda tidak bisa menghapus akun Anda sendiri.");
  const found = await db.from("staff_accounts").select("id,email").eq("id", id).maybeSingle(); checkCloud(found.error);
  if (!found.data) throw new HttpError(404, "Akun tidak ditemukan.");
  if (await hasRoleColumn(db)) {
    const admins = await db.from("staff_accounts").select("id", { count: "exact", head: true }).eq("role", "admin").eq("enabled", 1).neq("id", id); checkCloud(admins.error);
    if ((admins.count ?? 0) < 1) throw new HttpError(400, "Tidak bisa menghapus: harus tersisa minimal satu admin aktif.");
  }
  checkCloud((await db.from("admin_sessions").delete().eq("account_id", id)).error);
  checkCloud((await db.from("staff_accounts").delete().eq("id", id)).error);
  const { deleteAuthUser } = await import("./supabase-auth-users");
  return { cloud: "saved", auth: await deleteAuthUser(db, String(found.data.email)) };
}
export async function cloudChangePassword(id: string, current: string, password: string): Promise<void> {
  const row = await cloudDb().from("staff_accounts").select("password_hash,salt").eq("id", id).eq("enabled", 1).maybeSingle(); checkCloud(row.error);
  if (!row.data || !equal(hash(current, row.data.salt), row.data.password_hash)) throw new HttpError(400, "Kata sandi saat ini tidak cocok.");
  if (password.length < 12 || password.length > 128) throw new HttpError(400, "Gunakan kata sandi 12–128 karakter.");
  const salt = randomBytes(16).toString("hex");
  await cloudRpc("cafesite_change_password", { account: id, expected_hash: row.data.password_hash, new_hash: hash(password, salt), new_salt: salt });
  // Kata sandi baru juga harus berlaku di Supabase Authentication (dipakai login di situs publik).
  const db = cloudDb();
  const who = await db.from("staff_accounts").select(await staffColumns(db, "name,email,enabled")).eq("id", id).maybeSingle();
  const acct = who.data as unknown as { name: string; email: string; enabled: number; role?: string } | null;
  if (acct) {
    const { upsertAuthUser } = await import("./supabase-auth-users");
    const state = await upsertAuthUser(db, { email: acct.email.toLowerCase(), name: acct.name, role: roleOf(acct.role), enabled: Boolean(acct.enabled), password });
    if (state !== "saved") throw new HttpError(503, "Kata sandi tersimpan, tetapi belum tersalin ke Supabase Authentication. Hubungi admin untuk reset.");
  }
}
