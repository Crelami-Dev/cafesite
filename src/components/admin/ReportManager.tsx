"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { DashboardReport } from "@/types";
import { adminRequest, adminError, adminInputClass, adminSecondaryClass } from "./admin-api";
import { formatRupiah } from "./orders/order-format";

export default function ReportManager(): React.JSX.Element {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const from = params.get("from") || today;
  const to = params.get("to") || today;
  const [data, setData] = useState<DashboardReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    adminRequest<DashboardReport>(`reports?from=${from}&to=${to}`)
      .then((r) => {
        if (live) {
          setData(r);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(adminError(e));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [from, to]);

  function range(a: string, b: string): void {
    setLoading(true);
    router.replace(`${pathname}?from=${a}&to=${b}`);
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end gap-3">
        {[1, 7, 30].map((days) => {
          const presetFrom = new Date(Date.parse(`${today}T12:00:00Z`) - (days - 1) * 86400000).toISOString().slice(0, 10);
          const isSelected = from === presetFrom && to === today;
          return (
            <button
              key={days}
              type="button"
              aria-pressed={isSelected}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition ${
                isSelected ? "border-offwhite bg-charcoal-light text-offwhite" : "border-charcoal-border text-offwhite hover:border-offwhite"
              }`}
              onClick={() => range(presetFrom, today)}
            >
              {days === 1 ? "Hari ini" : `${days} hari`}
            </button>
          );
        })}
        <label className="grid gap-2 text-xs">
          Dari
          <input
            className={`${adminInputClass} tabular-nums`}
            type="date"
            value={from}
            onChange={(e) => {
              if (e.target.value) range(e.target.value, to);
            }}
          />
        </label>
        <label className="grid gap-2 text-xs">
          Sampai
          <input
            className={`${adminInputClass} tabular-nums`}
            type="date"
            value={to}
            onChange={(e) => {
              if (e.target.value) range(from, e.target.value);
            }}
          />
        </label>
        <a href={`/api/admin/reports?from=${from}&to=${to}&format=csv`} className={adminSecondaryClass}>
          Ekspor CSV ↓
        </a>
      </section>

      {error ? (
        <p role="alert" className="text-sm text-terracotta-light">
          {error}
        </p>
      ) : loading ? (
        <p role="status" className="text-sm text-offwhite-muted">
          Memuat laporan…
        </p>
      ) : (
        data && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Penjualan lunas", formatRupiah(data.revenue)],
                ["Pesanan masuk", String(data.orderCount)],
                ["Transaksi lunas", String(data.paidOrders)],
                ["Rata-rata transaksi", formatRupiah(data.average)],
              ].map(([label, value]) => (
                <article key={label} className="min-w-0 rounded-xl border border-offwhite/10 bg-charcoal-light/40 p-5">
                  <h2 className="text-sm text-offwhite-muted">{label}</h2>
                  <p className="mt-3 break-words text-2xl font-semibold tabular-nums">{value}</p>
                </article>
              ))}
            </section>

            {data.estimated > 0 && (
              <p className="text-xs text-offwhite-muted tabular-nums">
                {data.estimated} transaksi lama memakai perkiraan waktu pembayaran dari pembaruan terakhir.
              </p>
            )}

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-xl border border-offwhite/10 p-5">
                <h2 className="font-serif text-2xl">Tren penjualan</h2>
                <p className="mt-1 text-xs text-offwhite-muted">Transaksi lunas · WIB</p>
                <div className="mt-6 grid gap-4">
                  {data.daily.length === 0 ? (
                    <p className="text-sm text-offwhite-muted">Belum ada transaksi lunas pada periode ini.</p>
                  ) : (
                    data.daily.map((day) => (
                      <div key={day.day}>
                        <div className="flex flex-wrap justify-between gap-2 text-sm tabular-nums">
                          <span>{day.day}</span>
                          <strong>{formatRupiah(day.revenue)}</strong>
                        </div>
                        <meter
                          aria-label={`Penjualan ${day.day}`}
                          min={0}
                          max={Math.max(...data.daily.map((d) => d.revenue), 1)}
                          value={day.revenue}
                          className="mt-2 h-2 w-full [&::-webkit-meter-bar]:border-0 [&::-webkit-meter-bar]:bg-charcoal-lighter [&::-webkit-meter-optimum-value]:bg-terracotta"
                        />
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-offwhite/10 p-5">
                <h2 className="font-serif text-2xl">Menu terlaris</h2>
                <div className="mt-4 divide-y divide-offwhite/10">
                  {data.topItems.length === 0 ? (
                    <p className="py-4 text-sm text-offwhite-muted">Belum ada menu terjual.</p>
                  ) : (
                    data.topItems.map((item, i) => (
                      <article key={`${i}-${item.name}`} className="flex items-center gap-3 py-4">
                        <span className="text-sm text-offwhite-darker tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium">{item.name}</h3>
                          <p className="mt-1 text-xs text-offwhite-muted tabular-nums">{item.quantity} porsi</p>
                        </div>
                        <strong className="text-sm tabular-nums">{formatRupiah(item.revenue)}</strong>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )
      )}
    </div>
  );
}
