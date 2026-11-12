"use client";
import Link from "next/link";
import { queueLabel } from "@/lib/order-client";
import { formatPrice } from "@/lib/utils";
import { customerStatus } from "@/data/order-status";
import { ArrowRightIcon, BellIcon } from "@/components/ui/icons";
import type { CustomerOrderCardProps, Order } from "@/types";

const STEP_KEYS = ["waiting", "preparing", "ready", "completed"] as const;

function badgeClass(order: Order): string {
  if (order.status === "ready") {
    return "border-terracotta bg-terracotta text-offwhite-pure";
  }
  if (order.status === "preparing") {
    return "border-terracotta-light/60 bg-terracotta/15 text-terracotta-light";
  }
  if (order.status === "cancelled") {
    return "border-terracotta-light/40 bg-charcoal text-terracotta-light";
  }
  return "border-offwhite/20 bg-charcoal text-offwhite-muted";
}

export function CustomerOrderCard({
  order,
}: CustomerOrderCardProps): React.JSX.Element {
  const stepIndex = STEP_KEYS.indexOf(
    order.status as (typeof STEP_KEYS)[number],
  );
  const isActive = !["completed", "cancelled"].includes(order.status);
  const visibleItems = order.items.slice(0, 3);
  const remainingCount = Math.max(0, order.items.length - 3);

  return (
    <article
      className={`flex flex-col justify-between rounded-xl border bg-charcoal-light p-5 transition ${
        order.status === "ready"
          ? "border-terracotta shadow-floating"
          : "border-offwhite/15 hover:border-offwhite/25"
      }`}
    >
      <div>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center font-serif text-2xl font-medium text-offwhite tabular-nums transition hover:text-terracotta-light"
              href={`/order/${order.id}`}
            >
              {queueLabel(order.queue_number)}
            </Link>
            <p className="mt-0.5 truncate text-xs text-offwhite-muted">
              {order.fulfillment === "takeaway"
                ? "Bawa pulang"
                : `Meja ${order.table_id}`}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${badgeClass(order)}`}
          >
            {order.status === "ready" && (
              <BellIcon className="size-3 animate-pulse" />
            )}
            <span>
              {order.status === "waiting" && order.payment_status === "paid"
                ? "Menunggu proses"
                : customerStatus[order.status]}
            </span>
          </span>
        </header>

        {isActive && stepIndex >= 0 && (
          <div
            className="mt-4 grid grid-cols-4 gap-1.5"
            aria-hidden="true"
          >
            {STEP_KEYS.map((key, idx) => (
              <span
                key={key}
                className={`h-1 rounded-full ${
                  idx === stepIndex
                    ? "bg-terracotta"
                    : idx < stepIndex
                      ? "bg-terracotta/55"
                      : "bg-offwhite/15"
                }`}
              />
            ))}
          </div>
        )}

        <ul className="mt-4 space-y-1.5 text-sm text-offwhite-muted">
          {visibleItems.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-2">
              <span className="truncate">
                <span className="font-medium tabular-nums text-offwhite">
                  {item.quantity}×
                </span>{" "}
                {item.name}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-offwhite-muted/80">
                {formatPrice(item.unit_price * item.quantity)}
              </span>
            </li>
          ))}
          {remainingCount > 0 && (
            <li className="text-xs text-offwhite-muted/80">
              +{remainingCount} menu lainnya
            </li>
          )}
        </ul>
      </div>

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-offwhite/15 pt-3.5">
        <div>
          <strong className="font-medium tabular-nums text-offwhite">
            {formatPrice(order.total)}
          </strong>
          <span className="ml-2 text-xs text-offwhite-muted">
            · {order.payment_status === "paid" ? "Lunas" : "Belum dibayar"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {order.status === "waiting" && order.payment_status === "unpaid" && (
            <Link
              href={`/order/${order.id}/edit`}
              className="inline-flex min-h-9 items-center text-xs font-medium text-offwhite-muted transition hover:text-offwhite"
            >
              Ubah
            </Link>
          )}
          <Link
            href={`/order/${order.id}`}
            className="inline-flex min-h-9 items-center gap-1 text-xs font-medium text-terracotta-light transition hover:underline"
          >
            <span>
              {order.status === "waiting" && order.payment_status === "unpaid"
                ? "QR & Rincian"
                : "Lihat status"}
            </span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </footer>
    </article>
  );
}
