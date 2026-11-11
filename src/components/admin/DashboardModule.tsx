"use client";
import MenuManager from "./MenuManager";
import TableManager from "./tables/TableManager";
import WaBotManager from "./WaBotManager";
import OrderManager from "./orders/OrderManager";
import ContentEditor from "./ContentEditor";
import TeamManager from "./TeamManager";
import ReportManager from "./ReportManager";
import PasswordForm from "./PasswordForm";
import { useDashboard } from "./DashboardShell";

/** Memilih komponen modul dari slug; modul konten (cafe, gallery, dst.) dipegang ContentEditor. */
export default function DashboardModule({ module }: { module: string }): React.JSX.Element {
  const { account } = useDashboard();
  const can = (id: string): boolean =>
    account.profile.role === "admin" || account.modules.some((m) => m.id === id && m.enabled);

  switch (module) {
    case "menu":
      return <MenuManager />;
    case "tables":
      return <TableManager />;
    case "wa_bot":
      return <WaBotManager />;
    case "orders":
      return <OrderManager canManageMenu={can("menu")} />;
    case "reports":
      return <ReportManager />;
    case "modules":
      return <TeamManager />;
    case "password":
      return <PasswordForm />;
    default:
      return <ContentEditor key={module} resource={module} />;
  }
}
