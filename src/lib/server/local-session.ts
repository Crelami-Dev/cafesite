import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { dashboardAccount } from "./dashboard-auth";
import type { DashboardAccount } from "@/types";
import { HttpError } from "./validation";

/**
 * Sesi admin lokal (mode SQLite). Cookie berisi `email.kedaluwarsa.tanda-tangan` (HMAC-SHA256)
 * sehingga tidak bisa dipalsukan hanya dengan menulis nama cookie di browser. Kunci tanda tangan
 * diturunkan dari LOCAL_ADMIN_PASSWORD, jadi mengganti kata sandi otomatis mencabut semua sesi.
 */
export const LOCAL_COOKIE = "cafesite_local_admin";
export const LOCAL_SESSION_SECONDS = 8 * 60 * 60;

export function isLocalMode(): boolean {
  return process.env.CONTENT_SOURCE !== "supabase";
}

function sign(payload: string): string {
  const secret = `cafesite-local-session:${process.env.LOCAL_ADMIN_PASSWORD ?? ""}`;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createLocalToken(email: string, now = Date.now()): string {
  const payload = `${Buffer.from(email).toString("base64url")}.${Math.floor(now / 1000) + LOCAL_SESSION_SECONDS}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyLocalToken(token: string | undefined, now = Date.now()): string | null {
  if (!token || !process.env.LOCAL_ADMIN_PASSWORD || !process.env.LOCAL_ADMIN_EMAIL) return null;
  const [emailPart, expiry, signature] = token.split(".");
  if (!emailPart || !expiry || !signature) return null;
  const expected = sign(`${emailPart}.${expiry}`);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
  if (!Number.isFinite(Number(expiry)) || Number(expiry) * 1000 < now) return null;
  const email = Buffer.from(emailPart, "base64url").toString();
  return email === process.env.LOCAL_ADMIN_EMAIL ? email : null;
}

export async function hasLocalSession(): Promise<boolean> {
  return (await dashboardAccount()) !== null;
}

/**
 * Tolak permintaan pengubah data dari situs lain. Tanpa header Origin (mis. curl, browser lama) dianggap sama situs;
 * Origin "null"/rusak ditolak. Di belakang reverse proxy, X-Forwarded-Host dipakai bila ada.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0]?.trim();
  let originHost = "";
  try { originHost = new URL(origin).host; } catch { /* Origin "null" atau rusak */ }
  if (!originHost || originHost !== host) throw new HttpError(403, "Permintaan lintas situs ditolak.");
}

/** Guard route admin lokal: sesi valid + (untuk metode yang mengubah data) Origin sama dengan Host. */
export async function requireLocalAdmin(request: Request, module?: string): Promise<DashboardAccount> {
  if (!isLocalMode()) throw new HttpError(404, "Mode lokal tidak aktif.");
  const account = await dashboardAccount();
  if (!account) throw new HttpError(401, "Sesi berakhir. Silakan masuk kembali.");
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) assertSameOrigin(request);
  const url = new URL(request.url);
  const target = module ?? (url.pathname.includes("/wabot") ? "wa_bot" : url.pathname.endsWith("/orders") ? "orders" : url.searchParams.get("resource"));
  const permission = target === "categories" ? "menu" : target === "floors" ? "tables" : target;
  if (account.mustChangePassword && !url.pathname.endsWith("/password") && !url.pathname.endsWith("/bootstrap")) throw new HttpError(403, "Ganti kata sandi sementara sebelum melanjutkan.");
  if (permission && account.profile.role !== "admin" && (permission === "modules" || !account.modules.some(p => p.id === permission && p.enabled))) throw new HttpError(403, "Akun Anda tidak memiliki akses ke modul ini.");
  return account;
}
