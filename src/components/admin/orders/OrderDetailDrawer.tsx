"use client";

import { useState } from "react";
import OrderPanel from "./OrderPanel";
import type { AdminMenuRecord, Order, OrderStatus } from "@/types";
import { CheckIcon, CloseIcon, DownloadIcon, ExternalLinkIcon, PrinterIcon, ReceiptIcon } from "@/components/ui/icons";
import AdminNotice from "../AdminNotice";
import { useDashboard } from "../DashboardShell";
import { adminButtonClass, adminDangerClass, adminSecondaryClass } from "../admin-api";
import {
  formatPhone,
  formatRupiah,
  fulfillmentLabel,
  nextOrderAction,
  queueLabel,
  whatsappLink,
} from "./order-format";
import OrderStatusBadge from "./OrderStatusBadge";
import ReceiptModal from "./ReceiptModal";

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

/** Rincian pesanan: bottom-sheet di mobile, panel kanan di tablet/desktop. */
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
  const { account } = useDashboard();
  const [showReceipt, setShowReceipt] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  const canToggleMenu = order.status === "waiting" || order.status === "preparing";
  const nextAction = nextOrderAction(order);
  const source = order.source === "whatsapp" ? "WhatsApp" : order.source === "web" ? "Website" : "";
  const cashierName = account?.profile?.name || "Kasir";
  const isPaidOrInProcess =
    order.payment_status === "paid" || ["preparing", "ready", "completed"].includes(order.status);

  return (
    <>
      <OrderPanel titleId="order-detail-title" onClose={onClose}>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-offwhite/10 bg-charcoal px-5 py-4 dashboard-wide:px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="order-detail-title" className="text-3xl font-semibold tabular-nums">
                {queueLabel(order.queue_number)}
              </h2>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1.5 truncate text-sm text-offwhite-muted">
              {order.customer_name} · {fulfillmentLabel(order)}
              {source ? ` · ${source}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setAutoPrint(false);
                setShowReceipt(true);
              }}
              aria-label="Lihat pratinjau struk kasir"
              title="Lihat pratinjau struk thermal 57mm"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-offwhite-muted transition hover:bg-charcoal-light hover:text-offwhite"
            >
              <ReceiptIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Tutup rincian"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-offwhite-muted transition hover:bg-charcoal-light hover:text-offwhite"
              onClick={onClose}
            >
              <CloseIcon className="size-5" />
            </button>
          </div>
        </header>

        <div className="grid gap-5 px-5 py-5 dashboard-wide:px-7">
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
            <dt className="text-offwhite-darker">Total</dt>
            <dd className="text-right text-xl font-semibold tabular-nums">{formatRupiah(order.total)}</dd>
            <dt className="text-offwhite-darker">Pembayaran</dt>
            <dd className="flex items-center justify-end gap-1 text-right">
              {order.payment_status === "paid" && <CheckIcon className="size-4" />}
              {order.payment_status === "paid" ? "Sudah lunas" : "Bayar di kasir"}
            </dd>
            <dt className="text-offwhite-darker">Nomor HP</dt>
            <dd className="flex flex-wrap items-center justify-end gap-1">
              <a className="inline-flex min-h-11 items-center px-2 underline" href={`tel:${order.phone}`}>
                {formatPhone(order.phone)}
              </a>
              <a
                className="inline-flex min-h-11 items-center gap-1 px-2 underline"
                href={whatsappLink(order.phone)}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp <ExternalLinkIcon className="size-3.5" />
              </a>
            </dd>
          </dl>

          <section aria-labelledby="order-items-title">
            <h3 id="order-items-title" className="font-serif text-lg">
              Isi pesanan ({order.items.length})
            </h3>
            {order.items.length === 0 ? (
              <p className="mt-3 text-sm text-offwhite-muted">Rincian item sedang dimuat…</p>
            ) : (
              <ul className="mt-3 grid gap-2.5">
                {order.items.map((item) => {
                  const menu = menuIndex[item.menu_item_id];
                  const available = menu?.is_available !== false;
                  return (
                    <li key={item.id} className="rounded-lg border border-offwhite/10 bg-charcoal-light p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold tabular-nums text-offwhite">
                            {item.quantity}× {item.name}
                          </p>
                          <p className="mt-1 text-xs tabular-nums text-offwhite-darker">
                            {formatRupiah(item.unit_price * item.quantity)}
                          </p>
                          {item.notes && (
                            <p className="mt-2 rounded-md bg-charcoal-darkest px-3 py-2 text-xs leading-5 text-offwhite">
                              Catatan: {item.notes}
                            </p>
                          )}
                        </div>
                        {canToggleMenu && menu && (
                          <button
                            type="button"
                            disabled={menuBusyId === item.menu_item_id}
                            className={`${available ? adminSecondaryClass : adminButtonClass} shrink-0 !px-3 text-xs`}
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
                          Menu ini sedang ditandai habis di halaman pemesanan.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 mt-auto grid gap-2.5 border-t border-offwhite/10 bg-charcoal px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 dashboard-wide:px-7">
          <AdminNotice message={error} error />

          {/* Tombol Cetak Struk & Simpan PDF saat sudah lunas atau dalam proses */}
          {isPaidOrInProcess && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setAutoPrint(true);
                  setShowReceipt(true);
                }}
                title="Buka dan cetak struk kasir thermal 57mm"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-offwhite/20 bg-charcoal-light px-3 py-2.5 text-xs font-semibold text-offwhite transition hover:border-offwhite/40 hover:bg-charcoal-lighter active:scale-[.98] disabled:cursor-wait disabled:opacity-50"
              >
                <PrinterIcon className="size-4 text-terracotta-light" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setAutoPrint(false);
                  setShowReceipt(true);
                }}
                title="Buka struk thermal dan simpan berkas PDF"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-offwhite/20 bg-charcoal-light px-3 py-2.5 text-xs font-semibold text-offwhite transition hover:border-offwhite/40 hover:bg-charcoal-lighter active:scale-[.98] disabled:cursor-wait disabled:opacity-50"
              >
                <DownloadIcon className="size-4 text-offwhite" />
                <span>Simpan PDF</span>
              </button>
            </div>
          )}

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
              <button type="button" disabled={busy} className={adminSecondaryClass} onClick={onMarkPaid}>
                <CheckIcon className="size-4" />
                {busy ? "Memproses…" : "Tandai sudah lunas"}
              </button>
            )}

          {order.status === "waiting" && order.payment_status !== "paid" && (
            <button
              type="button"
              disabled={busy}
              className={adminDangerClass}
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
        </div>
      </OrderPanel>

      {/* Modal Pratinjau Struk Kasir Thermal */}
      {showReceipt && (
        <ReceiptModal
          order={order}
          cashierName={cashierName}
          autoPrint={autoPrint}
          onClose={() => {
            setShowReceipt(false);
            setAutoPrint(false);
          }}
        />
      )}
    </>
  );
}
