import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { cloudDb, checkCloud } from "./cloud-db";
import { isCloudPrimaryEnv } from "./storage-mode";
import { digestValue, sameText, tableKey } from "./order-security";
import { HttpError } from "./validation";
import type { ScanGrant, OrderTable } from "@/types";

const COOKIE = "cafesite-scan-browser";
export interface CheckoutTicket {
  token_hash: string;
  browser_hash: string;
  source_id: string;
  expires_at: string;
  used_order_id: string | null;
  request_key: string | null;
  payload_hash: string | null;
}
export async function scanBrowserHash(create = false): Promise<string> {
  const jar = await cookies();
  let browser = jar.get(COOKIE)?.value;
  if (!browser || !/^[a-f0-9]{64}$/.test(browser)) {
    if (!create)
      throw new HttpError(
        403,
        "Scan QR lagi dari browser ini sebelum memesan.",
      );
    browser = randomBytes(32).toString("hex");
    jar.set(COOKIE, browser, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 86400,
    });
  }
  return digestValue(browser);
}
export async function qrSource(
  id: unknown,
  key: unknown,
  allowDirty = false,
): Promise<OrderTable> {
  if (
    typeof id !== "string" ||
    !/^[A-Za-z0-9_-]{1,40}$/.test(id) ||
    typeof key !== "string" ||
    !key ||
    !sameText(key, tableKey(id))
  )
    throw new HttpError(
      403,
      "QR tidak dikenali. Scan QR yang disediakan staf.",
    );
  let source: OrderTable | null;
  if (isCloudPrimaryEnv()) {
    const result = await cloudDb()
      .from("cafe_tables")
      .select("id,label,status,order_mode")
      .eq("id", id)
      .maybeSingle();
    checkCloud(result.error);
    source = result.data as OrderTable | null;
  } else
    source = getLocalDb()
      .prepare("SELECT id,label,status,order_mode FROM cafe_tables WHERE id=?")
      .get(id) as unknown as OrderTable | null;
  if (!source)
    throw new HttpError(404, "Sumber QR sudah tidak tersedia. Hubungi staf.");
  if (
    !allowDirty &&
    source.order_mode !== "takeaway" &&
    source.status === "dirty"
  )
    throw new HttpError(
      409,
      "Meja perlu disiapkan dahulu. Hubungi staf kedai.",
    );
  return source;
}
export async function issueScanGrant(
  id: unknown,
  key: unknown,
): Promise<ScanGrant> {
  const source = await qrSource(id, key);
  const browser_hash = await scanBrowserHash(true);
  const ticket = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();
  const token_hash = digestValue(ticket);
  if (isCloudPrimaryEnv()) {
    const result = await cloudDb()
      .from("order_scan_tickets")
      .insert({
        token_hash,
        browser_hash,
        source_id: source.id,
        expires_at: expiresAt,
      });
    checkCloud(result.error);
  } else
    getLocalDb()
      .prepare(
        "INSERT INTO order_scan_tickets(token_hash,browser_hash,source_id,expires_at) VALUES(?,?,?,?)",
      )
      .run(token_hash, browser_hash, source.id, expiresAt);
  return { ticket, expiresAt, source };
}
export async function checkoutTicket(
  ticket: unknown,
  browserHash: string,
): Promise<CheckoutTicket> {
  if (typeof ticket !== "string" || !/^[a-f0-9]{64}$/.test(ticket)) {
    throw new HttpError(403, "Scan QR baru dari browser ini sebelum mengirim pesanan.");
  }
  const hash = digestValue(ticket);
  let row: CheckoutTicket | null;
  if (isCloudPrimaryEnv()) {
    const result = await cloudDb()
      .from("order_scan_tickets")
      .select("*")
      .eq("token_hash", hash)
      .maybeSingle();
    checkCloud(result.error);
    row = result.data as CheckoutTicket | null;
  } else
    row = getLocalDb()
      .prepare("SELECT * FROM order_scan_tickets WHERE token_hash=?")
      .get(hash) as unknown as CheckoutTicket | null;
  if (!row || row.browser_hash !== browserHash)
    throw new HttpError(
      403,
      "Scan QR baru dari browser ini sebelum mengirim pesanan.",
    );
  if (!row.used_order_id && Date.parse(row.expires_at) <= Date.now())
    throw new HttpError(
      409,
      "Tiket scan kedaluwarsa. Scan QR lagi; keranjangmu tetap tersimpan.",
    );
  return row;
}
