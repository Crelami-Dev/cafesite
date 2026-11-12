import assert from "node:assert/strict";
import fs from "node:fs";
import { parseEnv } from "node:util";
import { createHmac, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
const origin = process.env.ORDER_TEST_ORIGIN || "http://localhost:3012";
const env = parseEnv(fs.readFileSync(".env.local","utf8"));
const fixture = JSON.parse(fs.readFileSync(".vercel/order-flow-e2e.json","utf8"));
const sign = id => createHmac("sha256",env.ORDER_ACCESS_SECRET).update(`table:${id}`).digest("base64url").slice(0,16);
const results = [];
function check(name,ok) { results.push({name,ok}); assert.ok(ok,name); console.log("PASS "+name); }
function browser() {
  const cookies = new Map();
  return { cookies, async request(path,method="GET",body,token) {
    const response=await fetch(origin+path,{method,headers:{origin,"Content-Type":"application/json",...(cookies.size?{Cookie:[...cookies].map(([key,value])=>`${key}=${value}`).join("; ")}:{ }),...(token?{"X-Order-Token":token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    for(const entry of response.headers.getSetCookie()) {const pair=entry.split(";")[0],eq=pair.indexOf("=");cookies.set(pair.slice(0,eq),pair.slice(eq+1));}
    const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={html:text};}return {status:response.status,data};
  }};
}
const a=browser(),b=browser(),cashier=browser(),stranger=browser();
let phone=Number(String(Date.now()).slice(-10));
const menuId=(await a.request("/api/catalog")).data.menu.find(item => item.isAvailable !== false).id;
async function grant(client,id="TEST-A1") { const r=await client.request("/api/order-scan","POST",{meja:id,k:sign(id)});assert.equal(r.status,200,JSON.stringify(r.data));return r.data; }
async function order(client,id="TEST-A1") { const ticket=await grant(client,id);const input={customerName:"Test buyer",phone:String(++phone),scanTicket:ticket.ticket,paymentMethod:"cod",idempotencyKey:randomUUID(),fulfillment:id==="TEST-A1"?"takeaway":"dine_in",items:[{menuItemId:menuId,quantity:1,notes:"test"}]};const r=await client.request("/api/orders","POST",input);assert.equal(r.status,201,JSON.stringify(r.data));return {...r.data,input,grant:ticket}; }
const login=await cashier.request("/api/local-auth","POST",{email:fixture.email,password:fixture.password});check("cashier login",login.status===200);
const first=await order(a),second=await order(b);
check("shared table permits separate orders",first.order.id!==second.order.id&&first.order.table_id===second.order.table_id);
check("server ignores forged fulfillment",first.order.fulfillment==="dine_in");
check("other browser cannot read by URL",(await stranger.request(`/api/orders/${first.order.id}`)).status===404);
check("another order token cannot read first order",(await b.request(`/api/orders/${first.order.id}`,"GET",undefined,second.accessToken)).status===404);
const batch=await a.request("/api/orders/lookup","POST",{orders:[{id:first.order.id,token:first.accessToken},{id:second.order.id,token:first.accessToken}]});
check("batch lookup returns owned order only",batch.status===200&&batch.data.orders.length===1&&batch.data.orders[0].id===first.order.id);
check("same checkout retry returns same order",(await a.request("/api/orders","POST",first.input)).data.order.id===first.order.id);
check("ticket cannot make second order",(await a.request("/api/orders","POST",{...first.input,idempotencyKey:randomUUID()})).status===409);
check("ticket cannot move between browsers",(await b.request("/api/orders","POST",first.input)).status===403);
const prepare=await cashier.request("/api/admin/orders","PATCH",{id:first.order.id,status:"preparing",expectedUpdatedAt:first.order.updated_at});check("kitchen cannot process unpaid order",prepare.status===409);
const edit=await a.request(`/api/orders/${first.order.id}`,"PATCH",{expectedUpdatedAt:first.order.updated_at,items:[{menuItemId:menuId,quantity:2,notes:"new note"}]},first.accessToken);
check("customer edits unpaid order with recalculated total",edit.status===200&&edit.data.order.total===first.order.total*2);
check("cashier stale total rejected",(await cashier.request("/api/admin/orders","PATCH",{id:first.order.id,status:"preparing",markPaid:true,expectedUpdatedAt:first.order.updated_at})).status===409);
check("cashier proof requires staff login",(await stranger.request("/api/admin/orders/resolve-qr","POST",{payload:edit.data.cashierQr})).status===401);
const resolved=await cashier.request("/api/admin/orders/resolve-qr","POST",{payload:edit.data.cashierQr});check("cashier QR resolves latest total",resolved.status===200&&resolved.data.order.total===edit.data.order.total);
const paid=await cashier.request("/api/admin/orders","PATCH",{id:first.order.id,status:"preparing",markPaid:true,expectedUpdatedAt:edit.data.order.updated_at});
check("cashier pays and processes atomically",paid.status===200&&paid.data.order.payment_status==="paid"&&paid.data.order.status==="preparing");
check("paid order cannot be edited",(await a.request(`/api/orders/${first.order.id}`,"PATCH",{expectedUpdatedAt:paid.data.order.updated_at,items:[{menuItemId:menuId,quantity:3,notes:""}]},first.accessToken)).status===409);
check("duplicate payment rejected",(await cashier.request("/api/admin/orders","PATCH",{id:first.order.id,markPaid:true,expectedUpdatedAt:paid.data.order.updated_at})).status===409);
const takeaway=await order(a,"TKW-01");check("takeaway never claims a seat",takeaway.order.fulfillment==="takeaway"&&takeaway.order.table_id===null);
const pendingAgain=await order(a,"TKW-01");check("multiple unpaid orders stay separate",pendingAgain.order.id!==takeaway.order.id);
const ready=await cashier.request("/api/admin/orders","PATCH",{id:first.order.id,status:"ready",expectedUpdatedAt:paid.data.order.updated_at});check("ready state available to owner",ready.status===200&&(await a.request(`/api/orders/${first.order.id}`,"GET",undefined,first.accessToken)).data.order.status==="ready");
const fresh=await grant(a,"TKW-01");const db=new DatabaseSync(fixture.db);db.prepare("UPDATE order_scan_tickets SET expires_at='2000-01-01T00:00:00Z' WHERE token_hash=?").run((await import("node:crypto")).createHash("sha256").update(fresh.ticket).digest("hex"));db.close();check("expired ticket asks for fresh scan",(await a.request("/api/orders","POST",{...takeaway.input,scanTicket:fresh.ticket,idempotencyKey:randomUUID()})).status===409);
fs.writeFileSync(".vercel/order-flow-http-results.json",JSON.stringify({origin,results,orders:[first,second,takeaway,pendingAgain].map(value=>({id:value.order.id,token:value.accessToken})),customerCookies:Object.fromEntries(a.cookies),cashierCookies:Object.fromEntries(cashier.cookies)},null,2));
