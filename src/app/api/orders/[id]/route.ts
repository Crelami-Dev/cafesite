import { apiError, json } from "@/lib/server/api";
import { isLocalMode } from "@/lib/server/local-session";
import type { OrderRouteContext } from "@/types";

export async function GET(request: Request, context: OrderRouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    if (isLocalMode()) {
      const { readLocalOrder } = await import("@/lib/server/local-orders");
      return json({ order: readLocalOrder(id, request.headers.get("x-order-token")) });
    }
    const {readCloudOrder}=await import("@/lib/server/cloud-orders");
    return json({order:await readCloudOrder(id,request.headers.get("x-order-token"))});
  } catch (error) { return apiError(error); }
}

export async function POST(): Promise<Response> {
 return Response.json({error:"Menambah pesanan dilakukan lewat kasir."},{status:404});
}
