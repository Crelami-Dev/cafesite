"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Order, OrderItemInput } from "@/types/operations";
import type { OrderResponse, PendingOrderRequest } from "@/types/ordering";

export const LAST_ORDER_KEY = "cafesite:last-order";
const ORDER_TOKENS_KEY = "cafesite:order-tokens";
export const ORDER_REGISTRY_EVENT = "cafesite:orders-change";
let memoryTokens: Record<string, string> = {};
let volatileStorage = false;
let customerSession: Promise<string> | null = null;

export function readOrderTokens(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(ORDER_TOKENS_KEY) || (volatileStorage ? JSON.stringify(memoryTokens) : "{}")) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([id, token]) => /^[0-9a-f-]{36}$/.test(id) && typeof token === "string" && token.length <= 128)) as Record<string,string> : {};
  } catch { return memoryTokens; }
}

/** Simpan token akses pesanan (bukan data pribadi) agar halaman status bisa dibuka lagi dari browser ini. */
export function rememberOrderToken(orderId: string, token: string): void {
  memoryTokens = { ...readOrderTokens(), [orderId]: token };
  try { localStorage.setItem(ORDER_TOKENS_KEY, JSON.stringify(memoryTokens)); volatileStorage = false; } catch { volatileStorage = true; /* This tab keeps access until it closes. */ }
  window.dispatchEvent(new Event(ORDER_REGISTRY_EVENT));
}

export async function customerAccessToken(create: boolean = false): Promise<string> {
  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error("Pemesanan belum tersedia. Silakan pesan langsung di kasir.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("Sesi belum dapat dibaca. Coba kembali beberapa saat lagi.");
  if (data.session) return data.session.access_token;
  if (!create) throw new Error("Buka pesanan dari browser yang digunakan saat memesan. Jika sesi sudah dihapus, minta bantuan kasir.");
  if (!customerSession) {
    customerSession = supabase.auth.signInAnonymously().then(({ data: signedIn, error: signInError }) => {
      if (signInError || !signedIn.session) throw new Error("Belum bisa memulai sesi pesanan. Silakan coba lagi atau hubungi kasir.");
      return signedIn.session.access_token;
    }).finally(() => { customerSession = null; });
  }
  return customerSession;
}

export async function orderRequest<T>(path: string, options: RequestInit = {}, _createSession: boolean = false, orderId?: string): Promise<T> {
  // Server memilih mode sendiri (CONTENT_SOURCE). Browser mengirim apa yang ia punya: token pesanan dari mode lokal
  // (SQLite) bila tersimpan, dan token sesi Supabase bila Supabase aktif di browser. Tidak bergantung pada flag yang sama.
  const auth: Record<string, string> = {};
  const orderToken = orderId ? readOrderTokens()[orderId] : undefined;
  if (orderToken) auth["X-Order-Token"] = orderToken;
  if (orderId && !orderToken) throw new Error("Pesanan ini tidak tersimpan di browser ini. Buka dari browser yang dipakai saat memesan, atau tanyakan nomor antrian ke kasir.");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(path, {
      ...options,
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...auth, ...options.headers },
    });
    const payload: T & { error?: string } = await response.json();
    if (!response.ok) throw new Error(payload.error || "Pesanan belum dapat diproses. Silakan coba lagi.");
    return payload;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Koneksi terlalu lama. Coba kirim lagi dengan rincian yang sama; pesanan tidak akan dibuat dua kali.");
    }
    if (error instanceof TypeError) throw new Error("Koneksi terputus. Periksa internet, lalu coba lagi dengan rincian yang sama.");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchCustomerOrder(id: string): Promise<Order> {
  const { order } = await orderRequest<OrderResponse>(`/api/orders/${encodeURIComponent(id)}`, {}, false, id);
  return order;
}

export function queueLabel(number: number): string {
  return `A-${String(number).padStart(3, "0")}`;
}

export function canAddToOrder(order: Order): boolean {
  return order.status === "waiting" && order.payment_status === "unpaid";
}

/**
 * UUID v4. crypto.randomUUID dan crypto.subtle hanya ada di "secure context" (https atau localhost); saat diuji dari HP
 * lewat http://192.168.x.x keduanya tidak ada, jadi pakai crypto.getRandomValues yang selalu tersedia.
 */
function uuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Sidik jari isi pesanan (bukan untuk keamanan, hanya untuk mengenali kiriman ulang yang sama). */
async function fingerprintOf(text: string): Promise<string> {
  if (crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (byte: number): string => byte.toString(16).padStart(2, "0")).join("");
  }
  let hash = 0x811c9dc5; // FNV-1a 32-bit
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return `fnv-${(hash >>> 0).toString(16)}-${text.length}`;
}

// Keep retries of the same checkout tied to one server-side idempotency key.
// Only a digest is persisted; customer names and phone numbers stay out of storage.
export async function requestKey(scope: string, payload: unknown): Promise<string> {
  const fingerprint = await fingerprintOf(JSON.stringify(payload));
  const storageKey = `cafesite:request:${scope}`;
  try {
    const previous = JSON.parse(localStorage.getItem(storageKey) || "null") as PendingOrderRequest | null;
    if (previous?.fingerprint === fingerprint && previous.key) return previous.key;
  } catch { /* Storage can be disabled; the request can still be made. */ }
  const key = uuid();
  try { localStorage.setItem(storageKey, JSON.stringify({ fingerprint, key })); } catch { /* Optional recovery storage. */ }
  return key;
}

export function finishOrderRequest(scope: string, orderId: string): void {
  try {
    localStorage.removeItem(`cafesite:request:${scope}`);
    localStorage.setItem(LAST_ORDER_KEY, orderId);
  } catch { /* A successful order must remain successful when storage is disabled. */ }
}

export function isCartItem(value: unknown): value is OrderItemInput {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<OrderItemInput>;
  return typeof item.menuItemId === "string" && item.menuItemId.length <= 100
    && Number.isInteger(item.quantity) && Number(item.quantity) >= 1 && Number(item.quantity) <= 20
    && typeof item.notes === "string" && item.notes.length <= 300;
}
