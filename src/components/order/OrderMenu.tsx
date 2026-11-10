"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { OrderMenuCard } from "./OrderMenuCard";
import { QrScannerModal } from "./QrScannerModal";
import {
  finishOrderRequest,
  orderRequest,
  requestKey,
} from "@/lib/order-client";
import { formatPrice } from "@/lib/utils";
import { menuCategories } from "@/data/menu";
import { Container } from "@/components/ui/Container";
import { CloseIcon, QrCodeIcon } from "@/components/ui/icons";
import type { CatalogResponse, OrderMenuProps } from "@/types";
export function OrderMenu({
  initialMenu,
  tableCode,
}: OrderMenuProps): React.JSX.Element {
  const cart = useCart();
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogResponse>({
    menu: initialMenu,
    tables: [],
    configured: false,
    onlinePayment: false,
  });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scanner, setScanner] = useState(false);
  const [fulfillment, setFulfillment] = useState(
    tableCode ? "dine_in" : "takeaway",
  );
  const dialog = useRef<HTMLFormElement>(null);
  const checkoutButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let live = true;
    void fetch("/api/catalog", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (live && data?.configured) setCatalog(data);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const restoreFocus = checkoutButton.current;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
    const key = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !busy) setOpen(false);
      if (e.key === "Tab") {
        const elements = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>(
            "input:not(:disabled),select,button:not(:disabled)",
          ) ?? [],
        );
        if (e.shiftKey && document.activeElement === elements[0]) {
          e.preventDefault();
          elements.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === elements.at(-1)) {
          e.preventDefault();
          elements[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
      restoreFocus?.focus();
    };
  }, [open, busy]);
  const available = useMemo(
    () => catalog.menu.filter((item) => item.isAvailable !== false),
    [catalog.menu],
  );
  const groups = useMemo(
    () =>
      Array.from(
        new Set([
          ...menuCategories.map((c) => c.id),
          ...available.map((item) => item.category),
        ]),
      )
        .map((id) => ({
          id,
          name: menuCategories.find((c) => c.id === id)?.name ?? id,
          items: available.filter((item) => item.category === id),
        }))
        .filter((group) => group.items.length),
    [available],
  );
  const lines = cart.items.map((line) => ({
    line,
    item: available.find((item) => item.id === line.menuItemId),
  }));
  const invalid = lines.some(({ item }) => !item);
  const total = lines.reduce(
    (sum, { line, item }) => sum + (item?.price ?? 0) * line.quantity,
    0,
  );
  async function checkout(form: FormData): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const payload = {
        customerName: String(form.get("name")),
        phone: String(form.get("phone")),
        fulfillment,
        tableCode:
          fulfillment === "dine_in"
            ? String(form.get("table") || tableCode)
            : undefined,
        paymentMethod: "cod" as const,
        items: cart.items,
      };
      const idempotencyKey = await requestKey("checkout", payload);
      const result = await orderRequest<{ order: { id: string } }>(
        "/api/orders",
        {
          method: "POST",
          body: JSON.stringify({ ...payload, idempotencyKey }),
        },
        true,
      );
      finishOrderRequest("checkout", result.order.id);
      cart.clear();
      router.push(`/order/${result.order.id}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Pesanan belum terkirim.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Container className="pb-28 pt-12 lg:pb-20 lg:pt-16">
      <header className="mb-10">
        <p className="section-label">Pesan di CafeSite</p>
        <h1 className="public-h1 mt-3">Pilih menu. Kami siapkan.</h1>
        <p className="mt-5 text-base text-offwhite-muted">
          {tableCode ? `Meja ${tableCode} · ` : ""}Makan di tempat atau bawa
          pulang. Bayar di kasir.
        </p>
        <button
          className="link mt-3 inline-flex min-h-11 items-center gap-2 text-sm"
          onClick={() => setScanner(true)}
        >
          <QrCodeIcon className="h-4 w-4" />
          Pindai QR meja
        </button>
      </header>
      <div className="order-grid">
        <div>
          <nav
            className="mb-6 flex flex-wrap gap-2"
            aria-label="Kategori pesanan"
          >
            {groups.map((group) => (
              <a
                key={group.id}
                className="menu-anchor text-sm"
                href={`#order-${group.id}`}
              >
                {group.name}
              </a>
            ))}
          </nav>
          {groups.map((group) => (
            <section key={group.id} id={`order-${group.id}`} className="mb-12">
              <h2 className="public-h2">{group.name}</h2>
              {group.items.map((item) => (
                <OrderMenuCard
                  key={item.id}
                  item={item}
                  quantity={
                    cart.items.find((line) => line.menuItemId === item.id)
                      ?.quantity ?? 0
                  }
                  onAdd={() => cart.add(item.id)}
                  onDecrease={() => {
                    const quantity =
                      cart.items.find((line) => line.menuItemId === item.id)
                        ?.quantity ?? 0;
                    if (quantity <= 1) cart.remove(item.id);
                    else cart.update(item.id, { quantity: quantity - 1 });
                  }}
                />
              ))}
            </section>
          ))}
          {!groups.length && <p className="py-12">Menu sedang diperbarui.</p>}
        </div>
        <aside className="order-summary" aria-labelledby="cart-heading">
          <h2 id="cart-heading" className="font-serif text-2xl">
            Pesanan kamu
          </h2>
          {!cart.count ? (
            <p className="my-6 text-base text-offwhite-muted">
              Pilih menu untuk mulai memesan.
            </p>
          ) : (
            <ul className="my-5 space-y-5">
              {lines.map(({ line, item }) => (
                <li key={line.menuItemId}>
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span>
                      {line.quantity} × {item?.name ?? "Menu tidak tersedia"}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 underline underline-offset-4 min-h-11"
                      onClick={() => cart.remove(line.menuItemId)}
                      aria-label={`Hapus ${item?.name ?? "menu"}`}
                    >
                      Hapus
                    </button>
                  </div>
                  <p className="text-sm text-offwhite-muted">
                    {formatPrice((item?.price ?? 0) * line.quantity)}
                  </p>
                  <label className="mt-2 block text-xs text-offwhite-muted">
                    Catatan menu
                    <input
                      maxLength={300}
                      value={line.notes}
                      onChange={(event) =>
                        cart.update(line.menuItemId, {
                          notes: event.target.value,
                        })
                      }
                      className="order-field"
                      placeholder="Opsional"
                    />
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex justify-between border-t border-offwhite/20 pt-5">
            <span>Total</span>
            <strong className="font-medium tabular-nums">
              {formatPrice(total)}
            </strong>
          </div>
          <p className="mt-4 text-sm text-offwhite-muted">
            Bayar di kasir (COD)
          </p>
          <p className="mt-1 text-sm text-offwhite-muted">
            Pembayaran online · Segera hadir
          </p>
          {invalid && (
            <p role="alert" className="mt-3 text-sm text-terracotta-light">
              Hapus menu yang tidak tersedia sebelum melanjutkan.
            </p>
          )}
          <button
            ref={checkoutButton}
            type="button"
            className="btn btn--primary mt-6 w-full disabled:opacity-40"
            disabled={!cart.count || invalid}
            onClick={() => setOpen(true)}
          >
            Lanjutkan pesanan ↗
          </button>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-offwhite/20 bg-charcoal px-6 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:hidden">
        <span className="text-sm">
          {cart.count} item
          <br />
          <strong className="font-medium">{formatPrice(total)}</strong>
        </span>
        <button
          className="btn btn--primary disabled:opacity-40"
          disabled={!cart.count || invalid}
          onClick={() => setOpen(true)}
        >
          Lihat pesanan ↗
        </button>
      </div>
      {open && (
        <div
          className="order-modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setOpen(false);
          }}
        >
          <form
            ref={dialog}
            action={checkout}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-heading"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="checkout-heading" className="font-serif text-2xl">
                Detail pesanan
              </h2>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center"
                disabled={busy}
                aria-label="Tutup checkout"
                onClick={() => setOpen(false)}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-offwhite-muted">
              {cart.count} item · {formatPrice(total)} · Bayar di kasir
            </p>
            <label className="mt-6 block text-sm">
              Nama
              <input
                required
                minLength={2}
                maxLength={100}
                name="name"
                autoComplete="name"
                className="order-field"
              />
            </label>
            <label className="mt-4 block text-sm">
              Nomor WhatsApp
              <input
                required
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={20}
                className="order-field"
              />
            </label>
            <label className="mt-4 block text-sm">
              Untuk
              <select
                name="fulfillment"
                value={fulfillment}
                onChange={(event) => setFulfillment(event.target.value)}
                className="order-field"
              >
                <option value="dine_in">Makan di tempat</option>
                <option value="takeaway">Bawa pulang</option>
              </select>
            </label>
            <label className="mt-4 block text-sm">
              ID meja{" "}
              <span className="text-offwhite-muted">(makan di tempat)</span>
              <input
                required={fulfillment === "dine_in"}
                disabled={fulfillment !== "dine_in"}
                name="table"
                defaultValue={tableCode}
                maxLength={60}
                className="order-field disabled:opacity-40"
                placeholder="Lihat kode pada QR meja"
              />
            </label>
            {error && (
              <p role="alert" className="mt-4 text-sm text-terracotta-light">
                {error}
              </p>
            )}
            <button
              disabled={busy || !cart.count || invalid}
              className="btn btn--primary mt-6 w-full disabled:opacity-40"
            >
              {busy ? "Mengirim…" : "Kirim pesanan"}
            </button>
          </form>
        </div>
      )}
      {scanner && <QrScannerModal onClose={() => setScanner(false)} />}
      <Link className="link mt-6 inline-flex min-h-12 items-center" href="/">
        Kembali ke CafeSite
      </Link>
    </Container>
  );
}
