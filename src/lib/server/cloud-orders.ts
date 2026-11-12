import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cloudDb, checkCloud, cloudRpc } from "./cloud-db";
import { tableKey, orderAccessToken } from "./local-orders";
import { createOrderInput, objectValue, textValue, uuidValue, HttpError } from "./validation";
import type { Order } from "@/types";
import type { ScannedTable } from "./local-orders";
import { checkoutTicket, qrSource } from "./order-tickets";
import { digestValue } from "./order-security";
function same(a: string, b: string): boolean { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }
export async function resolveCloudTable(id: unknown, key: unknown): Promise<ScannedTable | null> {
  // QR lama tanpa kunci harus kembali ke layar scan, sebelum mengakses secret server.
  if (typeof id !== "string" || typeof key !== "string" || !key || key.length > 64 || !/^[A-Za-z0-9_-]{1,40}$/.test(id)) return null;
  if (!same(key, tableKey(id))) return null;
  const result = await cloudDb().from("cafe_tables").select("id,label,status").eq("id", id).maybeSingle(); checkCloud(result.error);
  return result.data ? { ...result.data, key } as ScannedTable : null;
}
export async function createCloudOrder(body: unknown, browserHash: string): Promise<{ order: Order; accessToken: string }> {
  const raw = objectValue(body);
  const ticket = await checkoutTicket(raw.scanTicket, browserHash);
  const source = await qrSource(ticket.source_id, tableKey(ticket.source_id), true);
  const input = createOrderInput({ ...raw, fulfillment: source.order_mode ?? "dine_in", tableCode: source.id });
  const order = await cloudRpc<Order>("cafesite_checkout", { input: { ...input, tableCode: source.id, ticketHash: ticket.token_hash, browserHash, payloadHash: digestValue(JSON.stringify(input)) } });
  return { order, accessToken: orderAccessToken(order.id) };
}
export async function readCloudOrder(id: string, token: string | null): Promise<Order> {
  uuidValue(id);
  if (!token || !same(textValue(token, "Token", 128), orderAccessToken(id))) throw new HttpError(403, "Buka pesanan dari browser yang digunakan saat memesan.");
  const order = await cloudRpc<Order | null>("cafesite_order_document", { order_uuid: id });
  if (!order) throw new HttpError(404, "Pesanan tidak ditemukan.");
  return order;
}
