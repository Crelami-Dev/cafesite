"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { orderRequest, queueLabel } from "@/lib/order-client";
import { formatPrice } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import { useCustomerOrders } from "./CustomerOrdersProvider";
import { customerStatus } from "@/data/order-status";
import { CashierQr } from "./CashierQr";
import type { Order, OrderTrackingProps } from "@/types";
export function OrderTracking({
  orderId,
}: OrderTrackingProps): React.JSX.Element {
  const {
    orders,
    refresh,
    enable,
    enabled,
    error: syncError,
  } = useCustomerOrders();
  const [initial, setInitial] = useState<Order | null>(null),
    [payload, setPayload] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    void orderRequest<{ order: Order; cashierQr: string }>(
      `/api/orders/${encodeURIComponent(orderId)}`,
      {},
      false,
      orderId,
    )
      .then((result) => {
        if (live) {
          setInitial(result.order);
          setPayload(result.cashierQr);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (live)
          setError(
            cause instanceof Error
              ? cause.message
              : "Pesanan belum dapat dimuat.",
          );
      });
    return () => {
      live = false;
    };
  }, [orderId]);
  const tracked = orders.find((value) => value.id === orderId);
  const order =
    tracked &&
    (!initial ||
      Date.parse(tracked.updated_at) >= Date.parse(initial.updated_at))
      ? tracked
      : initial;
  return (
    <Container className="py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          className="link inline-flex min-h-11 items-center text-sm"
          href="/pesanan"
        >
          Semua pesanan saya
        </Link>
        <h1 className="public-h1 mt-4">
          {order ? queueLabel(order.queue_number) : "Pesanan kamu"}
        </h1>
        {(error || syncError) && (
          <p
            className="mt-5 rounded-lg border border-offwhite/20 p-4 text-sm"
            role="status"
          >
            {error || syncError}
          </p>
        )}
        {!order && !error && (
          <p className="mt-6" role="status">
            Memuat pesanan…
          </p>
        )}
        {order && (
          <>
            <p className="mt-4 text-lg">
              {order.status === "waiting" && order.payment_status === "paid"
                ? "Pembayaran diterima · Menunggu proses"
                : customerStatus[order.status]}
            </p>
            <p className="mt-2 text-sm text-offwhite-muted">
              {order.fulfillment === "takeaway"
                ? "Bawa pulang"
                : `Makan di tempat · ${order.table_id}`}
            </p>
            {order.status === "waiting" &&
              order.payment_status === "unpaid" && (
                <section
                  className="mt-6 rounded-xl border border-offwhite/20 bg-charcoal-light p-5 text-center sm:p-8"
                  aria-labelledby="payment-qr"
                >
                  <h2 id="payment-qr" className="font-serif text-2xl">
                    Bayar dahulu di kasir
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-offwhite-muted">
                    Tunjukkan QR ini dan bayar di kasir agar pesanan diproses.
                  </p>
                  {payload && <CashierQr payload={payload} />}
                  <p className="mt-4 font-medium tabular-nums">
                    {queueLabel(order.queue_number)} ·{" "}
                    {formatPrice(order.total)}
                  </p>
                  <Link
                    className="btn btn--secondary mt-5"
                    href={`/order/${order.id}/edit`}
                  >
                    Ubah pesanan
                  </Link>
                </section>
              )}
            {!["completed", "cancelled"].includes(order.status) && (
              <section className="mt-6 rounded-xl border border-offwhite/15 p-5">
                <h2 className="font-serif text-xl">Pengingat siap diambil</h2>
                <p className="mt-2 text-sm leading-relaxed text-offwhite-muted">
                  Biarkan website aktif. Kami tampilkan pemberitahuan saat
                  pesanan siap; bunyi dan getar mengikuti dukungan browser.
                </p>
                <button
                  type="button"
                  className="btn btn--primary mt-4"
                  onClick={() => {
                    void enable();
                  }}
                >
                  {enabled
                    ? "Pengingat aktif · tes suara"
                    : "Aktifkan pengingat"}
                </button>
              </section>
            )}
            <ol
              className="my-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
              aria-label="Tahap pesanan"
            >
              {(["waiting", "preparing", "ready", "completed"] as const).map(
                (status, index) => (
                  <li
                    className={`border-t-2 pt-3 text-sm ${order.status === status ? "border-terracotta-light text-offwhite" : "border-offwhite/20 text-offwhite-muted"}`}
                    key={status}
                    aria-current={order.status === status ? "step" : undefined}
                  >
                    <span className="mb-1 block text-xs">0{index + 1}</span>
                    {status === "waiting"
                      ? "Bayar di kasir"
                      : customerStatus[status]}
                  </li>
                ),
              )}
            </ol>
            <section className="rounded-xl border border-offwhite/20 bg-charcoal-light p-5 sm:p-8">
              <h2 className="font-serif text-2xl">Rincian pesanan</h2>
              <ul className="mt-4">
                {order.items.map((item) => (
                  <li
                    className="flex justify-between gap-4 border-b border-offwhite/15 py-4 text-sm"
                    key={item.id}
                  >
                    <span>
                      {item.quantity} × {item.name}
                      {item.notes && (
                        <small className="mt-1 block text-offwhite-muted">
                          {item.notes}
                        </small>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatPrice(item.unit_price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 flex justify-between gap-4">
                <span>Total</span>
                <strong className="font-medium tabular-nums">
                  {formatPrice(order.total)}
                </strong>
              </p>
              <p className="mt-3 text-sm text-offwhite-muted">
                {order.payment_status === "paid"
                  ? "Sudah lunas"
                  : "Belum dibayar"}
              </p>
            </section>
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-4">
          <Link className="btn btn--primary" href="/order">
            Pesan lagi · scan QR baru
          </Link>
          <button
            type="button"
            className="link min-h-11 text-sm"
            onClick={() => {
              void refresh();
            }}
          >
            Perbarui status
          </button>
        </div>
      </div>
    </Container>
  );
}
