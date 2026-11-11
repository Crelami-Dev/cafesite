import type { ReactNode } from "react";
import type { MenuItem } from "./index";
import type { CatalogResponse, Order, OrderItemInput } from "./operations";

export interface CartContextValue {
  items: OrderItemInput[];
  count: number;
  add: (menuItemId: string) => void;
  update: (menuItemId: string, values: Partial<Pick<OrderItemInput, "quantity" | "notes">>) => void;
  remove: (menuItemId: string) => void;
  clear: () => void;
}
export interface CartProviderProps { children: ReactNode }
/** Meja hasil scan QR (key kosong di mode Supabase). */
export interface OrderTable { id: string; label: string; status: "available" | "occupied" | "dirty"; key: string }
export interface OrderMenuProps { initialMenu: MenuItem[]; table: OrderTable | null }
export interface OrderMenuCardProps { item: MenuItem; quantity: number; onAdd: () => void; onDecrease: () => void }
export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  catalog: CatalogResponse;
  initialTableCode: string;
  addToOrder: Order | null;
  loading: boolean;
}
export interface OrderTrackingProps { orderId: string }
export interface OrderResponse { order: Order }
export interface OrderPageProps { searchParams: Promise<Record<string, string | string[] | undefined>> }
export interface OrderTrackingPageProps { params: Promise<{ id: string }> }
export interface PendingOrderRequest { fingerprint: string; key: string }
