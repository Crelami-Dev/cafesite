import "server-only";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import { HttpError } from "./validation";
import type { DashboardReport } from "@/types";
export function jakartaDay(date = new Date()): string { return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(date); }
export function reportRange(params: URLSearchParams): {from:string;to:string;start:string;end:string} {
 const today=jakartaDay(); const from=params.get("from") || today; const to=params.get("to") || today;
 if (![from,to].every(d=>/^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0,10)===d) || from>to) throw new HttpError(400,"Rentang tanggal tidak valid.");
 if (Date.parse(to)-Date.parse(from)>366*86400000) throw new HttpError(400,"Pilih rentang maksimal satu tahun.");
 return {from,to,start:new Date(`${from}T00:00:00+07:00`).toISOString(),end:new Date(Date.parse(`${to}T00:00:00+07:00`)+86400000).toISOString()};
}
export function dashboardReport(params: URLSearchParams): DashboardReport {
 const db=getLocalDb(); const {from,to,start,end}=reportRange(params);
 const filter="o.payment_status='paid' AND o.status<>'cancelled' AND COALESCE(m.paid_at,o.updated_at)>=? AND COALESCE(m.paid_at,o.updated_at)<?";
 const join="orders o LEFT JOIN order_milestones m ON m.order_id=o.id";
 const totals=db.prepare(`SELECT COALESCE(SUM(o.paid_amount),0) revenue,COUNT(*) count,COALESCE(SUM(CASE WHEN m.estimated=1 OR m.paid_at IS NULL THEN 1 ELSE 0 END),0) estimated FROM ${join} WHERE ${filter}`).get(start,end)!;
 const daily=db.prepare(`SELECT date(COALESCE(m.paid_at,o.updated_at),'+7 hours') day,SUM(o.paid_amount) revenue,COUNT(*) count FROM ${join} WHERE ${filter} GROUP BY day ORDER BY day`).all(start,end);
 const topItems=db.prepare(`SELECT i.name,SUM(i.quantity) quantity,SUM(i.unit_price*i.quantity) revenue FROM order_items i JOIN orders o ON o.id=i.order_id LEFT JOIN order_milestones m ON m.order_id=o.id WHERE ${filter} GROUP BY i.menu_item_id,i.name ORDER BY quantity DESC LIMIT 10`).all(start,end);
 const count=Number(totals.count); const revenue=Number(totals.revenue);
 return {from,to,revenue,paidOrders:count,average:count?Math.round(revenue/count):0,estimated:Number(totals.estimated),orderCount:Number(db.prepare("SELECT COUNT(*) count FROM orders WHERE created_at>=? AND created_at<?").get(start,end)?.count??0),daily:daily.map(r=>({day:String(r.day),revenue:Number(r.revenue),count:Number(r.count)})),topItems:topItems.map(r=>({name:String(r.name),quantity:Number(r.quantity),revenue:Number(r.revenue)}))};
}
