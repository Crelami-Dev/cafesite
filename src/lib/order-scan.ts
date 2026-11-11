"use client";

/**
 * Hasil scan QR meja disimpan di tab ini (sessionStorage, 4 jam) supaya tamu yang pindah halaman lalu kembali ke
 * /order tidak perlu scan ulang. Isinya hanya kode meja dan kunci QR yang memang tercetak di meja.
 */
const KEY = "cafesite:table-scan";
const MAX_AGE_MS = 4 * 60 * 60_000;

export interface StoredScan { meja: string; k: string }

export function rememberScan(meja: string, k: string): void {
  try { sessionStorage.setItem(KEY, JSON.stringify({ meja, k, at: Date.now() })); } catch { /* penyimpanan diblokir */ }
}

export function readScan(): StoredScan | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || "null") as { meja?: unknown; k?: unknown; at?: unknown } | null;
    if (!value || typeof value.meja !== "string" || typeof value.k !== "string" || typeof value.at !== "number") return null;
    if (Date.now() - value.at > MAX_AGE_MS) return null;
    return { meja: value.meja, k: value.k };
  } catch { return null; }
}

export function forgetScan(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* penyimpanan diblokir */ }
}

export function scanUrl(scan: StoredScan): string {
  return `/order?meja=${encodeURIComponent(scan.meja)}&k=${encodeURIComponent(scan.k)}`;
}

/** Ambil meja & kunci dari isi QR (alamat /order?meja=..&k=..). */
export function parseScan(rawValue: string): StoredScan | null {
  try {
    const url = new URL(rawValue, window.location.origin);
    const meja = url.searchParams.get("meja");
    const k = url.searchParams.get("k");
    return meja && k ? { meja: meja.slice(0, 60), k: k.slice(0, 64) } : null;
  } catch { return null; }
}
