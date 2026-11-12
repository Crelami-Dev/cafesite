import { requireLocalAdmin } from "@/lib/server/local-session";
import { apiError, bodyJson, json } from "@/lib/server/api";
import { cashierOrderId } from "@/lib/server/order-security";
import { isCloudPrimaryEnv } from "@/lib/server/storage-mode";
import { cloudRpc, cloudDb, checkCloud } from "@/lib/server/cloud-db";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { readLocalOrder, orderAccessToken } from "@/lib/server/local-orders";
import { textValue, HttpError } from "@/lib/server/validation";
export async function POST(request: Request): Promise<Response> {
  try {
    await requireLocalAdmin(request, "orders");
    const body = await bodyJson(request);
    const payload = textValue(body.payload, "QR atau nomor pesanan", 256).trim();
    const number = /^(?:#?A-)?([0-9]{1,10})$/i.exec(payload);
    let id: string;
    if (number) {
      const queue = Number(number[1]);
      // Resolve the exact queue number, never a fuzzy match against another customer's name.
      let rows: { id: string }[];
      if (isCloudPrimaryEnv()) {
        const result = await cloudDb().from("orders").select("id").eq("queue_number", queue).limit(2);
        checkCloud(result.error);
        rows = result.data ?? [];
      } else {
        rows = getLocalDb().prepare("SELECT id FROM orders WHERE queue_number=? LIMIT 2").all(queue) as { id: string }[];
      }
      if (rows.length !== 1) throw new HttpError(404, "Nomor pesanan tidak ditemukan atau tidak unik. Gunakan QR pelanggan.");
      id = rows[0].id;
    } else id = cashierOrderId(payload);
    const order = isCloudPrimaryEnv()
      ? await cloudRpc("cafesite_order_document", { order_uuid: id })
      : readLocalOrder(id, orderAccessToken(id));
    return json({ order });
  } catch (error) {
    return apiError(error);
  }
}
