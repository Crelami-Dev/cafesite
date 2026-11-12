import type { ReactNode } from "react";
import type { MenuItem } from "./index";
import type { StaffRole } from "./operations";

export type AdminModule = "orders" | "menu" | "tables" | "cafe" | "gallery" | "testimonials" | "faq" | "location" | "reports" | "modules" | "wa_bot";
export interface RagIngestJob { id: string; source: string; status: "pending" | "processing" | "done" | "failed"; error: string | null; note: string | null; size: number; chunks: number; created_at: string; updated_at: string; }
export type WaState = "stopped" | "connecting" | "awaiting_qr" | "connected" | "reconnecting" | "error";
export interface WaBotStatus { state: WaState; serviceOffline?: boolean; offlineReason?: string | null; lastConnectedAt: string | null; qr: string | null; error: string | null; phone: string | null; configuredPhone?: string | null; ai?: string; embedding?: string; messagesHandled?: number; documents?: number; startedAt?: string; }
export interface AdminProfile { id: string; role: "admin" | "staff"; }
export interface DashboardAccount extends AdminBootstrap { profile: AdminProfile & { name: string; email: string }; mustChangePassword: boolean }
export type StaffCloudState = "saved" | "pending" | "off";
export interface StaffAccount { id: string; name: string; email: string; role: StaffRole; enabled: boolean; mustChangePassword: boolean; modules: string[] }
export interface DashboardReport { from: string; to: string; revenue: number; paidOrders: number; orderCount: number; average: number; estimated: number; daily: { day: string; revenue: number; count: number }[]; topItems: { name: string; quantity: number; revenue: number }[] }
export interface DashboardSummary { revenue?: number; orderCount?: number; activeCount?: number; availableTables?: number; orders?: import("./operations").Order[] }
export interface AdminModuleSetting { id: string; enabled: boolean; }
export interface AdminBootstrap { profile: AdminProfile; modules: AdminModuleSetting[]; }
export interface AdminMenuRecord { id: string; data: MenuItem; is_available: boolean; sort_order: number; }
export interface AdminFloor { id: string; name: string; sort_order: number; }
export interface AdminTableActiveOrder { id: string; queue_number: number; customer_name: string; status: "waiting" | "preparing" | "ready"; total: number; }
export interface AdminTable { id: string; floor_id: string; label: string; x: number; y: number; status: "available" | "occupied" | "dirty"; order_mode?: "dine_in" | "takeaway"; /** Kunci QR meja (mode lokal); tanpa ini QR tidak bisa membuka halaman pesan. */ qr_key?: string; active_order?: AdminTableActiveOrder | null; active_orders?: AdminTableActiveOrder[]; }
export interface AdminFloorForm { id?: string; name: string; sortOrder: number; }
export interface AdminTableForm { id: string; floorId: string; label: string; status: AdminTable["status"]; }
export interface AdminFieldProps { label: string; children: ReactNode; hint?: string; }
export interface AdminNoticeProps { message: string; error?: boolean; }
export interface AdminContentProps { resource: "gallery" | "testimonials" | "faq" | "location"; }
export interface AdminImageUploadProps { value: string; onChange: (value: string) => void; folder: "menu" | "gallery"; }
export interface AdminGalleryRecord { id: string; src: string; alt: string; title: string; caption: string; category: string; aspect: string; year?: string; }
export interface AdminContentRecord { id: string; [key: string]: string | number | undefined; }
