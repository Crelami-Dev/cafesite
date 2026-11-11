"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { QrScannerModal } from "./QrScannerModal";
import { QrCodeIcon } from "@/components/ui/icons";
import { forgetScan, readScan, scanUrl } from "@/lib/order-scan";


/**
 * Layar wajib scan: pesanan dari website hanya bisa dibuat setelah memindai QR yang tertempel di meja,
 * supaya tidak ada pesanan iseng dari luar kedai. Hasil scan yang masih berlaku di tab ini langsung dipakai lagi.
 */
export function OrderGate({ invalid }: { invalid: boolean }): React.JSX.Element {
  const router = useRouter();
  const [scanner, setScanner] = useState(false);
  const [checking, setChecking] = useState(!invalid);

  useEffect(() => {
    if (invalid) {
      forgetScan();
      return;
    }
    const stored = readScan();
    if (stored) router.replace(scanUrl(stored));
    else {
      const timer = window.setTimeout(() => setChecking(false), 0);
      return () => window.clearTimeout(timer);
    }
  }, [invalid, router]);

  return (
    <Container className="gate-screen">
      <div className="gate">
        <div className="gate-visual" aria-hidden="true">
          <div className="gate-frame">
            <QrCodeIcon className="gate-frame__icon text-offwhite" />
            <span className="gate-frame__line" />
          </div>
        </div>

        <div>
          <h1 className="gate-title">Scan QR di meja</h1>
          <p className="mt-3 text-base text-offwhite-muted">Arahkan kamera HP ke QR di mejamu.</p>
          {invalid && (
            <p role="alert" className="gate-alert">
              QR tidak dikenali. Scan QR di stiker meja.
            </p>
          )}
          <button type="button" className="btn btn--primary taste-btn-press gate-cta" onClick={() => setScanner(true)} disabled={checking}>
            <QrCodeIcon className="h-5 w-5" />
            {checking ? "Memeriksa…" : "Pindai QR"}
          </button>
          <Link href="/menu" className="link gate-link">
            Lihat menu
          </Link>
        </div>
      </div>
      {scanner && <QrScannerModal onClose={() => setScanner(false)} />}
    </Container>
  );
}
