import { apiError, bodyJson, json } from "@/lib/server/api";
import { assertSameOrigin, isLocalMode } from "@/lib/server/local-session";
import {createCloudOrder} from "@/lib/server/cloud-orders";
import { scanBrowserHash } from "@/lib/server/order-tickets";

export async function POST(request: Request): Promise<Response> {
  try {
    if (isLocalMode()) {
      // Mode lokal (SQLite): tanpa akun pelanggan. Tolak kiriman dari situs lain.
      assertSameOrigin(request);
      const { createLocalOrder } = await import("@/lib/server/local-orders");
      return json(await createLocalOrder(await bodyJson(request), await scanBrowserHash()), 201);
    }
    assertSameOrigin(request);
    return json(await createCloudOrder(await bodyJson(request), await scanBrowserHash()),201);
  } catch (error) { return apiError(error); }
}
