"use client";

import type { AdminMenuRecord, Order } from "@/types";
import AdminNotice from "../AdminNotice";
import { adminButtonClass, adminSecondaryClass } from "../admin-api";
import { formatPhone, formatRupiah, fulfillmentLabel, queueLabel, whatsappLink } from "./order-format";

interface OrderDetailDrawerProps {
  order: Order;
  menuIndex: Record<string, AdminMenuRecord>;
  busy: boolean;
  menuBusyId: string;
  error: string;
  onClose: () => void;
  onMarkPaid: () => void;
  onToggleMenu: (menuId: string, available: boolean) => void;
}

export default function OrderDetailDrawer({ order, menuIndex, busy, menuBusyId, error, onClose, onMarkPaid, onToggleMenu }: OrderDetailDrawerProps): React.JSX.Element {
  const canToggleMenu = order.status === "waiting" || order.status === "preparing";

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-darkest/75" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="ml-auto flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-charcoal-border bg-charcoal p-5 shadow-floating md:p-7">
        <header className="flex items-start justify-between gap-4 border-b border-charcoal-border pb-5">
          <div className="min-w-0">
            <p className="text-xs text-latte">Rincian pesanan</p>
            <h2 id="order-detail-title" className="mt-1 font-serif text-3xl">{queueLabel(order.queue_number)}</h2>
            <p className="mt-2 truncate text-sm text-offwhite-muted">{order.customer_name} · {fulfillmentLabel(order)}{order.source === "whatsapp" ? " · via WhatsApp" : ""}</p>
          </div>
          <button type="button" className="min-h-11 shrink-0 px-2 text-sm text-offwhite-muted hover:text-offwhite" onClick={onClose}>Tutup</button>
        </header>

        <section className="grid gap-2 border-b border-charcoal-border py-5 text-sm">
          <p><span className="text-offwhite-darker">Pemesan:</span> <strong>{order.customer_name}</strong></p>
          <p><span className="text-offwhite-darker">Nomor HP:</span> <a className="text-latte hover:text-latte-light" href={`tel:${order.phone}`}>{formatPhone(order.phone)}</a> · <a className="text-latte hover:text-latte-light" href={whatsappLink(order.phone)} target="_blank" rel="noopener noreferrer">Chat WhatsApp</a></p>
          <p><span className="text-offwhite-darker">Pembayaran:</span> {order.payment_status === "paid" ? "Sudah lunas" : "Bayar di kasir"}</p>
          <p><span className="text-offwhite-darker">Total:</span> <strong>{formatRupiah(order.total)}</strong></p>
        </section>

        <section className="py-5">
          <h3 className="font-serif text-xl">Isi pesanan</h3>
          {order.items.length === 0 ? (
            <p className="mt-4 animate-pulse text-sm text-latte">Rincian item sedang menyusul…</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {order.items.map((item) => {
                const menu = menuIndex[item.menu_item_id];
                const available = menu?.is_available !== false;
                return (
                  <article key={item.id} className="rounded-xl border border-charcoal-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-offwhite">{item.quantity}× {item.name}</h4>
                        <p className="mt-1 text-xs text-offwhite-darker">{formatRupiah(item.unit_price)} per porsi</p>
                        {item.notes && <p className="mt-2 text-xs leading-5 text-latte">Catatan: {item.notes}</p>}
                      </div>
                      {canToggleMenu && menu && (
                        <button
                          type="button"
                          disabled={menuBusyId === item.menu_item_id}
                          className={`min-h-11 shrink-0 rounded-xl border px-3 text-xs transition disabled:opacity-50 ${available ? "border-charcoal-border text-offwhite-muted hover:border-terracotta-light" : "border-latte/40 bg-latte/10 text-latte-light"}`}
                          onClick={() => onToggleMenu(item.menu_item_id, !available)}
                        >
                          {menuBusyId === item.menu_item_id ? "Menyimpan…" : available ? "Tandai habis" : "Tersedia lagi"}
                        </button>
                      )}
                    </div>
                    {menu && !available && <p className="mt-2 text-xs text-terracotta-light">Menu ini sedang ditandai habis di semua pesanan.</p>}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-auto grid gap-3 border-t border-charcoal-border pt-5">
          <AdminNotice message={error} error />
          {order.payment_status === "unpaid" && !["completed", "cancelled"].includes(order.status) && (
            <button type="button" disabled={busy} className={adminButtonClass} onClick={onMarkPaid}>{busy ? "Memproses…" : "Tandai sudah lunas"}</button>
          )}
          <button type="button" className={adminSecondaryClass} onClick={onClose}>Kembali ke papan pesanan</button>
        </div>
      </aside>
    </div>
  );
}
