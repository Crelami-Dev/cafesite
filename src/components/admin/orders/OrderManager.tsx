"use client";
import CashierOrderScanner from "./CashierOrderScanner";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { AdminMenuRecord, Order, OrderStatus } from "@/types";
import { ChevronLeftIcon, ChevronRightIcon, FilterIcon, ReceiptIcon, SearchIcon } from "@/components/ui/icons";
import { useDashboard } from "../DashboardShell";
import { adminRequest, adminError, adminInputClass, adminSecondaryClass, adminButtonClass } from "../admin-api";
import EmptyState from "../ui/EmptyState";
import PageHeader from "../ui/PageHeader";
import SegmentedTabs from "../ui/SegmentedTabs";
import Skeleton from "../ui/Skeleton";
import OrderCard from "./OrderCard";
import OrderDetailDrawer from "./OrderDetailDrawer";

interface Props {
  canManageMenu: boolean;
}

interface Page {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
}

const STATUSES: { id: OrderStatus; label: string; empty: string }[] = [
  { id: "waiting", label: "Menunggu", empty: "Belum ada pesanan baru." },
  { id: "preparing", label: "Diproses", empty: "Tidak ada pesanan yang sedang diproses." },
  { id: "ready", label: "Siap", empty: "Belum ada pesanan yang siap disajikan." },
];

