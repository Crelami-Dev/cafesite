import {isCloudPrimaryEnv} from "@/lib/server/storage-mode";
import {cloudReport} from "@/lib/server/cloud-admin";
import { dashboardReport } from "@/lib/server/dashboard-reports";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { localError,localJson } from "@/lib/server/local-api";
export async function GET(request: Request): Promise<Response> {
 try { await requireLocalAdmin(request,"reports"); const params=new URL(request.url).searchParams; const report=isCloudPrimaryEnv()?await cloudReport(params):dashboardReport(params);
  if(params.get("format")==="csv") { const csv=["Tanggal,Penjualan lunas,Transaksi",...report.daily.map(r=>`${r.day},${r.revenue},${r.count}`),`Total,${report.revenue},${report.paidOrders}`,`Transaksi dengan waktu perkiraan,${report.estimated},`].join("\r\n"); return new Response("\uFEFF"+csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="laporan-${report.from}-${report.to}.csv"`,"Cache-Control":"no-store"}}); }
  return localJson(report);
 } catch(error) { return localError(error); }
}
