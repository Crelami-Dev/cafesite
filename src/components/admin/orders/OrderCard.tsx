import type { Order, OrderStatus } from "@/types";
import { CheckIcon, ClockIcon } from "@/components/ui/icons";
import { adminButtonClass, adminDangerClass, adminSecondaryClass } from "../admin-api";
import {
  formatRupiah,
  fulfillmentLabel,
  nextOrderAction,
  queueLabel,
  urgencyClass,
  waitingLabel,
} from "./order-format";
import OrderStatusBadge from "./OrderStatusBadge";

interface OrderCardProps {
  order: Order;
  now: number;
  busy: boolean;
  error?: string;
  onOpen: () => void;
  onUpdate: (status: OrderStatus, markPaid?: boolean) => void;
}

const SOURCE_LABEL: Record<string, string> = { whatsapp: "WhatsApp", web: "Website" };

/** Kartu pesanan: nomor antrean besar, satu tombol aksi utama, rincian/batal sebagai aksi kedua. */
export default function OrderCard({
  order,
  now,
  busy,
  error,
  onOpen,
  onUpdate,
}: OrderCardProps): React.JSX.Element {
  const action = nextOrderAction(order);
  const active = order.status === "waiting" || order.status === "preparing" || order.status === "ready";
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const source = order.source ? SOURCE_LABEL[order.source] : undefined;
  const canCancel = order.status === "waiting" && order.payment_status !== "paid";

  return (
    <article className="min-w-0 rounded-lg border border-offwhite/10 bg-charcoal-light p-4 transition hover:-translate-y-0.5 hover:border-offwhite/25">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-semibold leading-none tabular-nums text-offwhite">
            {queueLabel(order.queue_number)}
          </p>
          <p className="mt-2 truncate text-sm font-medium text-offwhite">{fulfillmentLabel(order)}</p>
          <p className="mt-0.5 truncate text-xs text-offwhite-muted">
            {order.customer_name} · {totalQty} porsi{source ? ` · ${source}` : ""}
          </p>
        </div>
        {active ? (
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${urgencyClass(order.created_at, now)}`}
          >
            <ClockIcon className="size-3.5" />
            {waitingLabel(order.created_at, now)}
          </span>
        ) : (
          <OrderStatusBadge status={order.status} />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-offwhite/10 pt-3">
        <strong className="text-lg font-semibold tabular-nums text-offwhite">{formatRupiah(order.total)}</strong>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
            order.payment_status === "paid"
              ? "border-offwhite/40 text-offwhite"
              : "border-offwhite/15 text-offwhite-muted"
          }`}
        >
          {order.payment_status === "paid" && <CheckIcon className="size-3.5" />}
          {order.payment_status === "paid" ? "Lunas" : "Belum bayar"}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs leading-5 text-terracotta-light">
          {error}
        </p>
      )}

      <div className="mt-3 grid gap-2">
        {action && (
          <button
            type="button"
            disabled={busy}
            className={`${adminButtonClass} w-full`}
            onClick={() => onUpdate(action.status, action.markPaid)}
          >
            {busy ? "Memproses…" : action.label}
          </button>
        )}
        <div className={`grid gap-2 ${canCancel ? "grid-cols-2" : "grid-cols-1"}`}>
          <button type="button" onClick={onOpen} className={adminSecondaryClass}>
            Rincian ({order.items.length})
          </button>
          {canCancel && (
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
                  onUpdate("cancelled");
                }
              }}
            >
              Batalkan
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
