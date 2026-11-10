import type { Order, OrderStatus } from "@/types";
import { formatPhone, formatRupiah, fulfillmentLabel, nextOrderAction, queueLabel, urgencyClass, waitingLabel } from "./order-format";

interface OrderCardProps {
  order: Order;
  now: number;
  busy: boolean;
  error?: string;
  onOpen: () => void;
  onUpdate: (status: OrderStatus, markPaid?: boolean) => void;
}

export default function OrderCard({ order, now, busy, error, onOpen, onUpdate }: OrderCardProps): React.JSX.Element {
  const action = nextOrderAction(order);
  const active = order.status === "waiting" || order.status === "preparing" || order.status === "ready";

  return (
    <article className="rounded-xl border border-charcoal-border bg-charcoal p-3.5 transition duration-300 hover:border-charcoal-muted">
      <button type="button" className="w-full text-left" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif text-2xl leading-none text-offwhite">{queueLabel(order.queue_number)}</p>
            <p className="mt-2 truncate text-sm font-semibold text-offwhite">{order.customer_name}</p>
            <p className="mt-0.5 truncate text-xs text-latte">{formatPhone(order.phone)}</p>
            <p className="mt-0.5 truncate text-xs text-offwhite-darker">{fulfillmentLabel(order)}{order.source === "whatsapp" ? " · via WhatsApp" : ""}</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold whitespace-nowrap ${active ? urgencyClass(order.created_at, now) : "border-charcoal-border bg-charcoal-light text-offwhite-muted"}`}>
            {active ? waitingLabel(order.created_at, now) : "Tuntas"}
          </span>
        </div>

        <div className="mt-3 border-t border-charcoal-border/70 pt-2.5">
          {order.items.length === 0 && order.status === "waiting" ? (
            <p className="animate-pulse text-xs text-latte">Memuat rincian item…</p>
          ) : (
            <ul className="space-y-1 text-xs text-offwhite-muted">
              {order.items.slice(0, 3).map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="truncate">{item.quantity}× {item.name}</span>
                </li>
              ))}
              {order.items.length > 3 && <li className="text-offwhite-darker">+{order.items.length - 3} item lainnya</li>}
            </ul>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-offwhite">{formatRupiah(order.total)}</span>
          <span className={order.payment_status === "paid" ? "text-latte-light" : "text-offwhite-darker"}>
            {order.payment_status === "paid" ? "Sudah lunas" : "Belum dibayar"}
          </span>
        </div>
      </button>

      {error && <p role="alert" className="mt-3 text-xs leading-5 text-terracotta-light">{error}</p>}

      {action && (
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            disabled={busy}
            className="min-h-10 rounded-xl bg-terracotta px-3 text-xs font-semibold transition hover:bg-terracotta-hover disabled:cursor-wait disabled:opacity-50"
            onClick={() => onUpdate(action.status, action.markPaid)}
          >
            {busy ? "Memproses…" : action.label}
          </button>
          {order.status === "waiting" && (
            <button
              type="button"
              disabled={busy}
              className="min-h-9 text-xs text-terracotta-light transition hover:text-offwhite disabled:opacity-50"
              onClick={() => {
                if (confirm(`Batalkan pesanan ${queueLabel(order.queue_number)}? Pesanan yang dibatalkan tidak dapat diproses kembali.`)) onUpdate("cancelled");
              }}
            >
              Batalkan pesanan
            </button>
          )}
        </div>
      )}
    </article>
  );
}
