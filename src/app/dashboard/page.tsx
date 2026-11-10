import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { hasLocalSession, isLocalMode } from "@/lib/server/local-session";

export const metadata: Metadata = { title: "Dashboard CafeSite", robots: { index: false, follow: false } };

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const local = isLocalMode();
  if (local && !(await hasLocalSession())) redirect("/auth");
  return <AdminDashboard localMode={local} />;
}
