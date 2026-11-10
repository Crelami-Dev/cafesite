import { listLocalOrders, updateLocalOrder } from "@/lib/server/local-admin";
import { localError, localJson } from "@/lib/server/local-api";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { objectValue } from "@/lib/server/validation";

export async function GET(request: Request): Promise<Response> {
  try { await requireLocalAdmin(request); return localJson(listLocalOrders()); } catch (error) { return localError(error); }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    await requireLocalAdmin(request);
    return localJson(updateLocalOrder(objectValue(await request.json().catch(() => null))));
  } catch (error) { return localError(error); }
}
