import type { Order, OrderStatus } from "@/types";

export const WAIT_WARNING_MINUTES = 5;
export const WAIT_URGENT_MINUTES = 15;

export function formatRupiah(value: number): string { return `Rp ${value.toLocaleString("id-ID")}`; }
export function queueLabel(queue: number): string { return `A-${String(queue).padStart(3, "0")}`; }
export function fulfillmentLabel(order: Order): string { return order.fulfillment === "dine_in" ? (order.table_id ? `Meja ${order.table_id}` : "Makan di tempat") : "Bawa pulang"; }
export function waitingMinutes(createdAt: string, now: number): number { return Math.max(0, Math.floor((now - Date.parse(createdAt)) / 60000)); }
export function waitingLabel(createdAt: string, now: number): string { const minutes = waitingMinutes(createdAt, now); return minutes < 1 ? "Baru masuk" : `${minutes} menit`; }
export function urgencyClass(createdAt: string, now: number): string { const minutes = waitingMinutes(createdAt, now); if (minutes >= WAIT_URGENT_MINUTES) return "border-terracotta-light bg-terracotta/15 text-terracotta-light animate-pulse"; if (minutes >= WAIT_WARNING_MINUTES) return "border-terracotta-light/50 text-terracotta-light"; return "border-offwhite/15 text-offwhite-muted"; }
export function nextOrderAction(order: Order): { status: OrderStatus; label: string; markPaid: boolean } | null { if (order.status === "waiting") return { status: "preparing", label: order.payment_status === "paid" ? "Mulai proses" : "Lunas & proses", markPaid: order.payment_status !== "paid" }; if (order.payment_status !== "paid") return null; if (order.status === "preparing") return { status: "ready", label: "Siap diambil", markPaid: false }; if (order.status === "ready") return { status: "completed", label: "Sudah diserahkan", markPaid: false }; return null; }
export function isToday(date: string): boolean { const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }); return formatter.format(new Date(date)) === formatter.format(new Date()); }
/** 6281234567890 / 081234567890 -> "+62 812-3456-7890" agar mudah dibaca kasir. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  if (!intl.startsWith("62") || intl.length < 10) return raw;
  const rest = intl.slice(2);
  return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`.replace(/-$/, "");
}
export function whatsappLink(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `62${digits.slice(1)}` : digits}`;
}
