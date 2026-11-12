"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { orderRequest, queueLabel } from "@/lib/order-client";
import { usePublicContent } from "@/components/layout/PublicContentProvider";
import { useCustomerOrders } from "./CustomerOrdersProvider";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderItemInput, EditCustomerOrderProps } from "@/types";
export function EditCustomerOrder({
  id,
}: EditCustomerOrderProps): React.JSX.Element {
  const { menu } = usePublicContent(),
    { refresh } = useCustomerOrders(),
    router = useRouter();
  const [order, setOrder] = useState<Order | null>(null),
    [items, setItems] = useState<OrderItemInput[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [choice, setChoice] = useState("");
  useEffect(() => {
    let live = true;
    void orderRequest<{ order: Order }>(`/api/orders/${id}`, {}, false, id)
      .then((result) => {
        if (live) {
          setOrder(result.order);
          setItems(
            result.order.items.map((item) => ({
              menuItemId: item.menu_item_id,
              quantity: item.quantity,
              notes: item.notes,
            })),
          );
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
  }, [id]);
  const editable =
    order?.status === "waiting" && order.payment_status === "unpaid";
  const unavailable = items.some(
    (line) =>
      !menu.some(
        (item) => item.id === line.menuItemId && item.isAvailable !== false,
      ),
  );
  const total = items.reduce(
    (sum, line) =>
      sum +
      (menu.find((item) => item.id === line.menuItemId)?.price ?? 0) *
        line.quantity,
    0,
  );
  async function save(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!editable || busy) return;
    setBusy(true);
    setError("");
    try {
      await orderRequest(
        `/api/orders/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ expectedUpdatedAt: order!.updated_at, items }),
        },
        false,
        id,
      );
      await refresh();
      router.push(`/order/${id}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Perubahan belum tersimpan.",
      );
      setBusy(false);
    }
  }
  return (
    <Container className="py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          className="link inline-flex min-h-11 items-center text-sm"
          href={`/order/${id}`}
        >
          Kembali ke rincian
        </Link>
        <h1 className="public-h1 mt-4">Ubah pesanan</h1>
        <p className="mt-3 text-sm text-offwhite-muted">
          {order
            ? `${queueLabel(order.queue_number)} · ${order.fulfillment === "takeaway" ? "Bawa pulang" : order.table_id}`
            : "Memuat pesanan…"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-offwhite-muted">
          Menu, jumlah, dan catatan bisa diubah sebelum dibayar. Kasir akan
          memakai total terbaru.
        </p>
        {error && (
          <p className="mt-5 text-sm text-terracotta-light" role="alert">
            {error}{" "}
            <Link className="underline" href={`/order/${id}`}>
              Periksa status terbaru.
            </Link>
          </p>
        )}
        {order && !editable && (
          <p className="mt-6 rounded-lg border border-offwhite/20 p-5">
            Pesanan sudah dibayar atau diproses dan tidak dapat diubah. Tambahan
            harus dibuat sebagai pesanan baru.
          </p>
        )}
        {editable && (
          <form
            onSubmit={(event) => {
              void save(event);
            }}
            className="mt-8"
          >
            <fieldset disabled={busy} className="space-y-4">
              {items.map((line, index) => {
                const item = menu.find((value) => value.id === line.menuItemId);
                return (
                  <article
                    className="rounded-xl border border-offwhite/15 bg-charcoal-light p-4"
                    key={line.menuItemId}
                  >
                    <h2 className="text-base font-medium">
                      {item?.name ??
                        order.items.find(
                          (value) => value.menu_item_id === line.menuItemId,
                        )?.name ??
                        "Menu tidak tersedia"}
                    </h2>
                    <label className="mt-3 block text-sm">
                      Jumlah
                      <input
                        className="order-field"
                        required
                        type="number"
                        min={1}
                        max={20}
                        value={line.quantity}
                        onChange={(event) =>
                          setItems((current) =>
                            current.map((value, i) =>
                              i === index
                                ? {
                                    ...value,
                                    quantity: Number(event.target.value),
                                  }
                                : value,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="mt-3 block text-sm">
                      Catatan
                      <input
                        className="order-field"
                        maxLength={300}
                        value={line.notes}
                        onChange={(event) =>
                          setItems((current) =>
                            current.map((value, i) =>
                              i === index
                                ? { ...value, notes: event.target.value }
                                : value,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="mt-2 min-h-11 text-sm text-terracotta-light"
                      onClick={() =>
                        setItems((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      Hapus menu
                    </button>
                  </article>
                );
              })}
              <label className="block text-sm">
                Tambah menu
                <select
                  className="order-field"
                  value={choice}
                  onChange={(event) => setChoice(event.target.value)}
                >
                  <option value="">Pilih menu</option>
                  {menu
                    .filter(
                      (item) =>
                        item.isAvailable !== false &&
                        !items.some((line) => line.menuItemId === item.id),
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {formatPrice(item.price)}
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={!choice}
                onClick={() => {
                  if (choice)
                    setItems((current) => [
                      ...current,
                      { menuItemId: choice, quantity: 1, notes: "" },
                    ]);
                  setChoice("");
                }}
              >
                Tambahkan menu
              </button>
              {unavailable && (
                <p className="text-sm text-terracotta-light">
                  Hapus atau ganti menu yang sudah tidak tersedia.
                </p>
              )}
              <p className="border-t border-offwhite/15 pt-5">
                Total terbaru{" "}
                <strong className="float-right font-medium tabular-nums">
                  {formatPrice(total)}
                </strong>
              </p>
              <button
                disabled={busy || !items.length || unavailable}
                className="btn btn--primary w-full disabled:opacity-40"
              >
                {busy ? "Menyimpan…" : "Simpan perubahan"}
              </button>
            </fieldset>
          </form>
        )}
      </div>
    </Container>
  );
}
