import type { Order, OrderStatus } from "@/types";
import {
  formatRupiah,
  fulfillmentLabel,
  nextOrderAction,
  queueLabel,
  urgencyClass,
  waitingLabel,
} from "./order-format";

interface OrderCardProps {
  order: Order;
  now: number;
  busy: boolean;
  error?: string;
  onOpen: () => void;
  onUpdate: (status: OrderStatus, markPaid?: boolean) => void;
}

function statusIcon(status: OrderStatus): string {
  if (status === "waiting") return "◷";
  if (status === "preparing") return "↻";
  if (status === "ready" || status === "completed") return "✓";
  return "✕";
}

export default function OrderCard({
  order,
  now,
  busy,
  error,
  onOpen,
  onUpdate,
}: OrderCardProps): React.JSX.Element {
  const action = nextOrderAction(order);
  const active =
    order.status === "waiting" || order.status === "preparing" || order.status === "ready";
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="rounded-xl border border-charcoal-border bg-charcoal p-4 transition duration-200 hover:border-charcoal-muted">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-2xl font-semibold tabular-nums leading-none text-offwhite">
            {queueLabel(order.queue_number)}
          </p>
          <p className="mt-2 truncate text-sm font-medium text-offwhite">
            {fulfillmentLabel(order)}
          </p>
          <p className="mt-0.5 truncate text-xs text-offwhite-muted">
            {order.customer_name} · {totalQty} porsi
            {order.source === "whatsapp"
              ? " · WhatsApp"
              : order.source === "web"
                ? " · Website"
                : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums whitespace-nowrap ${
            active
              ? urgencyClass(order.created_at, now)
              : "border-charcoal-border bg-charcoal-light text-offwhite-muted"
          }`}
        >
          {statusIcon(order.status)}{" "}
          {active
            ? waitingLabel(order.created_at, now)
            : order.status === "cancelled"
              ? "Dibatalkan"
              : "Selesai"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-charcoal-border/70 pt-3 text-xs">
        <strong className="text-base font-semibold tabular-nums text-offwhite">
          {formatRupiah(order.total)}
        </strong>
        <span
          className={`rounded-md px-2 py-0.5 font-medium ${
            order.payment_status === "paid"
              ? "bg-offwhite/10 text-offwhite"
              : "bg-charcoal-light text-offwhite-muted"
          }`}
        >
          {order.payment_status === "paid" ? "✓ Sudah lunas" : "○ Belum dibayar"}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs leading-5 text-terracotta-light">
          ! {error}
        </p>
      )}

      <div className="mt-3 grid gap-2">
        {action && (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 rounded-xl bg-terracotta px-3 text-xs font-semibold text-offwhite-pure transition hover:bg-terracotta-hover disabled:cursor-wait disabled:opacity-50"
            onClick={() => onUpdate(action.status, action.markPaid)}
          >
            {busy ? "Memproses…" : action.label}
          </button>
        )}
        <div className={`grid gap-2 ${order.status === "waiting" && order.payment_status !== "paid" ? "grid-cols-2" : "grid-cols-1"}`}>
          <button
            type="button"
            onClick={onOpen}
            className="min-h-11 rounded-xl border border-charcoal-border px-3 text-xs font-medium text-offwhite transition hover:border-offwhite/40 hover:bg-charcoal-light"
          >
            Rincian ({order.items.length})
          </button>
          {order.status === "waiting" && order.payment_status !== "paid" && (
            <button
              type="button"
              disabled={busy}
              className="min-h-11 rounded-xl border border-terracotta/40 px-3 text-xs font-medium text-terracotta-light transition hover:bg-terracotta/10 hover:text-offwhite disabled:opacity-50"
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
