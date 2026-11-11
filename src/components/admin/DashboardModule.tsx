"use client";
import MenuManager from "./MenuManager";
import TableManager from "./tables/TableManager";
import WaBotManager from "./WaBotManager";
import OrderManager from "./orders/OrderManager";
import ContentEditor from "./ContentEditor";
import TeamManager from "./TeamManager";
import ReportManager from "./ReportManager";
import PasswordForm from "./PasswordForm";
import {useDashboard} from "./DashboardShell";
export default function DashboardModule({module}:{module:string}):React.JSX.Element{const {account,muted,toggleMuted}=useDashboard();if(module==="menu")return <MenuManager/>;if(module==="tables")return <TableManager/>;if(module==="wa_bot")return <WaBotManager/>;if(module==="orders")return <OrderManager muted={muted} onToggleMuted={toggleMuted} canManageMenu={account.profile.role==="admin"||account.modules.some(m=>m.id==="menu"&&m.enabled)}/>;if(module==="reports")return <ReportManager/>;if(module==="modules")return <TeamManager/>;if(module==="password")return <PasswordForm/>;return <ContentEditor key={module} resource={module}/>;}
