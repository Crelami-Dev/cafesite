import {after} from "next/server";
import {flushCloudBackup} from "@/lib/server/cloud-sync";
import { changeStaffPassword, SESSION_COOKIE } from "@/lib/server/dashboard-auth";
import { cookies } from "next/headers";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { localError, localJson } from "@/lib/server/local-api";
import { objectValue, textValue } from "@/lib/server/validation";
export async function PUT(request: Request): Promise<Response> {
  after(async()=>{await flushCloudBackup();});
  try { const account = await requireLocalAdmin(request); const body=objectValue(await request.json()); await changeStaffPassword(account.profile.id,textValue(body.current,"Kata sandi saat ini",128),textValue(body.password,"Kata sandi baru",128)); (await cookies()).delete(SESSION_COOKIE); return localJson({ok:true}); } catch(error) { return localError(error); }
}
