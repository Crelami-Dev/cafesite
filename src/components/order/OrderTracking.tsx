"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCustomerOrder, queueLabel } from "@/lib/order-client";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { formatPrice } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import type { Order, OrderTrackingProps } from "@/types";
const steps = [
  { id: "waiting", label: "Menunggu" },
  { id: "preparing", label: "Diproses" },
  { id: "ready", label: "Siap diambil" },
  { id: "completed", label: "Selesai" },
];
export function OrderTracking({
  orderId,
}: OrderTrackingProps): React.JSX.Element {
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("Memuat pesanan…");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    let failures = 0;
    let poll: number | null = null;
    const stopPolling = (): void => {
      if (poll !== null) window.clearInterval(poll);
      poll = null;
    };
    const load = async (): Promise<void> => {
      try {
        const next = await fetchCustomerOrder(orderId);
        failures = 0;
        if (live) {
          setOrder(next);
          setMessage("");
        }
        // Pesanan selesai atau batal tidak akan berubah lagi.
        if (next.status === "completed" || next.status === "cancelled") stopPolling();
      } catch (error) {
        failures += 1;
        // Gagal terus (mis. token tidak ada di browser ini): berhenti; tombol "Coba lagi" memulai ulang.
        if (failures >= 3) stopPolling();
        if (live)
          setMessage(
            error instanceof Error
              ? error.message
              : "Pesanan belum dapat dimuat.",
          );
      }
    };
    void load();
    const client = getBrowserSupabase();
    const channel = client
      ?.channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => void load(),
      )
      .subscribe();
    // Mode lokal (tanpa Supabase Realtime): perbarui status tiap 5 detik selama tab terlihat.
    if (!client)
      poll = window.setInterval(() => {
        if (document.visibilityState === "visible") void load();
      }, 5000);
    return () => {
      live = false;
      stopPolling();
      if (channel && client) void client.removeChannel(channel);
    };
  }, [orderId, attempt]);
  const active = order
    ? steps.findIndex((step) => step.id === order.status)
    : -1;
  return (
    <Container className="py-14 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="section-label">Status pesanan</p>
        <h1 className="public-h1 mt-4">
          {order ? queueLabel(order.queue_number) : "Pesanan kamu"}
        </h1>
        {message && (
          <div className="mt-8 border border-offwhite/20 p-6" role="status">
            <p>{message}</p>
            {message !== "Memuat pesanan…" && (
              <button
                className="btn btn--secondary mt-4"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Coba lagi
              </button>
            )}
          </div>
        )}
        {order && (
          <>
            <p className="mt-5 text-lg text-offwhite-muted">
              {order.status === "cancelled"
                ? "Pesanan dibatalkan. Hubungi kasir jika membutuhkan bantuan."
                : order.status === "completed"
                  ? "Pesanan selesai. Terima kasih sudah mampir."
                  : order.status === "ready"
                    ? "Pesanan siap diambil. Silakan menuju kasir."
                    : "Pesanan diperbarui otomatis. Kamu bisa menunggu di meja."}
            </p>
            <ol
              className="my-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
              aria-label="Tahap pesanan"
            >
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  aria-current={order.status === step.id ? "step" : undefined}
                  className={`border-t-2 pt-4 text-sm ${order.status !== "cancelled" && index <= active ? "border-terracotta-light text-offwhite" : "border-offwhite/20 text-offwhite-muted"}`}
                >
                  <span className="mb-2 block text-xs">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step.label}
                </li>
              ))}
            </ol>
            <section className="border border-offwhite/20 bg-charcoal-light p-6 sm:p-8">
              <div className="flex flex-wrap justify-between gap-4">
                <h2 className="font-serif text-2xl">Ringkasan pesanan</h2>
                <span className="text-sm text-offwhite-muted">
                  {order.fulfillment === "dine_in"
                    ? "Makan di tempat"
                    : "Bawa pulang"}
                </span>
              </div>
              <ul className="mt-6">
                {(order.items ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-4 border-b border-offwhite/15 py-4 text-base"
                  >
                    <span>
                      {item.quantity} × {item.name}
                      {item.notes && (
                        <small className="mt-1 block text-sm text-offwhite-muted">
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
              <div className="mt-5 flex justify-between text-lg">
                <span>Total</span>
                <strong className="font-semibold text-terracotta-light">
                  {formatPrice(order.total)}
                </strong>
              </div>
              <p className="mt-5 text-base text-offwhite-muted">
                {order.payment_status === "paid"
                  ? "Sudah dibayar"
                  : "Belum dibayar · Bayar di kasir (COD)"}
              </p>
            </section>
          </>
        )}
        <Link className="btn btn--primary taste-btn-press mt-8" href="/order">
          Kembali ke menu pesanan ↗
        </Link>
      </div>
    </Container>
  );
}
