import QRCode from "qrcode";

/**
 * Alamat dasar di dalam QR. Isi NEXT_PUBLIC_ORDER_BASE_URL (mis. https://cafesite.id atau http://192.168.1.135:3000)
 * supaya QR selalu bisa dibuka dari HP pelanggan; tanpa itu dipakai alamat dashboard yang sedang dibuka.
 */
export function qrBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_ORDER_BASE_URL?.trim();
  return configured ? configured.replace(/\/+$/, "") : window.location.origin;
}

/** true bila QR berisi alamat yang hanya bisa dibuka dari komputer ini (HP pelanggan tidak bisa membukanya). */
export function isLocalOnlyUrl(url: string): boolean {
  try { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname); } catch { return false; }
}

/** Alamat yang dibuka saat QR meja dipindai: /order?meja=<id>&k=<kunci QR meja>. */
export function tableOrderUrl(origin: string, tableId: string, key?: string): string {
  if (!key?.trim()) {
    throw new Error("Kunci QR meja belum tersedia. Pastikan ORDER_ACCESS_SECRET sudah dikonfigurasi di server, lalu muat ulang dashboard dan buat QR lagi.");
  }
  const url = new URL("/order", origin);
  url.searchParams.set("meja", tableId);
  url.searchParams.set("k", key);
  return url.toString();
}

const options = { margin: 2, width: 640, color: { dark: "#000000", light: "#ffffff" } } as const;

export async function qrPng(url: string): Promise<string> {
  return QRCode.toDataURL(url, { ...options, errorCorrectionLevel: "H" });
}

export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...options, type: "svg", errorCorrectionLevel: "H" });
}

export function downloadData(filename: string, data: string, mimeType?: string): void {
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = mimeType ? URL.createObjectURL(new Blob([data], { type: mimeType })) : data;
  anchor.click();
  if (mimeType) window.setTimeout(() => URL.revokeObjectURL(anchor.href), 0);
}
