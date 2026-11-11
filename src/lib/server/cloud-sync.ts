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
export function mirrorStaffToSupabase(_id:string):void {markPending();}
export function mirrorDeleteStaffToSupabase(_id:string):void {markPending();}
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
