import "server-only";
import {
  createHmac,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isCloudPrimaryEnv } from "./storage-mode";
import { HttpError } from "./validation";

let secret: string | null = null;
function accessSecret(): string {
  if (secret) return secret;
  if ((process.env.ORDER_ACCESS_SECRET?.length ?? 0) >= 16)
    return (secret = process.env.ORDER_ACCESS_SECRET!);
  if (isCloudPrimaryEnv())
    throw new HttpError(503, "Kunci QR dan pesanan cloud belum dikonfigurasi.");
  const file = path.join(process.cwd(), ".data", "order-access.secret");
  if (existsSync(file)) secret = readFileSync(file, "utf8").trim();
  if (!secret || secret.length < 32) {
    secret = randomBytes(32).toString("base64url");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, secret, { mode: 0o600 });
  }
  return secret;
}
export function signOrderValue(purpose: string, value: string): string {
  return createHmac("sha256", accessSecret())
    .update(`${purpose}:${value}`)
    .digest("base64url");
}
export function orderAccessToken(id: string): string {
  return signOrderValue("order", id);
}
export function tableKey(id: string): string {
  return signOrderValue("table", id).slice(0, 16);
}
export function sameText(a: string, b: string): boolean {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function digestValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
export function cashierQr(id: string): string {
  return `cafesite:cashier:${id}:${signOrderValue("cashier", id)}`;
}
export function cashierOrderId(payload: string): string {
  const match = /^cafesite:cashier:([0-9a-f-]{36}):([A-Za-z0-9_-]{43})$/.exec(
    payload,
  );
  if (!match || !sameText(match[2], signOrderValue("cashier", match[1])))
    throw new HttpError(400, "QR bukti pesanan tidak valid.");
  return match[1];
}
