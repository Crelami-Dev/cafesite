"use client";

/** QR dibaca ulang untuk setiap pesanan; tidak ada sesi scan yang dipulihkan. */
export interface StoredScan { meja: string; k: string }

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

/** Jelaskan QR yang terbaca tetapi tidak dapat dipakai, tanpa melewati validasi kunci di server. */
export function scanProblem(rawValue: string): string | null {
  if (parseScan(rawValue)) return null;
  try {
    const url = new URL(rawValue, window.location.origin);
    if (url.pathname === "/order" && url.searchParams.get("meja") && !url.searchParams.get("k")) {
      return "QR terbaca, tetapi belum memiliki kunci pemesanan. Minta staf membuat ulang QR meja dari dashboard.";
    }
  } catch { /* Isi QR bukan alamat pemesanan. */ }
  return "QR terbaca, tetapi bukan QR pemesanan meja. Arahkan kamera ke QR yang disediakan staf.";
}
