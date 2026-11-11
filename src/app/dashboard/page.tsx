import {redirect} from "next/navigation";
import {dashboardAccount} from "@/lib/server/dashboard-auth";
import DashboardSummary from "@/components/admin/DashboardSummary";
export default async function DashboardPage():Promise<React.JSX.Element>{const account=await dashboardAccount();if(!account)redirect("/auth");if(account.mustChangePassword)redirect("/dashboard/password");return <DashboardSummary/>;}
