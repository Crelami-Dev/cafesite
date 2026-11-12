import "server-only";
import { randomUUID } from "node:crypto";
import { cloudDb, checkCloud, cloudRpc } from "./cloud-db";
import { HttpError, textValue, objectValue, numberValue, uuidValue } from "./validation";
import { validateContent } from "./dashboard-content";
import { cafeInfo } from "@/data/cafe";
import { tableKey } from "./local-orders";
import { reportRange } from "./dashboard-reports";
import type { DashboardReport, Order } from "@/types";

const CONTENT = ["cafe", "gallery", "testimonials", "faq", "location", "categories"];
export async function cloudReadManage(resource: string): Promise<unknown> {
  const db = cloudDb();
  if (CONTENT.includes(resource)) {
    const r = await db.from("content").select("data").eq("key", resource).maybeSingle(); checkCloud(r.error);
    return { data: r.data?.data ?? (resource === "cafe" ? cafeInfo : resource === "categories" ? null : []) };
  }
  if (resource === "menu") {
    const r = await db.from("menu_items").select("id,data,is_available,sort_order").order("sort_order").order("id"); checkCloud(r.error); return { data: r.data };
  }
  if (resource === "tables") {
    const [floors, tables, orders] = await Promise.all([db.from("floors").select("*").order("sort_order"), db.from("cafe_tables").select("*").order("id"), db.from("orders").select("id,table_id,queue_number,customer_name,status,total").in("status", ["waiting", "preparing", "ready"])]);
    [floors, tables, orders].forEach(r => checkCloud(r.error));
    // Tanpa ORDER_ACCESS_SECRET kunci QR tidak bisa dibuat; halaman Meja tetap dibuka, hanya QR yang belum aktif.
    const qrKey = (id: string): string | undefined => { try { return tableKey(id); } catch { return undefined; } };
    return { floors: floors.data, qrReady: qrKey("probe") !== undefined, tables: (tables.data ?? []).map(t => ({ ...t, qr_key: qrKey(t.id), active_order: orders.data?.find(o => o.table_id === t.id) ?? null, active_orders: (orders.data ?? []).filter(o => o.table_id === t.id) })) };
  }
  throw new HttpError(400, "Modul tidak tersedia pada endpoint ini.");
}
export async function cloudWriteManage(resource: string, body: Record<string, unknown>): Promise<{ ok: true }> {
  const db = cloudDb();
  if (CONTENT.includes(resource)) { validateContent(resource, body.data); checkCloud((await db.from("content").upsert({ key: resource, data: body.data })).error); }
  else if (resource === "menu") {
    if (Array.isArray(body.reorder)) {
      const reorder = body.reorder.map(raw => { const r = objectValue(raw); return { id: textValue(r.id, "ID", 80), sort_order: numberValue(r.sort_order, "Urutan", 0, 100000) }; });
      await cloudRpc("cafesite_manage", { resource: "menu-reorder", input: { reorder } });
    } else {
      const item = objectValue(body.item); const id = textValue(item.id, "ID menu", 80); const price = numberValue(item.price, "Harga", 0, 10000000);
      textValue(item.name, "Nama", 120); textValue(item.category, "Kategori", 80);
      const row = { id, data: { ...item, id, price }, is_available: item.isAvailable !== false, sort_order: numberValue(body.sortOrder ?? 0, "Urutan", 0, 100000) };
      if (body.create === true) {
        // Menu BARU: INSERT biasa; ID kembar ditolak database (23505) alih-alih menimpa menu lama.
        const r = await db.from("menu_items").insert(row);
        if (r.error?.code === "23505") throw new HttpError(409, `Menu dengan ID "${id}" sudah ada. Ubah nama atau ID menu baru.`);
        checkCloud(r.error);
      } else checkCloud((await db.from("menu_items").upsert(row)).error);
    }
  } else if (resource === "floors") {
    const f = objectValue(body.floor); await cloudRpc("cafesite_manage", { resource, input: { id: f.id ? uuidValue(f.id) : randomUUID(), name: textValue(f.name, "Nama lantai", 80), sort_order: numberValue(f.sortOrder, "Urutan", 0, 10000) } });
  } else if (resource === "tables") {
    const t = objectValue(body.table); const id = textValue(t.id, "Meja", 40);
    if (!/^[A-Za-z0-9_-]+$/.test(id) || !["available", "occupied", "dirty"].includes(String(t.status))) throw new HttpError(400, "Meja atau status tidak valid.");
    await cloudRpc("cafesite_manage", { resource, input: { id, floor_id: uuidValue(t.floorId), label: textValue(t.label, "Nama meja", 80), status: t.status } });
  } else throw new HttpError(400, "Aksi tidak tersedia.");
  return { ok: true };
}
export async function cloudDeleteManage(resource: string, body: Record<string, unknown>): Promise<{ ok: true }> {
  const tables: Record<string, string> = { menu: "menu_items", floors: "floors", tables: "cafe_tables" };
  if (!tables[resource]) throw new HttpError(400, "Penghapusan tidak tersedia.");
  checkCloud((await cloudDb().from(tables[resource]).delete().eq("id", textValue(body.id, "ID", 80))).error); return { ok: true };
}
export async function cloudListOrders(params: URLSearchParams): Promise<{ orders: Order[]; total: number; page: number; pages: number }> {
  const active = params.get("view") === "active"; const search = params.get("q")?.trim().slice(0, 100);
  const status = params.get("status");
  if (status && !["all", "waiting", "preparing", "ready", "completed", "cancelled"].includes(status)) throw new HttpError(400, "Status tidak valid.");
  const query = (): ReturnType<ReturnType<ReturnType<typeof cloudDb>["from"]>["select"]> => {
    let q = cloudDb().from("orders").select("*,items:order_items(*)", { count: "exact" });
    if (active) q = q.in("status", ["waiting", "preparing", "ready"]);
    else if (params.get("view") === "history") q = q.in("status", ["completed", "cancelled"]);
    if (params.get("id")) q = q.eq("id", uuidValue(params.get("id")));
    if (status && status !== "all") q = q.eq("status", status);
    if (search) { const safe = search.replace(/[(),.%_\\"']/g, " ").trim(); if (safe) q = q.or(`customer_name.ilike.*${safe}*,table_id.ilike.*${safe}*${/^\d+$/.test(safe) ? `,queue_number.eq.${safe}` : ""}`); }
    for (const key of ["from", "to"]) { const date = params.get(key); if (date) { const r = reportRange(new URLSearchParams({ from: date, to: date })); q = key === "from" ? q.gte("created_at", r.start) : q.lt("created_at", r.end); } }
    return q.order("created_at", { ascending: active }).order("id");
  };
  let page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  if (active) {
    const orders: Order[] = []; let total = 0;
    for (let offset = 0; ; offset += 500) { const r = await query().range(offset, offset + 499); checkCloud(r.error); total = r.count ?? 0; orders.push(...(r.data ?? []) as unknown as Order[]); if (offset + 500 >= total || !r.data?.length) break; }
    return { orders, total, page: 1, pages: 1 };
  }
  let r = await query().range((page - 1) * 25, page * 25 - 1); checkCloud(r.error);
  const total = r.count ?? 0; const pages = Math.max(1, Math.ceil(total / 25));
  if (page > pages) { page = pages; r = await query().range((page - 1) * 25, page * 25 - 1); checkCloud(r.error); }
  return { orders: (r.data ?? []) as unknown as Order[], total, page, pages };
}
export async function cloudReport(params: URLSearchParams): Promise<DashboardReport> {
  const { from, to, start, end } = reportRange(params);
  return { ...await cloudRpc<DashboardReport>("cafesite_report", { start_at: start, end_at: end }), from, to };
}
