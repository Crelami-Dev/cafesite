"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { orderRequest, queueLabel } from "@/lib/order-client";
import { formatPrice } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import {
  BellIcon,
  BellOffIcon,
  CheckIcon,
  ChevronLeftIcon,
  EditIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { useCustomerOrders } from "./CustomerOrdersProvider";
import { customerStatus } from "@/data/order-status";
import { CashierQr } from "./CashierQr";
import type { Order, OrderTrackingProps } from "@/types";

const ORDER_STEPS = [
  { key: "waiting", label: "Bayar" },
  { key: "preparing", label: "Diracik" },
  { key: "ready", label: "Siap" },
  { key: "completed", label: "Selesai" },
] as const;

function stepMessage(order: Order): string {
  if (order.status === "waiting") {
    return order.payment_status === "paid"
      ? "Pembayaran diterima. Pesanan segera masuk ke antrean barista."
      : "Tunjukkan QR di bawah dan bayar di kasir agar pesanan disiapkan.";
  }
  if (order.status === "preparing") {
    return "Barista sedang meracik pesananmu. Alarm khas CafeSite berbunyi otomatis saat siap.";
  }
  if (order.status === "ready") {
    return "Pesanan sudah siap di meja kasir. Silakan ambil sekarang.";
  }
  if (order.status === "completed") {
    return "Pesanan telah diambil. Terima kasih sudah mampir ke CafeSite.";
  }
  return "Pesanan dibatalkan. Hubungi kasir jika memerlukan bantuan.";
}

function statusBadgeStyle(order: Order): string {
  if (order.status === "ready") {
    return "border-terracotta bg-terracotta text-offwhite-pure";
  }
  if (order.status === "preparing") {
    return "border-terracotta-light/60 bg-terracotta/15 text-terracotta-light";
  }
  if (order.status === "cancelled") {
    return "border-terracotta-light/40 bg-charcoal text-terracotta-light";
  }
  return "border-offwhite/20 bg-charcoal text-offwhite";
}

function statusBadgeText(order: Order): string {
  if (order.status === "waiting") {
    return order.payment_status === "paid" ? "Menunggu proses" : "Menunggu bayar";
  }
  return customerStatus[order.status];
}

export function OrderTracking({
  orderId,
}: OrderTrackingProps): React.JSX.Element {
  const {
    orders,
    refresh,
    enable,
    enabled,
    alerts,
    alarmActive,
    muted,
    toggleMute,
    dismissAlert,
    error: syncError,
  } = useCustomerOrders();
  const [initial, setInitial] = useState<Order | null>(null);
  const [payload, setPayload] = useState("");
  const [error, setError] = useState("");

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

  const isTerminal =
    order !== null && ["completed", "cancelled"].includes(order.status);
  const isThisOrderAlerting = alerts.some((item) => item.id === orderId);
  const currentStepIndex = order
    ? ORDER_STEPS.findIndex((step) => step.key === order.status)
    : -1;

  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Compact navigation + live alarm pill */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            className="inline-flex min-h-10 items-center gap-1.5 text-sm text-offwhite-muted transition hover:text-offwhite"
            href="/pesanan"
          >
            <ChevronLeftIcon className="size-4" />
            <span>Semua pesanan</span>
          </Link>

          {order && !isTerminal && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void enable();
                }}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  alarmActive && isThisOrderAlerting
                    ? "border-terracotta bg-terracotta/20 text-offwhite"
                    : "border-offwhite/15 bg-charcoal-light text-offwhite hover:border-terracotta-light/50"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    alarmActive && isThisOrderAlerting
                      ? "animate-ping bg-terracotta-light"
                      : enabled
                        ? "bg-terracotta-light"
                        : "bg-offwhite/40"
                  }`}
                />
                <BellIcon className="size-3.5 text-terracotta-light" />
                <span>
                  {enabled ? "Alarm siaga · Tes suara" : "Aktifkan bunyi & getar"}
                </span>
              </button>

              {isThisOrderAlerting && (
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Bunyikan alarm" : "Senyapkan alarm"}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-offwhite/15 bg-charcoal-light text-offwhite-muted transition hover:border-offwhite/35 hover:text-offwhite"
                >
                  {muted ? (
                    <BellOffIcon className="size-4" />
                  ) : (
                    <BellIcon className="size-4 text-terracotta-light" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {(error || syncError) && (
          <p
            className="mb-5 rounded-xl border border-terracotta-light/40 bg-charcoal-light px-4 py-3 text-sm text-offwhite"
            role="status"
          >
            {error || syncError}
          </p>
        )}

        {!order && !error && (
          <div
            className="rounded-2xl border border-offwhite/15 bg-charcoal-light p-8 text-center text-sm text-offwhite-muted"
            role="status"
          >
            Memuat rincian pesanan…
          </div>
        )}

        {order && (
          <article className="overflow-hidden rounded-2xl border border-offwhite/15 bg-charcoal-light shadow-elevated">
            {/* Band 1: Queue number, status badge & connected 4-step progress */}
            <header className="border-b border-offwhite/10 p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium uppercase tracking-[0.14em] text-offwhite-muted">
                    {order.fulfillment === "takeaway"
                      ? "Bawa pulang"
                      : `Meja ${order.table_id}`}
                  </p>
                  <h1 className="mt-1 font-serif text-4xl font-medium tracking-tight text-offwhite tabular-nums sm:text-5xl">
                    {queueLabel(order.queue_number)}
                  </h1>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${statusBadgeStyle(order)}`}
                >
                  {order.status === "ready" && (
                    <BellIcon className="size-3.5 animate-pulse" />
                  )}
                  <span>{statusBadgeText(order)}</span>
                </span>
              </div>

              {order.status !== "cancelled" && (
                <ol
                  className="mt-6 grid grid-cols-4 gap-2 sm:gap-3"
                  aria-label="Tahap pesanan"
                >
                  {ORDER_STEPS.map((step, index) => {
                    const isCompleted = currentStepIndex > index;
                    const isCurrent = currentStepIndex === index;
                    return (
                      <li
                        key={step.key}
                        aria-current={isCurrent ? "step" : undefined}
                        className="flex flex-col gap-2"
                      >
                        <div
                          className={`h-1.5 w-full rounded-full transition-colors ${
                            isCurrent
                              ? "bg-terracotta"
                              : isCompleted
                                ? "bg-terracotta/55"
                                : "bg-offwhite/15"
                          }`}
                        />
                        <div
                          className={`flex items-center gap-1 text-xs ${
                            isCurrent
                              ? "font-semibold text-offwhite"
                              : isCompleted
                                ? "text-offwhite/80"
                                : "text-offwhite-muted/65"
                          }`}
                        >
                          {isCompleted && (
                            <CheckIcon className="size-3 shrink-0 text-terracotta-light" />
                          )}
                          <span className="truncate">{step.label}</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              <p className="mt-4 text-sm leading-relaxed text-offwhite-muted">
                {stepMessage(order)}
              </p>
            </header>

            {/* Band 2: Prominent embedded alarm banner when READY */}
            {order.status === "ready" && (
              <section
                className="border-b border-terracotta/30 bg-terracotta/15 px-5 py-4 sm:px-7"
                aria-label="Notifikasi pesanan siap"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border ${
                        isThisOrderAlerting && !muted
                          ? "animate-pulse border-terracotta bg-terracotta text-offwhite-pure"
                          : "border-offwhite/25 bg-charcoal text-offwhite"
                      }`}
                    >
                      {muted ? (
                        <BellOffIcon className="size-4" />
                      ) : (
                        <BellIcon className="size-4" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-offwhite">
                        {isThisOrderAlerting && !muted
                          ? "Alarm CafeSite aktif — menuju kasir"
                          : isThisOrderAlerting && muted
                            ? "Suara disenyapkan — pesanan siap diambil"
                            : "Alarm dimatikan — silakan ambil di kasir"}
                      </p>
                      <p className="mt-0.5 text-xs text-offwhite-muted">
                        Tunjukkan nomor antrean {queueLabel(order.queue_number)}{" "}
                        kepada barista atau kasir.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isThisOrderAlerting ? (
                      <button
                        type="button"
                        onClick={() => dismissAlert(order.id)}
                        className="btn btn--primary min-h-10 px-4 py-2 text-xs"
                      >
                        Saya ke kasir · Matikan
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          void enable();
                        }}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-offwhite/25 bg-charcoal px-3.5 py-2 text-xs font-medium text-offwhite transition hover:border-offwhite/45"
                      >
                        <BellIcon className="size-3.5 text-terracotta-light" />
                        <span>Tes suara</span>
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Band 3: Inline Cashier QR when waiting & unpaid */}
            {order.status === "waiting" &&
              order.payment_status === "unpaid" && (
                <section
                  className="border-b border-offwhite/10 bg-charcoal/45 px-5 py-5 sm:px-7"
                  aria-labelledby="payment-qr"
                >
                  <div className="grid items-center gap-5 sm:grid-cols-[200px_1fr]">
                    <div className="mx-auto w-48 sm:w-full [&>div]:!mt-0 [&>div]:w-full">
                      {payload && <CashierQr payload={payload} />}
                    </div>

                    <div className="text-center sm:text-left">
                      <h2
                        id="payment-qr"
                        className="font-serif text-xl font-medium text-offwhite"
                      >
                        Bayar di kasir dahulu
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-offwhite-muted">
                        Tunjukkan QR ini ke kasir untuk menyelesaikan pembayaran
                        sebelum minuman disiapkan.
                      </p>
                      <p className="mt-3 text-base font-medium tabular-nums text-offwhite">
                        {queueLabel(order.queue_number)} ·{" "}
                        {formatPrice(order.total)}
                      </p>
                      <Link
                        className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-xs font-medium text-terracotta-light transition hover:underline"
                        href={`/order/${order.id}/edit`}
                      >
                        <EditIcon className="size-3.5" />
                        <span>Ubah item pesanan</span>
                      </Link>
                    </div>
                  </div>
                </section>
              )}

            {/* Band 4: Compact Ticket Breakdown */}
            <section className="p-5 sm:p-7" aria-labelledby="order-summary">
              <div className="flex items-center justify-between gap-2">
                <h2
                  id="order-summary"
                  className="text-xs font-medium uppercase tracking-[0.14em] text-offwhite-muted"
                >
                  Rincian pesanan ({order.items.length} menu)
                </h2>
                <span className="text-xs font-medium text-offwhite-muted">
                  {order.payment_status === "paid" ? "Lunas" : "Belum dibayar"}
                </span>
              </div>

              <ul className="mt-3 divide-y divide-offwhite/10">
                {order.items.map((item) => (
                  <li
                    className="flex items-start justify-between gap-4 py-3 text-sm"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <p className="text-offwhite">
                        <span className="font-medium tabular-nums text-terracotta-light">
                          {item.quantity}×
                        </span>{" "}
                        <span>{item.name}</span>
                      </p>
                      {item.notes && (
                        <p className="mt-0.5 text-xs text-offwhite-muted">
                          Catatan: {item.notes}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 tabular-nums text-offwhite-muted">
                      {formatPrice(item.unit_price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex items-center justify-between gap-4 border-t border-dashed border-offwhite/20 pt-4">
                <span className="text-sm text-offwhite-muted">Total bayar</span>
                <strong className="font-serif text-xl font-medium tabular-nums text-offwhite">
                  {formatPrice(order.total)}
                </strong>
              </div>
            </section>
          </article>
        )}

        {/* Single-row footer actions */}
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link className="btn btn--primary min-h-11 text-sm" href="/order">
            Pesan lagi
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-offwhite/15 px-4 py-2 text-xs font-medium text-offwhite-muted transition hover:border-offwhite/35 hover:text-offwhite"
            onClick={() => {
              void refresh();
            }}
          >
            <RefreshIcon className="size-3.5" />
            <span>Perbarui status</span>
          </button>
        </footer>
      </div>
    </Container>
  );
}
