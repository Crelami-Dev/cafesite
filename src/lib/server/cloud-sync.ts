import "server-only";
import {getLocalDb} from "@/lib/db/dev-sqlite";
import {getServiceSupabase} from "@/lib/supabase/server";
import {isCloudPrimaryEnv} from "./storage-mode";
export {isCloudPrimaryEnv} from "./storage-mode";

/** Local backups are isolated from the live Vercel tables. No automatic restore or dual-master writes. */
function markPending():void {
 if(isCloudPrimaryEnv()||process.env.NODE_ENV==="test")return;
 getLocalDb().prepare("INSERT INTO content(key,data) VALUES('_backup_pending',?) ON CONFLICT(key) DO UPDATE SET data=excluded.data").run(JSON.stringify(new Date().toISOString()));
}
export function mirrorWriteToSupabase(_resource:string,_payload:Record<string,unknown>):void {markPending();}
export function mirrorDeleteToSupabase(_resource:string,_id:string):void {markPending();}
export function mirrorOrderToSupabase(_id:string):void {markPending();}
/**
 * Salin SATU akun staf (beserta izin modulnya) dari SQLite ke tabel live Supabase, supaya akun itu
 * juga bisa masuk di situs publik. Hanya akun; data kafe lain tetap lewat backup terisolasi.
 * Mengembalikan "off" bila Supabase tidak dipakai, "pending" bila gagal (backup ditandai tertunda).
 */
async function mirrorStaffRow(id:string,revokeSessions=false):Promise<"saved"|"pending"|"off"> {
 if(isCloudPrimaryEnv()||process.env.NODE_ENV==="test")return "off";
 const cloud=getServiceSupabase();if(!cloud)return "off";
 try{
  const db=getLocalDb();
  const row=db.prepare("SELECT * FROM staff_accounts WHERE id=?").get(id);
  if(!row)return "off";
  const modules=db.prepare("SELECT module FROM staff_permissions WHERE account_id=?").all(id).map(p=>String(p.module));
  if(row.role==="admin"){
   const probe=await cloud.from("staff_accounts").select("role").limit(1);
   if(probe.error?.code==="42703"){console.warn("[staff-sync] Jalankan supabase/09_staff_roles.sql agar peran admin ikut tersalin.");markPending();return "pending";}
  }
  const {error}=await cloud.rpc("cafesite_save_staff",{
   input:{id:String(row.id),name:String(row.name),email:String(row.email).toLowerCase(),salt:String(row.salt),password_hash:String(row.password_hash),enabled:Number(row.enabled)===1?1:0,must_change_password:Number(row.must_change_password)===1?1:0,role:row.role==="admin"?"admin":"staff",created_at:String(row.created_at)},
   permissions:modules,
   revoke_sessions:revokeSessions,
  }).abortSignal(AbortSignal.timeout(6000));
  if(error){console.warn("[staff-sync] Akun belum tersalin ke Supabase:",error.code,error.message);markPending();return "pending";}
  return "saved";
 }catch(error){
  console.warn("[staff-sync] Akun belum tersalin ke Supabase:",error instanceof Error?error.name:"error");
  markPending();return "pending";
 }
}
export interface StaffSyncResult {cloud:"saved"|"pending"|"off";auth:"saved"|"pending"|"off"}
/**
 * Salin akun ke Supabase: tabel staff_accounts (dipakai login) DAN Supabase Authentication (Authentication → Users).
 * `plainPassword` hanya ada saat akun dibuat/di-reset/diganti kata sandinya.
 */
