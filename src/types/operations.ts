import type { MenuItem } from "./index";

export type StaffRole = "admin" | "staff";
export type ModuleId = "orders" | "menu" | "tables" | "cafe" | "gallery" | "testimonials" | "faq" | "location" | "reports" | "wa_bot";
export interface StaffProfile { id: string; role: StaffRole }
export interface StaffModule { id: ModuleId; enabled: boolean }
export interface MenuRecord { id: string; data: MenuItem; is_available: boolean; sort_order: number }
export interface CafeFloor { id: string; name: string; sort_order: number }
export interface CafeTable { id: string; floor_id: string; label: string; x: number; y: number; status: "available" | "occupied" | "dirty" }
export type OrderStatus = "waiting" | "preparing" | "ready" | "completed" | "cancelled";
export interface OrderItem { id: string; menu_item_id: string; name: string; unit_price: number; quantity: number; notes: string }
export interface Order { id: string; user_id: string; queue_number: number; customer_name: string; phone: string; fulfillment: "dine_in" | "takeaway"; table_id: string | null; status: OrderStatus; payment_method: "cod"; source?: string; payment_status: "unpaid" | "paid"; total: number; paid_amount: number; created_at: string; updated_at: string; items: OrderItem[] }
export interface OrderItemInput { menuItemId: string; quantity: number; notes: string }
export interface CreateOrderInput { customerName: string; phone: string; fulfillment: "dine_in" | "takeaway"; tableCode?: string; paymentMethod: "cod"; items: OrderItemInput[]; idempotencyKey: string }
export interface CatalogResponse { menu: MenuItem[]; tables: CafeTable[]; configured: boolean; onlinePayment: false }
export interface OrderRouteContext { params: Promise<{ id: string }> }
