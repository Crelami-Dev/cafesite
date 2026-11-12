"use client";
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
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
  } = useCustomerOrders();
  const [page, setPage] = useState(1);
  const active = orders.filter(
      (order) => !["completed", "cancelled"].includes(order.status),
    ),
    history = orders.filter((order) =>
      ["completed", "cancelled"].includes(order.status),
    );
  return (
    <Container className="py-10 sm:py-16">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="public-h1">Pesanan saya</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-offwhite-muted">
            Pesanan dari browser ini. Bayar di kasir sebelum pesanan disiapkan.
          </p>
        </div>
        <Link href="/order" className="btn btn--primary">
          Pesan baru · scan QR
        </Link>
      </header>
      {!hasOrders ? (
        <p className="mt-10 rounded-xl border border-offwhite/15 p-6">
          Belum ada pesanan di browser ini. Riwayat muncul setelah pesanan
          berhasil dikirim.
        </p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                void enable();
              }}
            >
              {enabled ? "Pengingat aktif · tes suara" : "Aktifkan pengingat"}
            </button>
            <p className="max-w-md text-xs leading-relaxed text-offwhite-muted">
              Bunyi dan getar jika didukung. Biarkan website aktif saat
              menunggu.
            </p>
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
          {error && (
            <p className="mt-5 text-sm text-terracotta-light" role="status">
              {error} Status terakhir tetap ditampilkan.
            </p>
          )}
          {loading && !orders.length && (
            <p className="mt-8" role="status">
              Memuat pesanan…
            </p>
          )}
          {unavailable.length > 0 && (
            <p className="mt-5 text-sm text-offwhite-muted">
              Sebagian pesanan tidak dapat diakses lagi. Hubungi kasir jika
              membutuhkan bantuan.
            </p>
          )}
          <section className="mt-10" aria-labelledby="active-orders">
            <h2 id="active-orders" className="font-serif text-2xl">
              Aktif{active.length ? ` (${active.length})` : ""}
            </h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {active.map((order) => (
                <CustomerOrderCard key={order.id} order={order} />
              ))}
            </div>
            {!active.length && !loading && (
              <p className="mt-4 text-sm text-offwhite-muted">
                Tidak ada pesanan aktif.
              </p>
            )}
          </section>
          <section className="mt-12" aria-labelledby="past-orders">
            <h2 id="past-orders" className="font-serif text-2xl">
              Riwayat
            </h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {history.slice((page - 1) * 10, page * 10).map((order) => (
                <CustomerOrderCard key={order.id} order={order} />
              ))}
            </div>
            {!history.length && (
              <p className="mt-4 text-sm text-offwhite-muted">
                Pesanan selesai atau dibatalkan akan muncul di sini.
              </p>
            )}
            {history.length > 10 && (
              <nav
                className="mt-5 flex items-center gap-4"
                aria-label="Halaman riwayat"
              >
                <button
                  className="min-h-11 px-3 disabled:opacity-40"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Sebelumnya
                </button>
                <span className="text-sm">
                  {page} / {Math.ceil(history.length / 10)}
                </span>
                <button
                  className="min-h-11 px-3 disabled:opacity-40"
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
    </Container>
  );
}
