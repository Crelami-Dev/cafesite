"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardSummary as Summary } from "@/types";
import { ChevronRightIcon } from "@/components/ui/icons";
import { useDashboard } from "./DashboardShell";
import { adminRequest, adminError, adminPeek } from "./admin-api";
import { formatRupiah, queueLabel, fulfillmentLabel, waitingLabel } from "./orders/order-format";
import OrderStatusBadge from "./orders/OrderStatusBadge";
import WaStatusRow from "./WaStatusRow";
import Card from "./ui/Card";
import EmptyState from "./ui/EmptyState";
import PageHeader from "./ui/PageHeader";
import Skeleton from "./ui/Skeleton";
import StatTile from "./ui/StatTile";
import StatusBadge from "./ui/StatusBadge";

const QUICK_LINKS: { id: string; label: string; href: string }[] = [
  { id: "orders", label: "Papan pesanan", href: "/dashboard/orders" },
  { id: "menu", label: "Kelola menu", href: "/dashboard/menu" },
  { id: "tables", label: "Meja & QR", href: "/dashboard/tables" },
  { id: "cafe", label: "Info kafe", href: "/dashboard/cafe" },
  { id: "reports", label: "Laporan penjualan", href: "/dashboard/reports" },
];

export default function DashboardSummary(): React.JSX.Element {
  const { account, orders } = useDashboard();
  const [data, setData] = useState<Summary | null>(() => adminPeek<Summary>("summary") ?? null);
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
    const timer = setInterval(load, 15000);
    document.addEventListener("visibilitychange", load);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  const can = (id: string): boolean =>
    account.profile.role === "admin" || account.modules.some((m) => m.id === id && m.enabled);

  const showRevenue = data?.revenue !== undefined && can("reports");
  const showCount = data?.orderCount !== undefined && (can("reports") || can("orders"));
  const showActive = data?.activeCount !== undefined && can("orders");
  const showTables = data?.availableTables !== undefined && can("tables");
  const hasMetrics = showRevenue || showCount || showActive || showTables;

  const queue = [...orders].sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, 6);
  const quick = QUICK_LINKS.filter((q) => can(q.id));

  const today = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="grid gap-5 md:gap-6">
      <PageHeader title="Hari ini" description={`${today} · WIB`} />
      <p className="-mt-3 text-sm text-offwhite-muted md:hidden">{today}</p>

      {error && (
        <p role="alert" className="rounded-lg border border-terracotta-light/40 bg-terracotta/10 p-3 text-sm text-terracotta-light">
          {error}
        </p>
      )}

      {!data && !error ? (
        <div className="grid grid-cols-3 gap-3" aria-busy="true">
          <Skeleton className="col-span-3 h-24" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : hasMetrics ? (
        <section aria-label="Angka operasional hari ini" className="grid grid-cols-3 gap-3 xl:grid-cols-4">
          {showRevenue && (
            <StatTile
              primary
              className="col-span-3 xl:col-span-1"
              label="Penjualan lunas"
              value={formatRupiah(data!.revenue ?? 0)}
              href="/dashboard/reports"
            />
          )}
          {showCount && (
            <StatTile
              label="Pesanan"
              value={String(data!.orderCount ?? 0)}
              href={can("reports") ? "/dashboard/reports" : "/dashboard/orders"}
            />
          )}
          {showActive && <StatTile label="Antrean" value={String(data!.activeCount ?? 0)} href="/dashboard/orders" />}
          {showTables && <StatTile label="Meja kosong" value={String(data!.availableTables ?? 0)} href="/dashboard/tables" />}
        </section>
      ) : null}

      <div className="grid gap-5 md:gap-6 xl:grid-cols-[1.5fr_1fr]">
        {can("orders") && (
          <Card aria-labelledby="queue-heading" className="self-start p-0 sm:p-0">
            <header className="flex items-center justify-between gap-3 border-b border-offwhite/10 px-4 py-3 sm:px-5">
              <h2 id="queue-heading" className="flex items-center gap-2 font-serif text-lg sm:text-xl">
                Perlu ditangani
                {orders.length > 0 && <StatusBadge tone="muted">{orders.length}</StatusBadge>}
              </h2>
              <Link
                href="/dashboard/orders"
                className="inline-flex min-h-11 items-center gap-1 px-1 text-sm text-offwhite-muted hover:text-offwhite"
              >
                Semua <ChevronRightIcon className="size-4" />
              </Link>
            </header>
            {queue.length === 0 ? (
              <div className="p-4 sm:p-5">
                <EmptyState title="Belum ada pesanan aktif" hint="Pesanan baru akan muncul di sini dan berbunyi." />
              </div>
            ) : (
              <ul className="divide-y divide-offwhite/10">
                {queue.map((order, i) => (
                  <li key={order.id} className={i >= 3 ? "hidden md:block" : undefined}>
                    <Link
                      href={`/dashboard/orders?order=${order.id}`}
                      className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 transition hover:bg-charcoal-lighter/50 sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold tabular-nums">{queueLabel(order.queue_number)}</span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-offwhite-muted">
                          {fulfillmentLabel(order)} · {waitingLabel(order.created_at, now)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">{formatRupiah(order.total)}</p>
                        <p className="text-xs text-offwhite-darker">
                          {order.payment_status === "paid" ? "Lunas" : "Belum bayar"}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <div className="grid content-start gap-5 md:gap-6">
          {can("wa_bot") && <WaStatusRow />}
          {quick.length > 0 && (
            <Card aria-labelledby="quick-heading" className="hidden md:block">
              <h2 id="quick-heading" className="font-serif text-xl">
                Akses cepat
              </h2>
              <ul className="mt-4 grid gap-2">
                {quick.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={q.href}
                      className="flex min-h-11 items-center justify-between rounded-md border border-offwhite/10 px-3 text-sm text-offwhite transition hover:border-offwhite/30 hover:bg-charcoal-lighter/50"
                    >
                      {q.label}
                      <ChevronRightIcon className="size-4 text-offwhite-darker" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
