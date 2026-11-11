import { apiError, authenticate, bodyJson, dbError, json } from "@/lib/server/api";
import { isLocalMode } from "@/lib/server/local-session";
import { HttpError, itemInputs, uuidValue } from "@/lib/server/validation";
import type { OrderRouteContext } from "@/types";

export async function GET(request: Request, context: OrderRouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    if (isLocalMode()) {
      const { readLocalOrder } = await import("@/lib/server/local-orders");
      return json({ order: readLocalOrder(id, request.headers.get("x-order-token")) });
    }
    const { db, user } = await authenticate(request);
    const { data, error } = await db.from("orders").select("id,user_id").eq("id", id).eq("user_id", user.id).maybeSingle();
    dbError(error);
    if (!data) return Response.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    const result = await db.rpc("order_document", { order_uuid: id });
    dbError(result.error);
    return json({ order: result.data });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, context: OrderRouteContext): Promise<Response> {
  try {
    if (isLocalMode()) throw new HttpError(404, "Menambah pesanan dilakukan lewat kasir.");
    const { db, user } = await authenticate(request);
    const { id } = await context.params;
    const input = await bodyJson(request);
    const requestKey = uuidValue(input.idempotencyKey);
    const items = itemInputs(input.items);
    const { data, error } = await db.rpc("add_cafe_order_items", { actor: user.id, order_uuid: id, request_key: requestKey, line_items: items });
    dbError(error);
    return json({ order: data });
  } catch (error) { return apiError(error); }
}
