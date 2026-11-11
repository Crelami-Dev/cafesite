import { backupStatus, flushCloudBackup } from "@/lib/server/cloud-sync";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { localJson, localError } from "@/lib/server/local-api";
export async function GET(request:Request):Promise<Response>{try{await requireLocalAdmin(request,"modules");return localJson(backupStatus());}catch(error){return localError(error);}}
export async function POST(request:Request):Promise<Response>{try{await requireLocalAdmin(request,"modules");return localJson(await flushCloudBackup(true));}catch(error){return localError(error);}}
