"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { OrderMenuCard } from "./OrderMenuCard";
import { QrScannerModal } from "./QrScannerModal";
import {
  finishOrderRequest,
  orderRequest,
  rememberOrderToken,
  requestKey,
} from "@/lib/order-client";
import { rememberScan } from "@/lib/order-scan";
import { formatPrice } from "@/lib/utils";
import { menuCategories } from "@/data/menu";
import { usePublicContent } from "@/components/layout/PublicContentProvider";
import { Container } from "@/components/ui/Container";
import { CloseIcon, QrCodeIcon } from "@/components/ui/icons";
import type { OrderMenuProps } from "@/types";

/**
 * Halaman pesan setelah scan QR meja: kategori menempel di atas saat discroll, daftar menu dari database,
 * ringkasan pesanan di samping (desktop) atau bar bawah (HP), lalu formulir singkat: nama, nomor WhatsApp,
 * makan di meja ini atau bawa pulang. Meja diambil dari QR, jadi tamu tidak perlu memilih meja lagi.
 */
export function OrderMenu({ initialMenu, table }: OrderMenuProps): React.JSX.Element {
  const cart = useCart();
  const router = useRouter();
  const tableBusy = table?.status !== undefined && table.status !== "available";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scanner, setScanner] = useState(false);
  const [fulfillment, setFulfillment] = useState<"dine_in" | "takeaway">(table && !tableBusy ? "dine_in" : "takeaway");
  const dialog = useRef<HTMLFormElement>(null);
  const checkoutButton = useRef<HTMLButtonElement>(null);

  // Simpan hasil scan supaya kembali ke /order dari halaman lain tidak perlu scan ulang.
  useEffect(() => {
    if (table?.key) rememberScan(table.id, table.key);
  }, [table]);

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
          dialog.current?.querySelectorAll<HTMLElement>("input:not(:disabled),button:not(:disabled)") ?? [],
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

  const { categories, menu: contextMenu } = usePublicContent();
  const activeMenu = contextMenu.length > 0 ? contextMenu : initialMenu;
  const activeCategories = categories && categories.length > 0 ? categories : menuCategories;
  const available = useMemo(() => activeMenu.filter((item) => item.isAvailable !== false), [activeMenu]);
  const groups = useMemo(
    () =>
      Array.from(new Set([...activeCategories.map((c) => c.id), ...available.map((item) => item.category)]))
        .map((id) => ({
          id,
          name: activeCategories.find((c) => c.id === id)?.name ?? id,
          items: available.filter((item) => item.category === id),
        }))
        .filter((group) => group.items.length),
    [activeCategories, available],
  );
  const lines = cart.items.map((line) => ({ line, item: available.find((item) => item.id === line.menuItemId) }));
  const invalid = lines.some(({ item }) => !item);
  const total = lines.reduce((sum, { line, item }) => sum + (item?.price ?? 0) * line.quantity, 0);
  const quantityOf = (id: string): number => cart.items.find((line) => line.menuItemId === id)?.quantity ?? 0;

  async function checkout(form: FormData): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const payload = {
        customerName: String(form.get("name")),
        phone: String(form.get("phone")),
        fulfillment,
        tableCode: table?.id,
        tableKey: table?.key,
        paymentMethod: "cod" as const,
        items: cart.items,
      };
      const idempotencyKey = await requestKey("checkout", payload);
      const result = await orderRequest<{ order: { id: string }; accessToken?: string }>(
        "/api/orders",
        { method: "POST", body: JSON.stringify({ ...payload, idempotencyKey }) },
        true,
      );
      if (result.accessToken) rememberOrderToken(result.order.id, result.accessToken);
      finishOrderRequest("checkout", result.order.id);
      cart.clear();
      router.push(`/order/${result.order.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pesanan belum terkirim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container className="pb-32 pt-10 lg:pb-20 lg:pt-14">
      <header className="order-head">
        <div>
          {table && (
            <p className="order-table-pill">
              <QrCodeIcon className="h-4 w-4" />
              Meja {table.label}
            </p>
          )}
          <h1 className="public-h1 mt-4">Pilih menu, kami siapkan</h1>
          <p className="mt-3 text-base text-offwhite-muted">Tambah menu ke pesanan, lalu kirim. Bayar di kasir saat pesanan siap.</p>
        </div>
        {table && (
          <button type="button" className="link inline-flex min-h-11 items-center text-sm" onClick={() => setScanner(true)}>
            Bukan mejamu? Scan ulang
          </button>
        )}
      </header>

      <nav className="order-cats" aria-label="Kategori menu">
        {groups.map((group) => (
          <a key={group.id} className="menu-anchor text-sm" href={`#order-${group.id}`}>
            {group.name}
          </a>
        ))}
      </nav>

      <div className="order-grid">
        <div>
          {groups.map((group) => (
            <section key={group.id} id={`order-${group.id}`} className="order-group" aria-labelledby={`order-${group.id}-heading`}>
              <h2 id={`order-${group.id}-heading`} className="font-serif text-3xl">
                {group.name}
              </h2>
              {group.items.map((item) => (
                <OrderMenuCard
                  key={item.id}
                  item={item}
                  quantity={quantityOf(item.id)}
                  onAdd={() => cart.add(item.id)}
                  onDecrease={() => {
                    const quantity = quantityOf(item.id);
                    if (quantity <= 1) cart.remove(item.id);
                    else cart.update(item.id, { quantity: quantity - 1 });
                  }}
                />
              ))}
            </section>
          ))}
          {!groups.length && <p className="py-12">Menu sedang diperbarui. Silakan pesan di kasir.</p>}
        </div>

        <aside className="order-summary" aria-labelledby="cart-heading">
          <h2 id="cart-heading" className="font-serif text-2xl">
            Pesanan kamu
          </h2>
          {!cart.count ? (
            <p className="my-6 text-base text-offwhite-muted">Belum ada menu. Ketuk “Tambah” pada menu yang kamu mau.</p>
          ) : (
            <ul className="my-5 divide-y divide-offwhite/10">
              {lines.map(({ line, item }) => (
                <li key={line.menuItemId} className="py-4 first:pt-0">
                  <div className="flex items-start justify-between gap-3 text-base">
                    <span>
                      {line.quantity} × {item?.name ?? "Menu tidak tersedia"}
                    </span>
                    <span className="shrink-0 tabular-nums">{formatPrice((item?.price ?? 0) * line.quantity)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      maxLength={300}
                      value={line.notes}
                      onChange={(event) => cart.update(line.menuItemId, { notes: event.target.value })}
                      className="order-field order-field--sm"
                      placeholder="Catatan (opsional)"
                      aria-label={`Catatan untuk ${item?.name ?? "menu"}`}
                    />
                    <button
                      type="button"
                      className="min-h-11 shrink-0 text-sm text-offwhite-muted underline underline-offset-4 hover:text-offwhite"
                      onClick={() => cart.remove(line.menuItemId)}
                      aria-label={`Hapus ${item?.name ?? "menu"}`}
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-between border-t border-offwhite/20 pt-5 text-lg">
            <span>Total</span>
            <strong className="font-medium tabular-nums">{formatPrice(total)}</strong>
          </div>
          <p className="mt-2 text-sm text-offwhite-muted">Bayar di kasir (tunai atau non-tunai sesuai kasir).</p>
          {invalid && (
            <p role="alert" className="mt-3 text-sm text-terracotta-light">
              Hapus menu yang sudah tidak tersedia sebelum melanjutkan.
            </p>
          )}
          <button
            ref={checkoutButton}
            type="button"
            className="btn btn--primary mt-6 w-full disabled:opacity-40"
            disabled={!cart.count || invalid}
            onClick={() => setOpen(true)}
          >
            Lanjut ke data pemesan
          </button>
        </aside>
      </div>

      {cart.count > 0 && (
        <div className="order-bar lg:hidden">
          <span className="text-sm">
            {cart.count} item · <strong className="font-medium tabular-nums">{formatPrice(total)}</strong>
          </span>
          <button className="btn btn--primary disabled:opacity-40" disabled={invalid} onClick={() => setOpen(true)}>
            Lanjut pesan
          </button>
        </div>
      )}

      {open && (
        <div
          className="order-modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setOpen(false);
          }}
        >
          <form ref={dialog} action={checkout} role="dialog" aria-modal="true" aria-labelledby="checkout-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="checkout-heading" className="font-serif text-2xl">
                Data pemesan
              </h2>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center"
                disabled={busy}
                aria-label="Tutup"
                onClick={() => setOpen(false)}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-offwhite-muted">
              {cart.count} item · {formatPrice(total)} · bayar di kasir
            </p>

            <fieldset className="mt-6">
              <legend className="text-sm">Pesanan untuk</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="choice"
                  aria-pressed={fulfillment === "dine_in"}
                  disabled={!table || tableBusy}
                  onClick={() => setFulfillment("dine_in")}
                >
                  Makan di meja{table ? ` ${table.label}` : ""}
                </button>
                <button
                  type="button"
                  className="choice"
                  aria-pressed={fulfillment === "takeaway"}
                  onClick={() => setFulfillment("takeaway")}
                >
                  Bawa pulang
                </button>
              </div>
              {tableBusy && (
                <p className="mt-2 text-sm text-offwhite-muted">
                  Meja {table?.label} masih punya pesanan aktif. Untuk tambah pesanan ke meja ini, sampaikan ke kasir.
                </p>
              )}
            </fieldset>

            <label className="mt-5 block text-sm">
              Nama
              <input required minLength={2} maxLength={80} name="name" autoComplete="name" className="order-field" placeholder="Nama panggilan" />
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
                placeholder="08xxxxxxxxxx"
              />
              <span className="mt-1 block text-xs text-offwhite-muted">Kami kabari di sini saat pesanan siap.</span>
            </label>

            {error && (
              <p role="alert" className="mt-4 text-sm text-terracotta-light">
                {error}
              </p>
            )}
            <button disabled={busy || !cart.count || invalid} className="btn btn--primary mt-6 w-full disabled:opacity-40">
              {busy ? "Mengirim…" : `Kirim pesanan · ${formatPrice(total)}`}
            </button>
          </form>
        </div>
      )}
      {scanner && <QrScannerModal onClose={() => setScanner(false)} />}
    </Container>
  );
}
