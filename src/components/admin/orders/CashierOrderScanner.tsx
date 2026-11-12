"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QrScannerModal } from "@/components/order/QrScannerModal";
import { BarcodeIcon, CloseIcon, QrCodeIcon } from "@/components/ui/icons";
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
    setBusy(false);
    setOpen(false);
    setCamera(false);
  }, []);

  useEffect(() => {
    if (open && !camera) {
      const timer = setTimeout(() => {
        input.current?.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, camera]);

  useEffect(() => () => { session.current += 1; }, []);

  const resolve = useCallback(async (raw: string): Promise<void> => {
    if (flying.current) return;
    const current = session.current;
    flying.current = true;
    setBusy(true);
    setError("");

    try {
      const result = await adminRequest<{ order: Order | null }>("orders/resolve-qr", {
        method: "POST",
        body: JSON.stringify({ payload: raw.trim() }),
      });
      if (current !== session.current) return;
      if (!result.order) throw new Error("Pesanan tidak ditemukan. Periksa kembali nomor atau QR.");

      close();
      onFound(result.order);
    } catch (cause) {
      if (current !== session.current) return;
      if (camera) throw cause;
      setError(adminError(cause));
      input.current?.focus({ preventScroll: true });
      input.current?.select();
    } finally {
      if (current === session.current) {
        flying.current = false;
        setBusy(false);
      }
    }
  }, [camera, close, onFound]);

  return (
    <>
      <button
        type="button"
        className={adminSecondaryClass}
        onClick={() => {
          session.current += 1;
          setPayload("");
          setError("");
          setCamera(false);
          setOpen(true);
        }}
      >
        <QrCodeIcon className="size-4" /> Scan QR pelanggan
      </button>

      {open && !camera && (
        <OrderPanel titleId="cashier-scan-title" onClose={close}>
          <header className="flex items-start justify-between gap-4 border-b border-offwhite/10 px-5 py-4 dashboard-wide:px-6">
            <div>
              <h2 id="cashier-scan-title" className="font-serif text-2xl font-medium text-offwhite">
                Scan QR Pelanggan
              </h2>
              <p className="mt-1 text-sm text-offwhite-muted">
                Pindai dengan alat scanner kasir atau gunakan kamera.
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup panel scanner"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-offwhite-muted transition hover:bg-charcoal-light hover:text-offwhite"
            >
              <CloseIcon className="size-5" />
            </button>
          </header>

          <div className="flex flex-1 flex-col justify-between p-5 dashboard-wide:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="space-y-5">
              {/* Tab Pemilihan Mode: Scanner Fisik vs Kamera */}
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-offwhite/10 bg-charcoal-darkest p-1">
                <button
                  type="button"
                  onClick={() => {
                    setCamera(false);
                    input.current?.focus();
                  }}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-charcoal-light px-3 text-sm font-medium text-offwhite shadow-xs transition"
                >
                  <BarcodeIcon className="size-4 text-terracotta-light" />
                  <span>Scanner Fisik</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setCamera(true);
                  }}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-offwhite-muted transition hover:text-offwhite"
                >
                  <QrCodeIcon className="size-4" />
                  <span>Kamera</span>
                </button>
              </div>

              {/* Form Input Scanner Fisik / Ketik Manual */}
              <form
                className="space-y-4"
                aria-label="Form pencarian pesanan"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (payload.trim()) void resolve(payload);
                }}
              >
                <div>
                  <label htmlFor="cashier-scan-input" className="block text-xs font-medium uppercase tracking-wider text-offwhite-darker">
                    Nomor Antrean / Kode QR
                  </label>
                  <div className="relative mt-2">
                    <input
                      ref={input}
                      id="cashier-scan-input"
                      name="customerQr"
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={256}
                      value={payload}
                      readOnly={busy}
                      placeholder="Contoh: A-012 atau arahkan scanner"
                      className={`${adminInputClass} !h-12 pr-10 font-mono !text-base focus:border-terracotta`}
                      onChange={(event) => {
                        setPayload(event.target.value);
                        setError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && payload.trim() && !busy) {
                          event.preventDefault();
                          void resolve(payload);
                        }
                      }}
                    />
                    {payload && (
                      <button
                        type="button"
                        onClick={() => {
                          setPayload("");
                          setError("");
                          input.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-offwhite-muted hover:text-offwhite"
                        aria-label="Bersihkan input"
                      >
                        <CloseIcon className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-offwhite-muted">
                  <span className="size-2 rounded-full bg-emerald-500/80" aria-hidden="true" />
                  <span>Scanner aktif — Enter otomatis membuka rincian</span>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-terracotta/40 bg-terracotta/10 px-3.5 py-2.5 text-sm text-terracotta-light"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !payload.trim()}
                  className={`${adminButtonClass} !min-h-12 w-full text-base font-medium`}
                >
                  {busy ? "Membuka pesanan…" : "Buka Pesanan ↗"}
                </button>
              </form>
            </div>

            <footer className="mt-8 border-t border-offwhite/10 pt-4 text-xs text-offwhite-darker">
              Mendukung nomor antrean, tautan pesanan, dan QR kasir.
            </footer>
          </div>
        </OrderPanel>
      )}

      {open && camera && (
        <QrScannerModal
          onClose={() => {
            session.current += 1;
            flying.current = false;
            setBusy(false);
            setCamera(false);
          }}
          onDecode={resolve}
          kind="cashier"
        />
      )}
    </>
  );
}
