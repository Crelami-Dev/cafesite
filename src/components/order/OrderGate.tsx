"use client";
import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { QrScannerModal } from "./QrScannerModal";
import { QrCodeIcon } from "@/components/ui/icons";
export function OrderGate({ invalid, onScan, message = "" }: { invalid: boolean; onScan?: (raw: string) => Promise<void>; message?: string }): React.JSX.Element {
  const [scanner, setScanner] = useState(false);
  return <Container className="gate-screen"><section className="gate" aria-labelledby="scan-heading">
    <div className="gate-visual" aria-hidden="true"><div className="gate-frame"><QrCodeIcon className="gate-frame__icon text-offwhite" /><span className="gate-frame__line" /></div></div>
    <div><h1 id="scan-heading" className="gate-title">Scan QR untuk pesan</h1><p className="mt-3 text-base text-offwhite-muted">Scan QR di meja atau QR Bawa pulang. Setiap pesanan baru perlu scan baru.</p>
      {(invalid || message) && <p role="alert" className="gate-alert">{message || "QR belum memiliki kunci pemesanan. Minta QR terbaru kepada staf."}</p>}
      <button type="button" className="btn btn--primary gate-cta" onClick={() => setScanner(true)}><QrCodeIcon className="h-5 w-5" />Pindai QR</button>
      <Link href="/menu" className="link gate-link">Lihat menu dahulu</Link>
    </div></section>{scanner && <QrScannerModal onClose={() => setScanner(false)} onDecode={onScan} />}</Container>;
}
