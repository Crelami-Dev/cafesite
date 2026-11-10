"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { AdminMenuRecord, Order, OrderItem, OrderStatus } from "@/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import AdminNotice from "../AdminNotice";
import { adminError, adminRequest, adminSecondaryClass } from "../admin-api";
import OrderBoard from "./OrderBoard";
import OrderDetailDrawer from "./OrderDetailDrawer";

interface OrderManagerProps {
  muted: boolean;
  canManageMenu: boolean;
  onToggleMuted: () => void;
}

interface RealtimeOrderItem extends OrderItem {
  order_id: string;
}

function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

function patchOrder(rows: Order[], payload: RealtimePostgresChangesPayload<Order>): Order[] {
  if (payload.eventType === "DELETE") return rows.filter((row) => row.id !== payload.old.id);
  const next = payload.new as Omit<Order, "items">;
  const index = rows.findIndex((row) => row.id === next.id);
  if (index < 0) return sortOrders([...rows, { ...next, items: [] } as Order]);
  return rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...next, items: row.items } : row));
}

function patchItem(rows: Order[], payload: RealtimePostgresChangesPayload<RealtimeOrderItem>): Order[] {
  if (payload.eventType === "DELETE") return rows.map((order) => ({ ...order, items: order.items.filter((item) => item.id !== payload.old.id) }));
  const item = payload.new as RealtimeOrderItem;
  return rows.map((order) =>
    order.id !== item.order_id
      ? order
      : { ...order, items: order.items.some((row) => row.id === item.id) ? order.items.map((row) => (row.id === item.id ? item : row)) : [...order.items, item] },
  );
}

export default function OrderManager({ muted, canManageMenu, onToggleMuted }: OrderManagerProps): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuIndex, setMenuIndex] = useState<Record<string, AdminMenuRecord>>({});
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [menuError, setMenuError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [menuBusyId, setMenuBusyId] = useState("");
  const client = getBrowserSupabase();

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await adminRequest<{ orders: Order[] }>("orders");
      setOrders(sortOrders(result.orders));
      setLoadError("");
    } catch (cause: unknown) {
      setLoadError(adminError(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMenu = useCallback(async (): Promise<void> => {
    if (!canManageMenu) return;
    try {
      const result = await adminRequest<{ data: AdminMenuRecord[] }>("manage?resource=menu");
      setMenuIndex(Object.fromEntries(result.data.map((row) => [row.id, row])));
      setMenuError("");
    } catch {
      setMenuError("Pesanan tetap dapat diproses, tetapi status ketersediaan menu belum dapat dimuat.");
    }
  }, [canManageMenu]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); void loadMenu(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load, loadMenu]);

  useEffect(() => {
    if (!client) return;
    const channel = client
      .channel("admin-orders-board")
      .on<Order>("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => setOrders((current) => patchOrder(current, payload)))
      .on<RealtimeOrderItem>("postgres_changes", { event: "*", schema: "public", table: "order_items" }, (payload) => setOrders((current) => patchItem(current, payload)))
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") void load();
      });
    return () => { void client.removeChannel(channel); };
  }, [client, load]);

  // Mode lokal (tanpa realtime Supabase): segarkan papan pesanan tiap 5 detik, termasuk pesanan dari WhatsApp.
  useEffect(() => {
    if (client) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void adminRequest<{ orders: Order[] }>("orders").then((result) => setOrders(sortOrders(result.orders))).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [client]);

  const selected = useMemo(() => orders.find((order) => order.id === selectedId), [orders, selectedId]);

  async function updateOrder(order: Order, status?: OrderStatus, markPaid = false): Promise<void> {
    if (busyId) return;
    setBusyId(order.id);
    setErrors((current) => ({ ...current, [order.id]: "" }));
    try {
      const result = await adminRequest<{ order: Order }>("orders", { method: "PATCH", body: JSON.stringify({ id: order.id, status, markPaid }) });
      setOrders((current) => current.map((row) => (row.id === order.id ? { ...result.order, items: row.items } : row)));
    } catch (cause: unknown) {
      setErrors((current) => ({ ...current, [order.id]: adminError(cause) }));
    } finally {
      setBusyId("");
    }
  }

  async function toggleMenu(menuId: string, available: boolean): Promise<void> {
    const row = menuIndex[menuId];
    if (!row || menuBusyId) return;
    setMenuBusyId(menuId);
    try {
      await adminRequest("manage?resource=menu", { method: "PUT", body: JSON.stringify({ item: { ...row.data, isAvailable: available }, sortOrder: row.sort_order }) });
      setMenuIndex((current) => ({ ...current, [menuId]: { ...row, data: { ...row.data, isAvailable: available }, is_available: available } }));
    } catch (cause: unknown) {
      if (selected) setErrors((current) => ({ ...current, [selected.id]: adminError(cause) }));
    } finally {
      setMenuBusyId("");
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <section key={item} className="w-full rounded-2xl border border-charcoal-border p-4">
            <div className="h-5 w-24 animate-pulse rounded bg-charcoal-light" />
            <div className="mt-4 h-40 animate-pulse rounded-xl bg-charcoal" />
          </section>
        ))}
      </div>
    );
  }

  if (loadError && orders.length === 0) {
    return (
      <section className="rounded-2xl border border-charcoal-border bg-charcoal p-5 md:p-6">
        <AdminNotice message={loadError} error />
        <button type="button" className={`${adminSecondaryClass} mt-4`} onClick={() => void load()}>Coba muat kembali</button>
      </section>
    );
  }

  return (
    <>
      <AdminNotice message={loadError} error />
      <AdminNotice message={menuError} error />
      <OrderBoard
        orders={orders}
        busyId={busyId}
        errors={errors}
        muted={muted}
        onToggleMuted={onToggleMuted}
        onOpen={setSelectedId}
        onUpdate={(order, status, markPaid) => void updateOrder(order, status, markPaid)}
      />
      {selected && (
        <OrderDetailDrawer
          order={selected}
          menuIndex={menuIndex}
          busy={busyId === selected.id}
          menuBusyId={menuBusyId}
          error={errors[selected.id] ?? ""}
          onClose={() => setSelectedId("")}
          onMarkPaid={() => void updateOrder(selected, undefined, true)}
          onToggleMenu={(menuId, available) => void toggleMenu(menuId, available)}
        />
      )}
    </>
  );
}
