import {redirect} from "next/navigation";
import type {Metadata} from "next";
import {dashboardAccount} from "@/lib/server/dashboard-auth";
import DashboardShell from "@/components/admin/DashboardShell";
export const metadata:Metadata={title:"Ruang Kelola | CafeSite",description:"Kelola operasional dan konten CafeSite.",robots:{index:false,follow:false}};
export default async function DashboardLayout({children}:{children:React.ReactNode}):Promise<React.JSX.Element>{const account=await dashboardAccount();if(!account)redirect("/auth");return <DashboardShell account={account}>{children}</DashboardShell>;}
