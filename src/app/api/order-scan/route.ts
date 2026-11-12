import { apiError, bodyJson, json } from "@/lib/server/api";
import { assertSameOrigin } from "@/lib/server/local-session";
import { issueScanGrant } from "@/lib/server/order-tickets";
export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body = await bodyJson(request);
    return json(await issueScanGrant(body.meja, body.k));
  } catch (error) {
    return apiError(error);
  }
}