export async function mirrorStaffToSupabase(id:string,revokeSessions=false,plainPassword?:string):Promise<StaffSyncResult> {
 const cloudState=await mirrorStaffRow(id,revokeSessions);
 const cloud=getServiceSupabase();
 if(cloudState==="off"||!cloud)return {cloud:cloudState,auth:"off"};
 const row=getLocalDb().prepare("SELECT name,email,role,enabled FROM staff_accounts WHERE id=?").get(id);
 if(!row)return {cloud:cloudState,auth:"off"};
 const {upsertAuthUser}=await import("./supabase-auth-users");
 const auth=await upsertAuthUser(cloud,{email:String(row.email).toLowerCase(),name:String(row.name),role:row.role==="admin"?"admin":"staff",enabled:Number(row.enabled)===1,password:plainPassword});
 return {cloud:cloudState,auth};
}
/** Hapus akun di Supabase: tabel staff_accounts (+ izin & sesi) dan Authentication. */
export async function mirrorDeleteStaffToSupabase(id:string,email:string):Promise<StaffSyncResult> {
 const cloudState=await mirrorDeleteStaffRow(id);
 const cloud=getServiceSupabase();
 if(cloudState==="off"||!cloud)return {cloud:cloudState,auth:"off"};
 const {deleteAuthUser}=await import("./supabase-auth-users");
 return {cloud:cloudState,auth:await deleteAuthUser(cloud,email)};
}
/** Hapus satu akun staf di Supabase (izin ikut terhapus lewat ON DELETE CASCADE) beserta sesinya. */
async function mirrorDeleteStaffRow(id:string):Promise<"saved"|"pending"|"off"> {
 if(isCloudPrimaryEnv()||process.env.NODE_ENV==="test")return "off";
 const cloud=getServiceSupabase();if(!cloud)return "off";
 try{
  await cloud.from("admin_sessions").delete().eq("account_id",id).abortSignal(AbortSignal.timeout(6000));
  const {error}=await cloud.from("staff_accounts").delete().eq("id",id).abortSignal(AbortSignal.timeout(6000));
  if(error){console.warn("[staff-sync] Akun belum terhapus di Supabase:",error.code,error.message);markPending();return "pending";}
  return "saved";
 }catch(error){
  console.warn("[staff-sync] Akun belum terhapus di Supabase:",error instanceof Error?error.name:"error");
  markPending();return "pending";
 }
}
export interface BackupStatus {state:"cloud"|"unconfigured"|"pending"|"saved";savedAt?:string}
const state=globalThis as typeof globalThis & {__cafeBackupPromise?:Promise<BackupStatus>};
export function backupStatus():BackupStatus {
 if(isCloudPrimaryEnv())return {state:"cloud"};
 if(!getServiceSupabase())return {state:"unconfigured"};
 const db=getLocalDb();
 if(db.prepare("SELECT 1 FROM content WHERE key='_backup_pending'").get())return {state:"pending"};
 const saved=db.prepare("SELECT data FROM content WHERE key='_backup_saved'").get();
 return saved?{state:"saved",savedAt:JSON.parse(String(saved.data)) as string}:{state:"pending"};
}
export async function flushCloudBackup(force=false):Promise<BackupStatus> {
 if(isCloudPrimaryEnv()||process.env.NODE_ENV==="test")return {state:"cloud"};
 const cloud=getServiceSupabase();if(!cloud)return {state:"unconfigured"};
 if(state.__cafeBackupPromise)return state.__cafeBackupPromise;
 if(!force&&backupStatus().state==="saved")return backupStatus();
 state.__cafeBackupPromise=(async()=>{
  const db=getLocalDb();
  const version=db.prepare("SELECT data FROM content WHERE key='_backup_pending'").get()?.data;
  const tables=["content","menu_items","floors","cafe_tables","orders","order_items","order_milestones","staff_accounts","staff_permissions"];
  const snapshot:Record<string,unknown>={version:1};
  for(const table of tables)snapshot[table]=db.prepare(`SELECT * FROM ${table}`).all().filter(row=>table!=="content"||!String(row.key).startsWith("_backup"));
  const {error}=await cloud.from("cafesite_backups").upsert({id:process.env.SQLITE_BACKUP_ID||"local-kedai",snapshot,updated_at:new Date().toISOString()}).abortSignal(AbortSignal.timeout(10000));
  if(error){console.warn("[backup] Cadangan tertunda:",error.code);return {state:"pending"} as BackupStatus;}
  // A concurrent local write must not lose its pending marker.
  const current=db.prepare("SELECT data FROM content WHERE key='_backup_pending'").get()?.data;
  if(current===version)db.prepare("DELETE FROM content WHERE key='_backup_pending'").run();
  const savedAt=new Date().toISOString();db.prepare("INSERT INTO content(key,data) VALUES('_backup_saved',?) ON CONFLICT(key) DO UPDATE SET data=excluded.data").run(JSON.stringify(savedAt));
  return backupStatus();
 })().catch(error=>{console.warn("[backup] Cadangan tertunda:",error instanceof Error?error.name:"error");return {state:"pending"} as BackupStatus;}).finally(()=>{state.__cafeBackupPromise=undefined;});
 return state.__cafeBackupPromise;
}
export async function ensureCloudSqliteSync():Promise<void>{await flushCloudBackup();}
export async function pushFullSqliteSnapshotToSupabase():Promise<void>{await flushCloudBackup(true);}
