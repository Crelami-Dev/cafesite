import {after} from "next/server";
import {flushCloudBackup} from "@/lib/server/cloud-sync";
import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CONTENT_TAG } from "@/lib/content";
import { deleteLocalManage, MANAGE_RESOURCES, readLocalManage, writeLocalManage, type ManageResource } from "@/lib/server/local-admin";
import {isCloudPrimaryEnv} from "@/lib/server/storage-mode";
import {cloudReadManage,cloudWriteManage,cloudDeleteManage} from "@/lib/server/cloud-admin";
import { localError, localJson } from "@/lib/server/local-api";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { HttpError, objectValue } from "@/lib/server/validation";

function resource(request: Request): ManageResource {
  const value = new URL(request.url).searchParams.get("resource");
  if (!value || !(MANAGE_RESOURCES as readonly string[]).includes(value)) throw new HttpError(400, "Modul tidak valid.");
  return value as ManageResource;
}
const revalidate = (): void => {
  revalidateTag(PUBLIC_CONTENT_TAG, { expire: 0 });
  revalidatePath("/", "layout");
};
const body = async (request: Request): Promise<Record<string, unknown>> => objectValue(await request.json().catch(() => null));

export async function GET(request: Request): Promise<Response> {
  try { await requireLocalAdmin(request); return localJson(isCloudPrimaryEnv() ? await cloudReadManage(resource(request)) : readLocalManage(resource(request))); } catch (error) { return localError(error); }
}
export async function PUT(request: Request): Promise<Response> {
  after(async()=>{await flushCloudBackup();});
  try { await requireLocalAdmin(request); const payload=await body(request); const result=isCloudPrimaryEnv()?await cloudWriteManage(resource(request),payload):writeLocalManage(resource(request),payload,revalidate); revalidate(); return localJson(result); } catch (error) { return localError(error); }
}
export async function DELETE(request: Request): Promise<Response> {
  after(async()=>{await flushCloudBackup();});
  try { await requireLocalAdmin(request); const payload=await body(request); const result=isCloudPrimaryEnv()?await cloudDeleteManage(resource(request),payload):deleteLocalManage(resource(request),payload,revalidate); revalidate(); return localJson(result); } catch (error) { return localError(error); }
}
