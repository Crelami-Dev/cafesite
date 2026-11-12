import { requireLocalAdmin } from "@/lib/server/local-session";
import { apiError, bodyJson, json } from "@/lib/server/api";
import { cashierOrderId } from "@/lib/server/order-security";
import { isCloudPrimaryEnv } from "@/lib/server/storage-mode";
import { cloudRpc } from "@/lib/server/cloud-db";
import { readLocalOrder, orderAccessToken } from "@/lib/server/local-orders";
import { textValue } from "@/lib/server/validation";
export async function POST(request: Request): Promise<Response> {
  try {
    await requireLocalAdmin(request, "orders");
    const body = await bodyJson(request);
    const id = cashierOrderId(textValue(body.payload, "QR", 256));
    const order = isCloudPrimaryEnv()
      ? await cloudRpc("cafesite_order_document", { order_uuid: id })
      : readLocalOrder(id, orderAccessToken(id));
    return json({ order });
  } catch (error) {
    return apiError(error);
  }
}
