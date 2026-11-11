import { staffList, saveStaff } from "@/lib/server/dashboard-auth";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { localError, localJson } from "@/lib/server/local-api";
import { objectValue } from "@/lib/server/validation";
export async function GET(request: Request): Promise<Response> {
  try { await requireLocalAdmin(request,"modules"); return localJson({data:staffList()}); } catch(error) { return localError(error); }
}
export async function PUT(request: Request): Promise<Response> {
  try { await requireLocalAdmin(request,"modules"); return localJson(saveStaff(objectValue(await request.json().catch(()=>null)))); } catch(error) { return localError(error); }
}
