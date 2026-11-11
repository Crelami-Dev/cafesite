import {after} from "next/server";
import {flushCloudBackup} from "@/lib/server/cloud-sync";
import {isCloudPrimaryEnv} from "@/lib/server/storage-mode";
import {cloudListOrders} from "@/lib/server/cloud-admin";
import {cloudRpc} from "@/lib/server/cloud-db";
import { listLocalOrders, updateLocalOrder } from "@/lib/server/local-admin";
import { localError, localJson } from "@/lib/server/local-api";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { objectValue } from "@/lib/server/validation";

export async function GET(request: Request): Promise<Response> {
  try { await requireLocalAdmin(request); return localJson(isCloudPrimaryEnv()?await cloudListOrders(new URL(request.url).searchParams):listLocalOrders(new URL(request.url).searchParams)); } catch (error) { return localError(error); }
}

export async function PATCH(request: Request): Promise<Response> {
  after(async()=>{await flushCloudBackup();});
  try {
    await requireLocalAdmin(request);
    const input=objectValue(await request.json().catch(()=>null));
    return localJson(isCloudPrimaryEnv()?await cloudRpc("cafesite_update_order",{input}):updateLocalOrder(input));
  } catch (error) { return localError(error); }
}
