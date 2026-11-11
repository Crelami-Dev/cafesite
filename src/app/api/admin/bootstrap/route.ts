import { localError, localJson } from "@/lib/server/local-api";
import { requireLocalAdmin } from "@/lib/server/local-session";

export async function GET(request: Request): Promise<Response> {
  try { return localJson(await requireLocalAdmin(request)); } catch (error) { return localError(error); }
}
