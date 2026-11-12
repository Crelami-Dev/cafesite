"use client";
import Link from "next/link";
import { queueLabel } from "@/lib/order-client";
import { formatPrice } from "@/lib/utils";
import { customerStatus } from "@/data/order-status";
import type { CustomerOrderCardProps } from "@/types";
export function CustomerOrderCard({
  order,
}: CustomerOrderCardProps): React.JSX.Element {
  return (
    <article className="rounded-xl border border-offwhite/15 bg-charcoal-light p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            className="inline-flex min-h-11 items-center font-serif text-2xl"
            href={`/order/${order.id}`}
          >
            {queueLabel(order.queue_number)}
          </Link>
          <p className="text-sm text-offwhite-muted">
            {order.fulfillment === "takeaway"
              ? "Bawa pulang"
              : `Makan di tempat · ${order.table_id}`}
          </p>
        </div>
        <span className="rounded-md border border-offwhite/20 px-3 py-2 text-sm">
          {customerStatus[order.status]}
        </span>
      </header>
      <ul className="mt-4 space-y-2 text-sm text-offwhite-muted">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity} × {item.name}
            {item.notes && <span className="block text-xs">{item.notes}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex flex-wrap justify-between gap-2 border-t border-offwhite/15 pt-4 text-sm">
        <strong className="font-medium tabular-nums text-offwhite">
          {formatPrice(order.total)}
        </strong>
        <span>
          {order.payment_status === "paid" ? "Lunas" : "Belum dibayar"}
        </span>
      </p>
      <div className="mt-4 flex flex-wrap gap-4">
        <Link
          href={`/order/${order.id}`}
          className="link inline-flex min-h-11 items-center text-sm"
        >
          Lihat rincian & QR
        </Link>
        {order.status === "waiting" && order.payment_status === "unpaid" && (
          <Link
            href={`/order/${order.id}/edit`}
            className="link inline-flex min-h-11 items-center text-sm"
          >
            Ubah pesanan
          </Link>
        )}
      </div>
    </article>
  );
}
