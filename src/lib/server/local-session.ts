import "server-only";
import {isCloudPrimaryEnv} from "./storage-mode";
import { dashboardAccount } from "./dashboard-auth";
import type { DashboardAccount } from "@/types";
import { HttpError } from "./validation";

/** Sesi dashboard disimpan di tabel admin_sessions (SQLite lokal atau Supabase); akun semuanya dari database. */
export function isLocalMode(): boolean {
  return !isCloudPrimaryEnv();
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
