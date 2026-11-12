import { after } from "next/server";
import { flushCloudBackup } from "@/lib/server/cloud-sync";
import { staffList, saveStaff, deleteStaff } from "@/lib/server/dashboard-auth";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { localError, localJson } from "@/lib/server/local-api";
import { objectValue, textValue } from "@/lib/server/validation";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireLocalAdmin(request, "modules");
    return localJson({ data: await staffList() });
  } catch (error) {
    return localError(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const account = await requireLocalAdmin(request, "modules");
    const body = objectValue(await request.json().catch(() => null));
    return localJson(await deleteStaff(textValue(body.id, "Akun", 80), account.profile.id));
  } catch (error) {
    return localError(error);
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const account = await requireLocalAdmin(request, "modules");
    after(async () => {
      await flushCloudBackup();
    });
    return localJson(await saveStaff(objectValue(await request.json().catch(() => null)), account.profile.id));
  } catch (error) {
    return localError(error);
  }
}
