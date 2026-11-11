import { requireLocalAdmin } from "@/lib/server/local-session";
import { localError,localJson } from "@/lib/server/local-api";
import { dashboardReport } from "@/lib/server/dashboard-reports";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import type { DashboardSummary } from "@/types";
export async function GET(request: Request): Promise<Response> {
 try { const account=await requireLocalAdmin(request); const can=(id:string):boolean=>account.profile.role==="admin"||account.modules.some(m=>m.id===id&&m.enabled); const db=getLocalDb(); const data:DashboardSummary={};
 if(can("reports")||can("orders")){const r=dashboardReport(new URLSearchParams());if(can("reports"))data.revenue=r.revenue;data.orderCount=r.orderCount;}
 if(can("orders"))data.activeCount=Number(db.prepare("SELECT COUNT(*) n FROM orders WHERE status IN ('waiting','preparing','ready')").get()?.n??0);
 if(can("tables"))data.availableTables=Number(db.prepare("SELECT COUNT(*) n FROM cafe_tables WHERE status='available'").get()?.n??0);
 return localJson(data);
 } catch(error) {return localError(error);}
}
