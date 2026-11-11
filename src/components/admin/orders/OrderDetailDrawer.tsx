"use client";
import { useDialogFocus } from "../useDialogFocus";
import type { AdminMenuRecord, Order, OrderStatus } from "@/types";
import AdminNotice from "../AdminNotice";
import { adminButtonClass, adminSecondaryClass } from "../admin-api";
import {
  formatPhone,
  formatRupiah,
  fulfillmentLabel,
  nextOrderAction,
  queueLabel,
  whatsappLink,
} from "./order-format";

interface OrderDetailDrawerProps {
  order: Order;
  menuIndex: Record<string, AdminMenuRecord>;
  busy: boolean;
  menuBusyId: string;
  error: string;
  onClose: () => void;
  onMarkPaid: () => void;
  onUpdateStatus: (status: OrderStatus, markPaid?: boolean) => void;
  onToggleMenu: (menuId: string, available: boolean) => void;
}

const statusLabel: Record<OrderStatus, string> = {
  waiting: "◷ Menunggu",
  preparing: "↻ Diproses",
  ready: "✓ Siap diambil",
  completed: "✓ Selesai",
  cancelled: "✕ Dibatalkan",
};

export default function OrderDetailDrawer({
  order,
  menuIndex,
  busy,
  menuBusyId,
  error,
  onClose,
  onMarkPaid,
  onUpdateStatus,
  onToggleMenu,
}: OrderDetailDrawerProps): React.JSX.Element {
  useDialogFocus(onClose);
  const canToggleMenu = order.status === "waiting" || order.status === "preparing";
  const nextAction = nextOrderAction(order);

  return (
    <div
      className="fixed inset-0 z-50 bg-charcoal-darkest/80"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        className="ml-auto flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-charcoal-border bg-charcoal p-5 shadow-floating md:p-7"
      >
        <header className="flex items-start justify-between gap-4 border-b border-charcoal-border pb-5">
          <div className="min-w-0">
            <p className="text-xs text-offwhite-muted">Rincian pesanan · {statusLabel[order.status]}</p>
            <h2 id="order-detail-title" className="mt-1 font-serif text-3xl tabular-nums">
              {queueLabel(order.queue_number)}
            </h2>
            <p className="mt-2 truncate text-sm text-offwhite-muted">
              {order.customer_name} · {fulfillmentLabel(order)}
              {order.source === "whatsapp"
                ? " · via WhatsApp"
                : order.source === "web"
                  ? " · via website"
                  : ""}
            </p>
          </div>
          <button
            type="button"
            className="min-h-11 shrink-0 rounded-lg px-3 text-sm text-offwhite-muted hover:bg-charcoal-light hover:text-offwhite"
            onClick={onClose}
          >
            Tutup
          </button>
        </header>

        <section className="grid gap-2.5 border-b border-charcoal-border py-5 text-sm">
          <p>
            <span className="text-offwhite-darker">Pemesan:</span>{" "}
            <strong className="text-offwhite">{order.customer_name}</strong>
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-offwhite-darker">Nomor HP:</span>
            <a
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-offwhite-muted underline hover:text-offwhite"
              href={`tel:${order.phone}`}
            >
              {formatPhone(order.phone)}
            </a>
            <a
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-offwhite-muted underline hover:text-offwhite"
              href={whatsappLink(order.phone)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat WhatsApp ↗
            </a>
          </p>
          <p>
            <span className="text-offwhite-darker">Pembayaran:</span>{" "}
            <span>
              {order.payment_status === "paid" ? "✓ Sudah lunas" : "○ Bayar di kasir (COD)"}
            </span>
          </p>
          <p>
            <span className="text-offwhite-darker">Total:</span>{" "}
            <strong className="tabular-nums text-offwhite">{formatRupiah(order.total)}</strong>
          </p>
        </section>

        <section className="py-5">
          <h3 className="font-serif text-xl">Isi pesanan ({order.items.length})</h3>
          {order.items.length === 0 ? (
            <p className="mt-4 text-sm text-offwhite-muted">Rincian item sedang dimuat…</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {order.items.map((item) => {
                const menu = menuIndex[item.menu_item_id];
                const available = menu?.is_available !== false;
                return (
                  <article key={item.id} className="rounded-xl border border-charcoal-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold tabular-nums text-offwhite">
                          {item.quantity}× {item.name}
                        </h4>
                        <p className="mt-1 text-xs tabular-nums text-offwhite-darker">
                          {formatRupiah(item.unit_price)} per porsi · Subtotal{" "}
                          {formatRupiah(item.unit_price * item.quantity)}
                        </p>
                        {item.notes && (
                          <p className="mt-2 rounded-lg bg-charcoal-light/60 px-3 py-2 text-xs leading-5 text-offwhite">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                      {canToggleMenu && menu && (
                        <button
                          type="button"
                          disabled={menuBusyId === item.menu_item_id}
                          className={`min-h-11 shrink-0 rounded-xl border px-3 text-xs transition disabled:opacity-50 ${
                            available
                              ? "border-charcoal-border text-offwhite-muted hover:border-terracotta-light"
                              : "border-offwhite/40 bg-offwhite/10 text-offwhite"
                          }`}
                          onClick={() => onToggleMenu(item.menu_item_id, !available)}
                        >
                          {menuBusyId === item.menu_item_id
                            ? "Menyimpan…"
                            : available
                              ? "Tandai habis"
                              : "Tersedia lagi"}
                        </button>
                      )}
                    </div>
                    {menu && !available && (
                      <p className="mt-2 text-xs text-terracotta-light">
                        ✕ Menu ini sedang ditandai habis di halaman pemesanan.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-auto grid gap-3 border-t border-charcoal-border pt-5 pb-[env(safe-area-inset-bottom)]">
          <AdminNotice message={error} error />
          {nextAction && (
            <button
              type="button"
              disabled={busy}
              className={adminButtonClass}
              onClick={() => onUpdateStatus(nextAction.status, nextAction.markPaid)}
            >
              {busy ? "Memproses…" : nextAction.label}
            </button>
          )}
          {order.payment_status === "unpaid" &&
            !["completed", "cancelled"].includes(order.status) &&
            !nextAction?.markPaid && (
              <button
                type="button"
                disabled={busy}
                className={adminSecondaryClass}
                onClick={onMarkPaid}
              >
                {busy ? "Memproses…" : "✓ Tandai sudah lunas"}
              </button>
            )}
          {order.status === "waiting" && order.payment_status !== "paid" && (
            <button
              type="button"
              disabled={busy}
              className="min-h-11 rounded-xl border border-terracotta/50 px-4 text-sm font-medium text-terracotta-light transition hover:bg-terracotta/10 hover:text-offwhite disabled:opacity-50"
              onClick={() => {
                if (
                  window.confirm(
                    `Batalkan pesanan ${queueLabel(order.queue_number)}? Pesanan yang dibatalkan tidak dapat diproses kembali.`,
                  )
                ) {
                  onUpdateStatus("cancelled");
                }
              }}
            >
              Batalkan pesanan
            </button>
          )}
          <button type="button" className={adminSecondaryClass} onClick={onClose}>
            Kembali ke papan pesanan
          </button>
        </div>
      </aside>
    </div>
  );
}
