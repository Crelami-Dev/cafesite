import { localBootstrap } from "@/lib/server/local-admin";
import { localError, localJson } from "@/lib/server/local-api";
import { requireLocalAdmin } from "@/lib/server/local-session";

export async function GET(request: Request): Promise<Response> {
  try { await requireLocalAdmin(request); return localJson(localBootstrap()); } catch (error) { return localError(error); }
}
