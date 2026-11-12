"use client";
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import {
  BellIcon,
  BellOffIcon,
  PlusIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { useCustomerOrders } from "./CustomerOrdersProvider";
import { CustomerOrderCard } from "./CustomerOrderCard";

export function CustomerOrders(): React.JSX.Element {
  const {
    orders,
    hasOrders,
    loading,
    error,
    unavailable,
    refresh,
    enable,
    enabled,
    alerts,
    alarmActive,
    muted,
    toggleMute,
  } = useCustomerOrders();
  const [page, setPage] = useState(1);

  const active = orders.filter(
    (order) => !["completed", "cancelled"].includes(order.status),
  );
  const history = orders.filter((order) =>
    ["completed", "cancelled"].includes(order.status),
  );

  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-offwhite/10 pb-6">
          <div>
            <h1 className="public-h1">Pesanan saya</h1>
            <p className="mt-2 max-w-lg text-sm text-offwhite-muted">
              Pantau antrean secara langsung. Alarm CafeSite otomatis siaga saat
              halaman dibuka.
            </p>
          </div>
          <Link href="/order" className="btn btn--primary min-h-11 gap-2 text-sm">
            <PlusIcon className="size-4" />
            <span>Pesan baru</span>
          </Link>
        </header>

        {!hasOrders ? (
          <div className="mt-8 rounded-2xl border border-offwhite/15 bg-charcoal-light p-8 text-center">
            <p className="font-serif text-xl text-offwhite">
              Belum ada pesanan aktif
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-offwhite-muted">
              Pesanan yang dibuat dari browser ini akan otomatis tampil di sini
              lengkap dengan nomor antrean dan QR kasir.
            </p>
            <Link
              href="/order"
              className="btn btn--secondary mt-5 inline-flex min-h-11 text-sm"
            >
              Mulai pesan sekarang
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void enable();
                  }}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    alarmActive
                      ? "border-terracotta bg-terracotta/20 text-offwhite"
                      : "border-offwhite/15 bg-charcoal-light text-offwhite hover:border-terracotta-light/50"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      alarmActive
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

                {alerts.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? "Bunyikan alarm" : "Senyapkan alarm"}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-offwhite/15 bg-charcoal-light px-3 py-1.5 text-xs font-medium text-offwhite-muted transition hover:border-offwhite/35 hover:text-offwhite"
                  >
                    {muted ? (
                      <>
                        <BellOffIcon className="size-3.5" />
                        <span>Senyap</span>
                      </>
                    ) : (
                      <>
                        <BellIcon className="size-3.5 text-terracotta-light" />
                        <span>Senyapkan</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-offwhite/15 px-3.5 py-1.5 text-xs font-medium text-offwhite-muted transition hover:border-offwhite/35 hover:text-offwhite"
                onClick={() => {
                  void refresh();
                }}
              >
                <RefreshIcon className="size-3.5" />
                <span>Perbarui</span>
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-terracotta-light" role="status">
                {error} Status terakhir tetap ditampilkan.
              </p>
            )}

            {loading && !orders.length && (
              <p className="mt-8 text-sm text-offwhite-muted" role="status">
                Memuat daftar pesanan…
              </p>
            )}

            {unavailable.length > 0 && (
              <p className="mt-4 text-xs text-offwhite-muted">
                Sebagian pesanan tidak dapat diakses lagi. Hubungi kasir jika
                memerlukan bantuan.
              </p>
            )}

            <section className="mt-8" aria-labelledby="active-orders">
              <div className="flex items-baseline justify-between gap-2">
                <h2
                  id="active-orders"
                  className="font-serif text-xl font-medium text-offwhite sm:text-2xl"
                >
                  Pesanan aktif
                </h2>
                {active.length > 0 && (
                  <span className="text-xs tabular-nums text-offwhite-muted">
                    {active.length} antrean
                  </span>
                )}
              </div>
              {active.length > 0 ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {active.map((order) => (
                    <CustomerOrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                !loading && (
                  <p className="mt-3 rounded-xl border border-offwhite/10 bg-charcoal-light/50 px-4 py-4 text-sm text-offwhite-muted">
                    Tidak ada pesanan aktif saat ini.
                  </p>
                )
              )}
            </section>

            <section className="mt-10" aria-labelledby="past-orders">
              <h2
                id="past-orders"
                className="font-serif text-xl font-medium text-offwhite sm:text-2xl"
              >
                Riwayat
              </h2>
              {history.length > 0 ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {history.slice((page - 1) * 10, page * 10).map((order) => (
                    <CustomerOrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-offwhite-muted">
                  Pesanan yang telah selesai atau dibatalkan akan tampil di sini.
                </p>
              )}

              {history.length > 10 && (
                <nav
                  className="mt-6 flex items-center justify-center gap-4"
                  aria-label="Halaman riwayat"
                >
                  <button
                    type="button"
                    className="min-h-10 rounded-md border border-offwhite/15 px-3 text-xs font-medium disabled:opacity-40"
                    disabled={page === 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Sebelumnya
                  </button>
                  <span className="text-xs tabular-nums text-offwhite-muted">
                    {page} / {Math.ceil(history.length / 10)}
                  </span>
                  <button
                    type="button"
                    className="min-h-10 rounded-md border border-offwhite/15 px-3 text-xs font-medium disabled:opacity-40"
                    disabled={page * 10 >= history.length}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Berikutnya
                  </button>
                </nav>
              )}
            </section>
          </>
        )}
      </div>
    </Container>
  );
}
