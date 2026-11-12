"use client";
import dynamic from "next/dynamic";
import { useDashboard } from "./DashboardShell";
import ModuleSkeleton from "./ui/ModuleSkeleton";

// Tiap modul dimuat terpisah (lazy): membuka Pesanan tidak ikut mengunduh kode Menu, QR, Laporan, dst.
const loading = (): React.JSX.Element => <ModuleSkeleton />;
const MenuManager = dynamic(() => import("./MenuManager"), { loading });
const TableManager = dynamic(() => import("./tables/TableManager"), { loading });
const WaBotManager = dynamic(() => import("./WaBotManager"), { loading });
const OrderManager = dynamic(() => import("./orders/OrderManager"), { loading });
const ContentEditor = dynamic(() => import("./ContentEditor"), { loading });
const TeamManager = dynamic(() => import("./TeamManager"), { loading });
const ReportManager = dynamic(() => import("./ReportManager"), { loading });
const PasswordForm = dynamic(() => import("./PasswordForm"), { loading });

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
