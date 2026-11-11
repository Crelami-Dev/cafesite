import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CONTENT_TAG } from "@/lib/content";
import { deleteLocalManage, MANAGE_RESOURCES, readLocalManage, writeLocalManage, type ManageResource } from "@/lib/server/local-admin";
import { ensureCloudSqliteSync } from "@/lib/server/cloud-sync";
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
  try { await requireLocalAdmin(request); await ensureCloudSqliteSync(); return localJson(readLocalManage(resource(request))); } catch (error) { return localError(error); }
}
export async function PUT(request: Request): Promise<Response> {
  try { await requireLocalAdmin(request); return localJson(writeLocalManage(resource(request), await body(request), revalidate)); } catch (error) { return localError(error); }
}
export async function DELETE(request: Request): Promise<Response> {
  try { await requireLocalAdmin(request); return localJson(deleteLocalManage(resource(request), await body(request), revalidate)); } catch (error) { return localError(error); }
}
