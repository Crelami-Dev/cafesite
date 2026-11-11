"use client";

import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/types";
import OrderColumn from "./OrderColumn";
import { formatRupiah, fulfillmentLabel, isToday, queueLabel } from "./order-format";

interface OrderBoardProps {
  orders: Order[];
  busyId: string;
  errors: Record<string, string>;
  muted: boolean;
  onToggleMuted: () => void;
  onOpen: (id: string) => void;
  onUpdate: (order: Order, status: OrderStatus, markPaid?: boolean) => void;
}

const columns: { status: OrderStatus; title: string; empty: string }[] = [
  { status: "waiting", title: "Menunggu", empty: "Belum ada pesanan baru. Waktu yang pas untuk menyiapkan station." },
  { status: "preparing", title: "Diproses", empty: "Dapur sedang lega—pesanan yang mulai dikerjakan akan muncul di sini." },
  { status: "ready", title: "Siap", empty: "Belum ada pesanan yang menunggu disajikan atau diambil." },
  { status: "completed", title: "Selesai", empty: "Pesanan yang tuntas hari ini akan tersimpan di sini." },
];

export default function OrderBoard(props: OrderBoardProps): React.JSX.Element {
  const [now, setNow] = useState(() => Date.now());
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 20000);
    return () => window.clearInterval(timer);
  }, []);

  const cancelled = props.orders.filter((order) => order.status === "cancelled" && isToday(order.updated_at));

  return (
    <section className="min-w-0">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={showCancelled}
            className={`min-h-11 rounded-xl border px-3 text-xs transition ${showCancelled ? "border-offwhite text-offwhite" : "border-charcoal-border text-offwhite-muted hover:border-offwhite"}`}
            onClick={() => setShowCancelled((value) => !value)}
          >
            {cancelled.length} dibatalkan hari ini
          </button>
          <button
            type="button"
            aria-pressed={props.muted}
            className="min-h-11 rounded-xl border border-charcoal-border px-3 text-xs text-offwhite-muted transition hover:border-offwhite"
            onClick={props.onToggleMuted}
          >
            Suara {props.muted ? "dimatikan" : "aktif"}
          </button>
        </div>
        <p className="text-xs text-offwhite-darker">Waktu tunggu diperbarui otomatis.</p>
      </header>

      {showCancelled && (
        <div className="mb-5 rounded-xl border border-charcoal-border bg-charcoal p-5">
          <h2 className="font-serif text-xl">Pembatalan hari ini</h2>
          {cancelled.length === 0 ? (
            <p className="mt-3 text-sm text-offwhite-darker">Belum ada pembatalan sejauh ini—kondisi yang bagus.</p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cancelled.map((order) => (
                <button
                  type="button"
                  key={order.id}
                  onClick={() => props.onOpen(order.id)}
                  className="min-h-11 rounded-xl border border-charcoal-border p-3 text-left transition hover:border-offwhite"
                >
                  <span className="font-semibold">{queueLabel(order.queue_number)}</span>
                  <span className="ml-2 text-xs text-offwhite-darker">{fulfillmentLabel(order)} · {formatRupiah(order.total)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <OrderColumn
            key={column.status}
            status={column.status}
            title={column.title}
            empty={column.empty}
            orders={props.orders.filter((order) => order.status === column.status)}
            now={now}
            busyId={props.busyId}
            errors={props.errors}
            onOpen={props.onOpen}
            onUpdate={props.onUpdate}
          />
        ))}
      </div>
    </section>
  );
}
