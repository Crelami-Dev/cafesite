"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardSummary as Summary, Order } from "@/types";
import { useDashboard } from "./DashboardShell";
import { adminRequest, adminError, adminSecondaryClass } from "./admin-api";
import { formatRupiah, queueLabel, fulfillmentLabel, waitingLabel } from "./orders/order-format";
import WaConnectionPanel from "./WaConnectionPanel";

function statusBadge(status: Order["status"]): string {
  if (status === "waiting") return "◷ Menunggu";
  if (status === "preparing") return "↻ Diproses";
  return "✓ Siap";
}

export default function DashboardSummary(): React.JSX.Element {
  const { account, orders } = useDashboard();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    const load = (): void => {
      if (document.hidden) return;
      adminRequest<Summary>("summary")
        .then((r) => {
          if (live) {
            setData(r);
            setError("");
            setNow(Date.now());
          }
        })
        .catch((e) => {
          if (live) setError(adminError(e));
        });
    };
    load();
    const timer = setInterval(load, 5000);
    document.addEventListener("visibilitychange", load);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  const can = (id: string): boolean =>
    account.profile.role === "admin" ||
    account.modules.some((m) => m.id === id && m.enabled);

  const metrics: { label: string; value: string; href: string; primary?: boolean }[] = [];
  if (data?.revenue !== undefined && can("reports")) {
    metrics.push({
      label: "Penjualan lunas hari ini",
      value: formatRupiah(data.revenue),
      href: "/dashboard/reports",
      primary: true,
    });
  }
  if (data?.orderCount !== undefined && (can("reports") || can("orders"))) {
    metrics.push({
      label: "Pesanan masuk hari ini",
      value: String(data.orderCount),
      href: can("reports") ? "/dashboard/reports" : "/dashboard/orders",
    });
  }
  if (data?.activeCount !== undefined && can("orders")) {
    metrics.push({
      label: "Antrean aktif",
      value: String(data.activeCount),
      href: "/dashboard/orders",
    });
  }
  if (data?.availableTables !== undefined && can("tables")) {
    metrics.push({
      label: "Meja tersedia",
      value: String(data.availableTables),
      href: "/dashboard/tables",
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-offwhite-muted">
          {new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date())}
        </p>
        <span className="text-xs text-offwhite-darker">Ringkasan hari ini · WIB</span>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-terracotta/50 p-3 text-sm text-terracotta-light">
          ! {error}
        </p>
      )}

      {!data && !error ? (
        <p role="status" className="rounded-xl border border-offwhite/10 p-6 text-sm text-offwhite-muted">
          Memuat ringkasan…
        </p>
      ) : metrics.length > 0 ? (
        <section
          aria-label="Angka operasional hari ini"
          className="grid grid-cols-2 gap-3 xl:grid-cols-4"
        >
          {metrics.map((m) => (
            <Link
              href={m.href}
              key={m.label}
              className={`min-w-0 rounded-xl border p-4 sm:p-5 transition hover:-translate-y-0.5 ${
                m.primary
                  ? "col-span-2 xl:col-span-1 border-offwhite bg-offwhite text-charcoal"
                  : "border-offwhite/10 bg-charcoal-light/40 text-offwhite"
              }`}
            >
              <h2 className={`text-xs sm:text-sm ${m.primary ? "text-charcoal/80" : "text-offwhite-muted"}`}>
                {m.label}
              </h2>
              <p
                className={`mt-3 break-words font-semibold tabular-nums ${
                  m.primary ? "text-2xl sm:text-3xl" : "text-xl sm:text-3xl"
                }`}
              >
                {m.value}
              </p>
              <span className={`mt-3 block text-xs ${m.primary ? "text-charcoal/75" : "text-offwhite-darker"}`}>
                Lihat detail ↗
              </span>
            </Link>
          ))}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {can("orders") && (
          <section className="self-start rounded-xl border border-offwhite/10">
            <header className="flex items-center justify-between gap-3 border-b border-offwhite/10 px-5 py-4">
              <h2 className="font-serif text-2xl">Perlu ditangani</h2>
              <Link
                href="/dashboard/orders"
                className="inline-flex min-h-11 items-center px-2 text-sm text-offwhite-muted hover:text-offwhite"
              >
                Semua ↗
              </Link>
            </header>
            {orders.length === 0 ? (
              <p className="p-6 text-sm text-offwhite-muted">Belum ada pesanan aktif saat ini.</p>
            ) : (
              <div className="divide-y divide-offwhite/10">
                {[...orders]
                  .sort((a, b) => a.created_at.localeCompare(b.created_at))
                  .slice(0, 6)
                  .map((order) => (
                    <Link
                      href={`/dashboard/orders?order=${order.id}`}
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-charcoal-light"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold tabular-nums">{queueLabel(order.queue_number)}</h3>
                          <span className="rounded-md border border-offwhite/15 bg-charcoal-light px-2 py-0.5 text-xs text-offwhite-muted">
                            {statusBadge(order.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-offwhite-muted">
                          {fulfillmentLabel(order)} · {waitingLabel(order.created_at, now)} ·{" "}
                          {order.payment_status === "paid" ? "✓ Lunas" : "○ Belum dibayar"}
                        </p>
                      </div>
                      <strong className="text-sm font-semibold tabular-nums">
                        {formatRupiah(order.total)}
                      </strong>
                    </Link>
                  ))}
              </div>
            )}
          </section>
        )}

        <section className="self-start rounded-xl border border-offwhite/10 p-5">
          <h2 className="font-serif text-2xl">Akses cepat</h2>
          <div className="mt-5 grid gap-3">
            {[
              ["orders", "Buka papan pesanan", "orders"],
              ["menu", "Kelola menu kedai", "menu"],
              ["tables", "Lihat meja & QR", "tables"],
              ["cafe", "Ubah info kafe", "cafe"],
              ["reports", "Buka laporan penjualan", "reports"],
            ]
              .filter(([id]) => can(id))
              .map(([id, label, slug]) => (
                <Link
                  key={id}
                  href={`/dashboard/${slug}`}
                  className={`${adminSecondaryClass} justify-between`}
                >
                  <span>{label}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-offwhite-muted">
            Halaman dan angka mengikuti akses akun Anda.
          </p>
        </section>
      </div>

      {can("wa_bot") && <WaConnectionPanel />}
    </div>
  );
}
