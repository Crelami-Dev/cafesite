"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { QrScannerModal } from "@/components/order/QrScannerModal";
import { CloseIcon, QrCodeIcon } from "@/components/ui/icons";
import { adminRequest, adminError, adminInputClass, adminButtonClass, adminSecondaryClass } from "../admin-api";
import OrderPanel from "./OrderPanel";
import type { Order, CashierOrderScannerProps } from "@/types";
export default function CashierOrderScanner({
  onFound,
}: CashierOrderScannerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [camera, setCamera] = useState(false);
  const [payload, setPayload] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const flying = useRef(false);
  const session = useRef(0);
  const close = useCallback((): void => {
    session.current += 1;
    flying.current = false;
    setBusy(false); setOpen(false); setCamera(false);
  }, []);
  useEffect(() => {
    if (open && !camera) input.current?.focus({ preventScroll: true });
  }, [open, camera]);
  useEffect(() => () => { session.current += 1; }, []);
  const resolve = useCallback(async (raw: string): Promise<void> => {
    if (flying.current) return;
    const current = session.current;
    flying.current = true; setBusy(true); setError("");
    try {
      const result = await adminRequest<{ order: Order | null }>("orders/resolve-qr", {
        method: "POST", body: JSON.stringify({ payload: raw.trim() }),
      });
      if (current !== session.current) return;
      if (!result.order) throw new Error("Pesanan tidak ditemukan. Periksa QR atau nomor pesanan.");
      close();
      onFound(result.order);
    } catch (cause) {
      if (current !== session.current) return;
      if (camera) throw cause;
      setError(adminError(cause));
      input.current?.focus({ preventScroll: true }); input.current?.select();
    } finally {
      if (current === session.current) { flying.current = false; setBusy(false); }
    }
  }, [camera, close, onFound]);
  return (
    <>
      <button
        type="button"
        className={adminSecondaryClass}
        onClick={() => {
          session.current += 1;
          setPayload(""); setError(""); setCamera(false); setOpen(true);
        }}
      >
        <QrCodeIcon className="size-4" /> Scan QR pelanggan
      </button>
      {open && !camera && (
        <OrderPanel titleId="cashier-scan-title" onClose={close}>
          <header className="flex items-start justify-between gap-4 border-b border-offwhite/10 px-5 py-4 dashboard-wide:px-7">
            <div>
              <h2 id="cashier-scan-title" className="font-serif text-2xl">Scan QR pelanggan</h2>
              <p className="mt-2 text-sm leading-relaxed text-offwhite-muted">Scan dengan alat kasir atau masukkan nomor pesanan.</p>
            </div>
            <button type="button" onClick={close} aria-label="Tutup input scanner" className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-charcoal-light">
              <CloseIcon className="size-5" />
            </button>
          </header>
          <div className="grid gap-6 px-5 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dashboard-wide:px-7">
            <form className="grid gap-3" aria-label="Cari pesanan pelanggan" onSubmit={(event) => {
              event.preventDefault(); if (payload.trim()) void resolve(payload);
            }}>
              <label htmlFor="cashier-scan-input" className="text-sm font-medium">QR pelanggan / nomor pesanan</label>
              <input ref={input} id="cashier-scan-input" name="customerQr" type="text" inputMode="text" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={256} value={payload} readOnly={busy}
                aria-describedby={`cashier-scan-help${error ? " cashier-scan-error" : ""}`} aria-invalid={Boolean(error)}
                className={`${adminInputClass} font-mono !text-base`} placeholder="Scan QR atau ketik A-024"
                onChange={(event) => { setPayload(event.target.value); setError(""); }} />
              <p id="cashier-scan-help" className="text-xs leading-relaxed text-offwhite-muted">Klik kolom ini lalu scan. Atur alat scanner agar mengakhiri hasil scan dengan Enter; rincian akan terbuka otomatis.</p>
              {error && <p id="cashier-scan-error" role="alert" className="text-sm leading-relaxed text-terracotta-light">{error}</p>}
              <button type="submit" className={adminButtonClass} disabled={busy || !payload.trim()}>{busy ? "Membuka pesanan…" : "Buka pesanan"}</button>
            </form>
            <section className="border-t border-offwhite/10 pt-5" aria-label="Pilihan kamera">
              <button type="button" className={`${adminSecondaryClass} w-full`} disabled={busy} onClick={() => { setError(""); setCamera(true); }}>
                <QrCodeIcon className="size-4" /> Gunakan kamera
              </button>
              <p className="mt-2 text-xs leading-relaxed text-offwhite-muted">Untuk HP atau tablet dengan kamera. Browser akan meminta izin saat diaktifkan.</p>
            </section>
            <p className="text-xs leading-relaxed text-offwhite-muted">Scan hanya membuka rincian. Konfirmasi pembayaran setelah uang diterima.</p>
          </div>
        </OrderPanel>
      )}
      {open && camera && <QrScannerModal onClose={() => {
        session.current += 1; flying.current = false; setBusy(false); setCamera(false);
      }} onDecode={resolve} kind="cashier" />}
    </>
  );
}
