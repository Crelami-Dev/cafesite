"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { AdminMenuRecord, Order, OrderStatus } from "@/types";
import { useDashboard } from "../DashboardShell";
import { adminRequest, adminError, adminInputClass, adminSecondaryClass } from "../admin-api";
import OrderCard from "./OrderCard";
import OrderDetailDrawer from "./OrderDetailDrawer";

interface Props {
  muted: boolean;
  onToggleMuted: () => void;
  canManageMenu: boolean;
}

interface Page {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
}

const statuses: { id: OrderStatus; label: string; icon: string }[] = [
  { id: "waiting", label: "Menunggu", icon: "◷" },
  { id: "preparing", label: "Diproses", icon: "↻" },
  { id: "ready", label: "Siap", icon: "✓" },
];

export default function OrderManager({
  muted,
  onToggleMuted,
  canManageMenu,
}: Props): React.JSX.Element {
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
  const [menu, setMenu] = useState<Record<string, AdminMenuRecord>>({});
  const [now, setNow] = useState(() => Date.now());
  const [historyLoading, setHistoryLoading] = useState(false);

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
    const timer = setInterval(load, 5000);
    document.addEventListener("visibilitychange", load);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [history, query]);

  useEffect(() => {
    if (!selectedId) return;
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
  }, [selectedId, orders]);

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
    if (busy) return;
    if (markPaid && !window.confirm("Konfirmasi pembayaran sudah diterima kasir?")) return;
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
      setError(adminError(e));
      await refresh();
    } finally {
      setBusy("");
    }
  }

  async function toggleMenu(id: string, available: boolean): Promise<void> {
    const row = menu[id];
    if (!row) return;
    setBusy(id);
    try {
      await adminRequest("manage?resource=menu", {
        method: "PUT",
        body: JSON.stringify({ item: { ...row.data, isAvailable: available }, sortOrder: row.sort_order }),
      });
      setMenu({ ...menu, [id]: { ...row, is_available: available } });
    } catch (e) {
      setError(adminError(e));
    } finally {
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

  const selected =
    orders.find((o) => o.id === selectedId) ??
    archive.orders.find((o) => o.id === selectedId) ??
    (detail?.id === selectedId ? detail : null);

  const hasFilter = Boolean(search || fromDate || toDate);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!history}
            className={`${adminSecondaryClass} ${!history ? "border-offwhite bg-charcoal-light" : ""}`}
            onClick={() => update({ view: null, status: null, page: null })}
          >
            Antrean aktif ({orders.length})
          </button>
          <button
            type="button"
            aria-pressed={history}
            className={`${adminSecondaryClass} ${history ? "border-offwhite bg-charcoal-light" : ""}`}
            onClick={() => {
              setHistoryLoading(true);
              update({ view: "history", status: null, page: null });
            }}
          >
            Riwayat selesai / batal
          </button>
        </div>
        <button
          type="button"
          aria-pressed={!muted}
          className={adminSecondaryClass}
          onClick={onToggleMuted}
        >
          {muted ? "○ Suara mati" : "✓ Suara aktif"}
        </button>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-offwhite/10 bg-charcoal-light/20 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]"
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
        <label className="grid gap-1.5 text-xs text-offwhite-muted sm:col-span-2 lg:col-span-1">
          Cari pesanan
          <input
            key={search}
            name="q"
            defaultValue={search}
            placeholder="Nomor antrean, pelanggan, atau meja"
            className={adminInputClass}
          />
        </label>
        <label className="grid gap-1.5 text-xs text-offwhite-muted">
          Dari tanggal
          <input key={fromDate} type="date" name="from" defaultValue={fromDate} className={adminInputClass} />
        </label>
        <label className="grid gap-1.5 text-xs text-offwhite-muted">
          Sampai tanggal
          <input key={toDate} type="date" name="to" defaultValue={toDate} className={adminInputClass} />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1">
          <button type="submit" className={adminSecondaryClass}>
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
      </form>

      {error && (
        <p role="alert" className="rounded-lg border border-terracotta/50 bg-terracotta/10 p-4 text-sm text-terracotta-light">
          ! {error}
        </p>
      )}

      {history ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status riwayat">
              {[
                { id: "all", label: "Semua riwayat" },
                { id: "completed", label: "✓ Selesai" },
                { id: "cancelled", label: "✕ Dibatalkan" },
              ].map((tab) => {
                const currentStatus = params.get("status") || "all";
                const isSelected = currentStatus === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => update({ status: tab.id === "all" ? null : tab.id, page: null })}
                    className={`${adminSecondaryClass} ${
                      isSelected ? "border-offwhite bg-charcoal-light" : ""
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs tabular-nums text-offwhite-muted">Total {archive.total} pesanan</p>
          </div>

          {historyLoading ? (
            <p role="status" className="rounded-xl border border-offwhite/10 p-6 text-sm text-offwhite-muted">
              Memuat riwayat pesanan…
            </p>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {archive.orders.map(card)}
              {archive.orders.length === 0 && (
                <p className="rounded-xl border border-dashed border-offwhite/10 p-6 text-sm text-offwhite-muted sm:col-span-2 xl:col-span-3">
                  Tidak ada pesanan pada periode atau pencarian ini.
                </p>
              )}
            </section>
          )}

          <nav aria-label="Halaman riwayat" className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className={adminSecondaryClass}
              disabled={archive.page <= 1}
              onClick={() => update({ page: String(archive.page - 1) })}
            >
              Sebelumnya
            </button>
            <p className="text-sm tabular-nums text-offwhite-muted">
              Halaman {archive.page} / {archive.pages} · {archive.total} pesanan
            </p>
            <button
              type="button"
              className={adminSecondaryClass}
              disabled={archive.page >= archive.pages}
              onClick={() => update({ page: String(archive.page + 1) })}
            >
              Berikutnya
            </button>
          </nav>
        </>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Pilih status pesanan aktif"
            className="grid grid-cols-3 gap-2 xl:hidden"
          >
            {statuses.map((s) => {
              const count = filtered.filter((o) => o.status === s.id).length;
              const isSelected = activeStatus === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => update({ status: s.id })}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium tabular-nums transition ${
                    isSelected
                      ? "border-offwhite bg-charcoal-light text-offwhite"
                      : "border-offwhite/10 text-offwhite-muted hover:border-offwhite/40"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                  <span className="rounded-md bg-charcoal-darkest px-1.5 py-0.5 text-[11px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <p role="status" className="rounded-xl border border-offwhite/10 p-6 text-sm text-offwhite-muted">
              Memuat pesanan aktif…
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {statuses.map((s) => {
                const colOrders = filtered.filter((o) => o.status === s.id);
                return (
                  <section
                    key={s.id}
                    aria-label={`Pesanan ${s.label}`}
                    className={`${activeStatus === s.id ? "block" : "hidden"} min-w-0 xl:block`}
                  >
                    <header className="mb-4 flex items-center justify-between border-b border-offwhite/10 pb-3">
                      <h2 className="text-sm font-semibold text-offwhite">
                        {s.icon} {s.label}
                      </h2>
                      <span className="rounded-md bg-charcoal-light px-2 py-0.5 text-xs font-semibold tabular-nums text-offwhite-muted">
                        {colOrders.length}
                      </span>
                    </header>
                    <div className="grid gap-3">
                      {colOrders.map(card)}
                      {colOrders.length === 0 && (
                        <p className="rounded-xl border border-dashed border-offwhite/10 p-6 text-sm text-offwhite-muted">
                          Tidak ada pesanan pada tahap {s.label.toLowerCase()}.
                        </p>
                      )}
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
