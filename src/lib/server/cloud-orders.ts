import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cloudDb, checkCloud, cloudRpc } from "./cloud-db";
import { tableKey, orderAccessToken } from "./local-orders";
import { createOrderInput, objectValue, textValue, uuidValue, HttpError } from "./validation";
import type { Order } from "@/types";
import type { ScannedTable } from "./local-orders";
function same(a: string, b: string): boolean { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }
export async function resolveCloudTable(id: unknown, key: unknown): Promise<ScannedTable | null> {
  if (typeof id !== "string" || typeof key !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(id) || !same(key, tableKey(id))) return null;
  const result = await cloudDb().from("cafe_tables").select("id,label,status").eq("id", id).maybeSingle(); checkCloud(result.error);
  return result.data ? { ...result.data, key } as ScannedTable : null;
}
export async function createCloudOrder(body: unknown): Promise<{ order: Order; accessToken: string }> {
  const raw = objectValue(body); const input = createOrderInput(raw);
  const scanned = await resolveCloudTable(raw.tableCode, raw.tableKey);
  if (!scanned) throw new HttpError(403, "Scan QR di meja dulu untuk memesan dari website.");
  const order = await cloudRpc<Order>("cafesite_checkout", { input: { ...input, tableCode: scanned.id } });
  return { order, accessToken: orderAccessToken(order.id) };
}
export async function readCloudOrder(id: string, token: string | null): Promise<Order> {
  uuidValue(id);
  if (!token || !same(textValue(token, "Token", 128), orderAccessToken(id))) throw new HttpError(403, "Buka pesanan dari browser yang digunakan saat memesan.");
  const order = await cloudRpc<Order | null>("cafesite_order_document", { order_uuid: id });
  if (!order) throw new HttpError(404, "Pesanan tidak ditemukan.");
  return order;
}
