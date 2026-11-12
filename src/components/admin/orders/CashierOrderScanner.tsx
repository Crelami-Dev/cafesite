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
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const input = useRef<HTMLInputElement>(null);
  const flying = useRef(false);
  const session = useRef(0);

  // Deteksi apakah perangkat adalah tablet / ponsel (layar sentuh / orientasi mobile)
  useEffect(() => {
    const hasTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    const isMobileWidth = typeof window !== "undefined" && window.innerWidth < 1024;
    setIsTouchDevice(hasTouch || isMobileWidth);
  }, []);

  const close = useCallback((): void => {
    session.current += 1;
    flying.current = false;
    setBusy(false);
    setOpen(false);
    setCamera(false);
  }, []);

  useEffect(() => {
    if (open && !camera) {
      // Fokus otomatis ke input scanner fisik saat panel terbuka
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
      if (!result.order) throw new Error("Pesanan tidak ditemukan. Periksa QR atau nomor pesanan.");

      // Tutup modal scanner dan buka rincian pesanan langsung
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
          <header className="flex items-start justify-between gap-4 border-b border-offwhite/10 px-5 py-4 dashboard-wide:px-7">
            <div>
              <h2 id="cashier-scan-title" className="font-serif text-2xl">Scan QR pelanggan</h2>
              <p className="mt-1 text-sm leading-relaxed text-offwhite-muted">
                {isTouchDevice
                  ? "Scan menggunakan kamera tablet/HP atau alat scanner kasir."
                  : "Scan menggunakan alat scanner kasir (USB/Bluetooth) atau masukkan nomor pesanan."}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup input scanner"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-charcoal-light"
            >
              <CloseIcon className="size-5" />
            </button>
          </header>

          <div className="grid gap-6 px-5 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dashboard-wide:px-7">
            {/* Opsi Kamera Menonjol Jika Terdeteksi Tablet/Mobile */}
            {isTouchDevice && (
              <section className="rounded-xl border border-terracotta/30 bg-terracotta/10 p-4" aria-label="Mode Kamera">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-offwhite">Pindai dengan Kamera</p>
                    <p className="mt-0.5 text-xs text-offwhite-muted">Gunakan kamera belakang tablet atau ponsel kasir.</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-terracotta px-4 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-hover active:scale-[.98]"
                    disabled={busy}
                    onClick={() => {
                      setError("");
                      setCamera(true);
                    }}
                  >
                    <QrCodeIcon className="size-4" /> Buka Kamera
                  </button>
                </div>
              </section>
            )}

            {/* Form Input Scanner Fisik / Ketik Manual */}
            <form
              className="grid gap-3"
              aria-label="Cari pesanan pelanggan"
              onSubmit={(event) => {
                event.preventDefault();
                if (payload.trim()) void resolve(payload);
              }}
            >
              <label htmlFor="cashier-scan-input" className="flex items-center justify-between text-sm font-medium">
                <span>Alat Scanner / Nomor Pesanan</span>
                <span className="text-xs text-terracotta-light">Auto-Enter Aktif</span>
              </label>

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
                aria-describedby={`cashier-scan-help${error ? " cashier-scan-error" : ""}`}
                aria-invalid={Boolean(error)}
                className={`${adminInputClass} font-mono !text-base focus:border-terracotta`}
                placeholder="Scan barcode QR atau ketik A-012"
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

              <div className="rounded-lg border border-offwhite/10 bg-charcoal-light/40 p-3">
                <p id="cashier-scan-help" className="text-xs leading-relaxed text-offwhite-muted">
                  💡 <strong>Alat scanner fisik:</strong> Arahkan scanner ke QR pelanggan. Scanner USB/Bluetooth akan otomatis mengisi kolom dan menekan Enter. Rincian pesanan akan terbuka langsung.
                </p>
              </div>

              {error && (
                <p id="cashier-scan-error" role="alert" className="rounded-md border border-terracotta/30 bg-terracotta/10 p-2.5 text-sm leading-relaxed text-terracotta-light">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={adminButtonClass}
                disabled={busy || !payload.trim()}
              >
                {busy ? "Mencari pesanan…" : "Buka Pesanan"}
              </button>
            </form>

            {/* Opsi Kamera untuk Desktop jika PC memiliki webcam */}
            {!isTouchDevice && (
              <section className="border-t border-offwhite/10 pt-5" aria-label="Pilihan kamera alternatif">
                <button
                  type="button"
                  className={`${adminSecondaryClass} w-full`}
                  disabled={busy}
                  onClick={() => {
                    setError("");
                    setCamera(true);
                  }}
                >
                  <QrCodeIcon className="size-4" /> Gunakan webcam / kamera perangkat
                </button>
                <p className="mt-2 text-xs leading-relaxed text-offwhite-muted">
                  Alternatif jika tidak memakai alat scanner fisik. Browser akan meminta izin kamera.
                </p>
              </section>
            )}

            <p className="text-xs leading-relaxed text-offwhite-muted">
              Pemeriksaan QR hanya menampilkan rincian pesanan. Konfirmasi pembayaran tetap dilakukan secara manual setelah uang kasir diterima.
            </p>
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
