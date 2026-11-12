import { isCloudPrimaryEnv } from "@/lib/server/storage-mode";
import { cloudReport } from "@/lib/server/cloud-admin";
import { cloudDb, checkCloud } from "@/lib/server/cloud-db";
import { requireLocalAdmin } from "@/lib/server/local-session";
import { localError, localJson } from "@/lib/server/local-api";
import { dashboardReport } from "@/lib/server/dashboard-reports";
import { getLocalDb } from "@/lib/db/dev-sqlite";
import type { DashboardSummary } from "@/types";

export async function GET(request: Request): Promise<Response> {
  try {
    const account = await requireLocalAdmin(request);
    const can = (id: string): boolean =>
      account.profile.role === "admin" || account.modules.some((m) => m.id === id && m.enabled);
    const wantReport = can("reports") || can("orders");
    const data: DashboardSummary = {};

    if (isCloudPrimaryEnv()) {
      // Tiga angka ini tidak saling bergantung: ambil bersamaan, bukan berurutan.
      const cloud = cloudDb();
      const [report, active, tables] = await Promise.all([
        wantReport ? cloudReport(new URLSearchParams()) : null,
        can("orders")
          ? cloud.from("orders").select("id", { count: "exact", head: true }).in("status", ["waiting", "preparing", "ready"])
          : null,
        can("tables")
          ? cloud.from("cafe_tables").select("id", { count: "exact", head: true }).eq("status", "available").eq("order_mode", "dine_in")
          : null,
      ]);
      if (report) {
        if (can("reports")) data.revenue = report.revenue;
        data.orderCount = report.orderCount;
      }
      if (active) {
        checkCloud(active.error);
        data.activeCount = active.count ?? 0;
      }
      if (tables) {
        checkCloud(tables.error);
        data.availableTables = tables.count ?? 0;
      }
      return localJson(data);
    }

    const db = getLocalDb();
    if (wantReport) {
      const report = dashboardReport(new URLSearchParams());
      if (can("reports")) data.revenue = report.revenue;
      data.orderCount = report.orderCount;
    }
    if (can("orders")) {
      data.activeCount = Number(
        db.prepare("SELECT COUNT(*) n FROM orders WHERE status IN ('waiting','preparing','ready')").get()?.n ?? 0,
      );
    }
    if (can("tables")) {
      data.availableTables = Number(db.prepare("SELECT COUNT(*) n FROM cafe_tables WHERE status='available' AND order_mode='dine_in'").get()?.n ?? 0);
    }
    return localJson(data);
  } catch (error) {
    return localError(error);
  }
}
