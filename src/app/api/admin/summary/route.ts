import {isCloudPrimaryEnv} from "@/lib/server/storage-mode";
import {cloudReport} from "@/lib/server/cloud-admin";
import {cloudDb,checkCloud} from "@/lib/server/cloud-db";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { localError,localJson } from "@/lib/server/local-api";
import { dashboardReport } from "@/lib/server/dashboard-reports";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import type { DashboardSummary } from "@/types";
export async function GET(request: Request): Promise<Response> {
 try { const account=await requireLocalAdmin(request); const can=(id:string):boolean=>account.profile.role==="admin"||account.modules.some(m=>m.id===id&&m.enabled); const db=isCloudPrimaryEnv()?null:getLocalDb(); const data:DashboardSummary={};
 if(can("reports")||can("orders")){const r=isCloudPrimaryEnv()?await cloudReport(new URLSearchParams()):dashboardReport(new URLSearchParams());if(can("reports"))data.revenue=r.revenue;data.orderCount=r.orderCount;}
 if(!db){const cloud=cloudDb();if(can("orders")){const r=await cloud.from("orders").select("id",{count:"exact",head:true}).in("status",["waiting","preparing","ready"]);checkCloud(r.error);data.activeCount=r.count??0;}if(can("tables")){const r=await cloud.from("cafe_tables").select("id",{count:"exact",head:true}).eq("status","available");checkCloud(r.error);data.availableTables=r.count??0;}return localJson(data);}
 if(can("orders"))data.activeCount=Number(db.prepare("SELECT COUNT(*) n FROM orders WHERE status IN ('waiting','preparing','ready')").get()?.n??0);
 if(can("tables"))data.availableTables=Number(db.prepare("SELECT COUNT(*) n FROM cafe_tables WHERE status='available'").get()?.n??0);
 return localJson(data);
 } catch(error) {return localError(error);}
}