export default function OrderManager({ canManageMenu }: Props): React.JSX.Element {
  const { orders, refresh, loading } = useDashboard();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const history = params.get("view") === "history";
  const statusParam = params.get("status");
  const activeStatus: OrderStatus =
    statusParam === "preparing" || statusParam === "ready" ? statusParam : "waiting";
  const search = params.get("q") || "";
  const fromDate = params.get("from") || "";
  const toDate = params.get("to") || "";
  const selectedId = params.get("order");

  const [archive, setArchive] = useState<Page>({ orders: [], total: 0, page: 1, pages: 1 });
  const [detail, setDetail] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  /** Penjaga klik ganda seketika: satu perubahan pesanan/menu pada satu waktu. */
  const flying = useRef(false);
  const [menu, setMenu] = useState<Record<string, AdminMenuRecord>>({});
  const [now, setNow] = useState(() => Date.now());
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(Boolean(fromDate || toDate));

  const query = params.toString();

  function update(values: Record<string, string | null>): void {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!history) return;
    let live = true;
    const p = new URLSearchParams(query);
    p.delete("order");
    if (!["completed", "cancelled"].includes(p.get("status") || "")) p.delete("status");
    const load = (): void => {
      if (document.hidden) return;
      adminRequest<Page>(`orders?${p}`)
        .then((r) => {
          if (live) {
            setArchive(r);
            setError("");
          }
        })
        .catch((e) => {
          if (live) setError(adminError(e));
        })
        .finally(() => {
          if (live) setHistoryLoading(false);
        });
    };
    load();
    const timer = setInterval(load, 10000);
    document.addEventListener("visibilitychange", load);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [history, query]);

  // Pesanan aktif sudah lengkap (dengan item) dari polling shell; ambil terpisah hanya bila tidak ada di sana.
  const selectedIsActive = Boolean(selectedId && orders.some((o) => o.id === selectedId));
  useEffect(() => {
    if (!selectedId || selectedIsActive) return;
    let live = true;
    adminRequest<{ orders: Order[] }>(`orders?id=${selectedId}`)
      .then((r) => {
        if (live) setDetail(r.orders[0] ?? null);
      })
      .catch((e) => {
        if (live) setError(adminError(e));
      });
    return () => {
      live = false;
    };
  }, [selectedId, selectedIsActive]);

  useEffect(() => {
    if (!canManageMenu) return;
    let live = true;
    adminRequest<{ data: AdminMenuRecord[] }>("manage?resource=menu")
      .then((r) => {
        if (live) setMenu(Object.fromEntries(r.data.map((row) => [row.id, row])));
      })
      .catch((e) => {
        if (live) setError(adminError(e));
      });
    return () => {
      live = false;
    };
  }, [canManageMenu]);

  async function change(order: Order, next?: OrderStatus, markPaid = false): Promise<void> {
    if (flying.current) return;
    if (markPaid && !window.confirm("Konfirmasi pembayaran sudah diterima kasir?")) return;
    flying.current = true;
    setBusy(order.id);
    setError("");
    try {
      const result = await adminRequest<{ order: Order }>("orders", {
        method: "PATCH",
        body: JSON.stringify({
          id: order.id,
          status: next,
          markPaid,
          expectedUpdatedAt: order.updated_at,
        }),
      });
      setDetail(result.order);
      await refresh();
    } catch (e) {
      // 409 = pesanan sudah diubah staf lain: daftar dimuat ulang agar tombol berikutnya memakai data terbaru.
      setError(adminError(e));
      await refresh();
    } finally {
      flying.current = false;
      setBusy("");
    }
  }

  async function toggleMenu(id: string, available: boolean): Promise<void> {
    const row = menu[id];
    if (!row || flying.current) return;
    flying.current = true;
    setBusy(id);
    try {
      await adminRequest("manage?resource=menu", {
        method: "PUT",
        body: JSON.stringify({ item: { ...row.data, isAvailable: available }, sortOrder: row.sort_order }),
      });
      setMenu((current) => ({ ...current, [id]: { ...(current[id] ?? row), is_available: available } }));
    } catch (e) {
      setError(adminError(e));
    } finally {
      flying.current = false;
      setBusy("");
    }
  }

  const filtered = orders.filter(
    (o) =>
      (!search ||
        `${o.queue_number} #A-${String(o.queue_number).padStart(3, "0")} ${o.customer_name} ${o.table_id ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!fromDate || o.created_at >= new Date(`${fromDate}T00:00:00+07:00`).toISOString()) &&
      (!toDate || o.created_at < new Date(Date.parse(`${toDate}T00:00:00+07:00`) + 86400000).toISOString()),
  );

  const card = (order: Order): React.JSX.Element => (
    <OrderCard
      key={order.id}
      order={order}
      now={now}
      busy={busy === order.id}
      onOpen={() => update({ order: order.id })}
      onUpdate={(next, paid) => void change(order, next, paid)}
    />
  );

  // A QR lookup can be newer than the background list (e.g. the customer just edited).
  const selected = [orders.find((o) => o.id === selectedId), archive.orders.find((o) => o.id === selectedId), detail?.id === selectedId ? detail : null]
    .filter((order): order is Order => Boolean(order))
    .sort((left, right) => Date.parse(right.updated_at) - Date.parse(left.updated_at))[0] ?? null;

  const hasFilter = Boolean(search || fromDate || toDate);
  const historyStatus = params.get("status") || "all";

  return (
    <div className="grid gap-4 md:gap-5">
      <PageHeader title="Pesanan" description="Konfirmasi pembayaran sebelum pesanan diproses." actions={<CashierOrderScanner onFound={order => { setDetail(order); update({ order: order.id }); }} />} />

      <SegmentedTabs
        label="Tampilan pesanan"
        value={history ? "history" : "active"}
        options={[
          { value: "active", label: "Antrean aktif", count: orders.length },
          { value: "history", label: "Riwayat" },
        ]}
        onChange={(v) => {
          if (v === "history") {
            setHistoryLoading(true);
            update({ view: "history", status: null, page: null });
          } else {
            update({ view: null, status: null, page: null });
          }
        }}
      />

      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          update({
            q: String(f.get("q") ?? "").trim(),
            from: String(f.get("from") ?? ""),
            to: String(f.get("to") ?? ""),
            page: null,
          });
        }}
      >
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Cari pesanan</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-offwhite-darker" />
            <input
              key={search}
              name="q"
              defaultValue={search}
              placeholder="Cari antrean, nama, atau meja"
              className={`${adminInputClass} pl-9`}
            />
          </label>
          <button
            type="button"
            aria-expanded={showFilters}
            aria-label="Filter tanggal"
            onClick={() => setShowFilters((v) => !v)}
            className={`${adminSecondaryClass} shrink-0 px-3 ${showFilters || fromDate || toDate ? "border-offwhite/50 bg-charcoal-light" : ""}`}
          >
            <FilterIcon className="size-4" />
          </button>
        </div>
        {showFilters && (
          <div className="grid gap-3 rounded-lg border border-offwhite/10 bg-charcoal-light p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="grid gap-1.5 text-xs text-offwhite-muted">
              Dari tanggal
              <input key={fromDate} type="date" name="from" defaultValue={fromDate} className={adminInputClass} />
            </label>
            <label className="grid gap-1.5 text-xs text-offwhite-muted">
              Sampai tanggal
              <input key={toDate} type="date" name="to" defaultValue={toDate} className={adminInputClass} />
            </label>
            <div className="flex gap-2">
              <button type="submit" className={`${adminButtonClass} flex-1`}>
                Terapkan
              </button>
              {hasFilter && (
                <button
                  type="button"
                  onClick={() => update({ q: null, from: null, to: null, page: null })}
                  className={adminSecondaryClass}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </form>

      {error && (
        <p role="alert" className="rounded-lg border border-terracotta-light/40 bg-terracotta/10 p-4 text-sm text-terracotta-light">
          {error}
        </p>
      )}

      {history ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:w-auto sm:min-w-80">
              <SegmentedTabs
                label="Filter status riwayat"
                value={historyStatus as "all" | "completed" | "cancelled"}
                options={[
                  { value: "all", label: "Semua" },
                  { value: "completed", label: "Selesai" },
                  { value: "cancelled", label: "Batal" },
                ]}
                onChange={(v) => update({ status: v === "all" ? null : v, page: null })}
              />
            </div>
            <p className="text-xs tabular-nums text-offwhite-muted">{archive.total} pesanan</p>
          </div>

          {historyLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
              <Skeleton className="h-44" />
              <Skeleton className="h-44" />
              <Skeleton className="hidden h-44 xl:block" />
            </div>
          ) : archive.orders.length === 0 ? (
            <EmptyState
              icon={<ReceiptIcon className="size-8" />}
              title="Tidak ada pesanan"
              hint="Coba ubah kata kunci atau rentang tanggal."
            />
          ) : (
            <section aria-label="Riwayat pesanan" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {archive.orders.map(card)}
            </section>
          )}

          <nav aria-label="Halaman riwayat" className="flex items-center justify-between gap-3">
            <button
              type="button"
              className={adminSecondaryClass}
              disabled={archive.page <= 1}
              onClick={() => update({ page: String(archive.page - 1) })}
            >
              <ChevronLeftIcon className="size-4" /> Sebelumnya
            </button>
            <p className="text-sm tabular-nums text-offwhite-muted">
              {archive.page} / {archive.pages}
            </p>
            <button
              type="button"
              className={adminSecondaryClass}
              disabled={archive.page >= archive.pages}
              onClick={() => update({ page: String(archive.page + 1) })}
            >
              Berikutnya <ChevronRightIcon className="size-4" />
            </button>
          </nav>
        </>
      ) : (
        <>
          <div className="xl:hidden">
            <SegmentedTabs
              label="Pilih status pesanan aktif"
              value={activeStatus}
              options={STATUSES.map((s) => ({
                value: s.id,
                label: s.label,
                count: filtered.filter((o) => o.status === s.id).length,
              }))}
              onChange={(v) => update({ status: v })}
            />
          </div>

          {loading ? (
            <div className="grid gap-3 xl:grid-cols-3" aria-busy="true">
              <Skeleton className="h-44" />
              <Skeleton className="hidden h-44 xl:block" />
              <Skeleton className="hidden h-44 xl:block" />
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3 xl:gap-5">
              {STATUSES.map((s) => {
                const colOrders = filtered.filter((o) => o.status === s.id);
                return (
                  <section
                    key={s.id}
                    aria-label={`Pesanan ${s.label}`}
                    className={`${activeStatus === s.id ? "block" : "hidden"} min-w-0 xl:block`}
                  >
                    <header className="mb-3 hidden items-center justify-between border-b border-offwhite/10 pb-2 xl:flex">
                      <h2 className="text-sm font-semibold text-offwhite">{s.label}</h2>
                      <span className="rounded-full border border-offwhite/20 px-2 py-0.5 text-xs font-semibold tabular-nums text-offwhite-muted">
                        {colOrders.length}
                      </span>
                    </header>
                    <div className="grid gap-3">
                      {colOrders.map(card)}
                      {colOrders.length === 0 && <EmptyState title={s.empty} />}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      {selected && (
        <OrderDetailDrawer
          order={selected}
          menuIndex={menu}
          busy={busy === selected.id}
          menuBusyId={busy}
          error={error}
          onClose={() => update({ order: null })}
          onMarkPaid={() => void change(selected, undefined, true)}
          onUpdateStatus={(next, paid) => void change(selected, next, paid)}
          onToggleMenu={(id, value) => void toggleMenu(id, value)}
        />
      )}
    </div>
  );
}
