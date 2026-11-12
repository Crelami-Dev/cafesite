"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Order } from "@/types";
import { CloseIcon, DownloadIcon, PrinterIcon } from "@/components/ui/icons";
import { adminButtonClass, adminSecondaryClass } from "../admin-api";
import { useDialogFocus } from "../useDialogFocus";
import { queueLabel } from "./order-format";
import ReceiptThermal from "./ReceiptThermal";

interface ReceiptModalProps {
  order: Order;
  cashierName?: string;
  onClose: () => void;
  autoPrint?: boolean;
}

/**
 * Modal Preview & Print Struk Kasir Thermal (57x30 mm roll format).
 *
 * Menampilkan representasi fisik kertas thermal 57mm yang presisi,
 * dengan aksi 1-klik untuk "Cetak Struk" (Thermal POS) dan "Simpan PDF".
 */
export default function ReceiptModal({
  order,
  cashierName = "Kasir",
  onClose,
  autoPrint = false,
}: ReceiptModalProps): React.JSX.Element {
  useDialogFocus(onClose);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [printing, setPrinting] = useState(false);
  const printTriggered = useRef(false);

  // Buat QR code mini hitam-putih murni
  useEffect(() => {
    let active = true;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const orderUrl = `${origin}/order/${order.id}`;

    QRCode.toDataURL(orderUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch(() => {
        // Fallback jika pembuatan QR URL gagal
      });

    return () => {
      active = false;
    };
  }, [order.id]);

  // Fungsi Cetak via Window Print dengan setelan judul file rapi
  const triggerPrint = (isPdf = false): void => {
    setPrinting(true);
    const originalTitle = document.title;
    const cleanQueue = queueLabel(order.queue_number).replace(/[^a-zA-Z0-9-]/g, "");
    document.title = `Struk-${cleanQueue}-CafeSite`;

    // Pastikan area print siap
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setPrinting(false);
    }, 150);
  };

  useEffect(() => {
    if (autoPrint && !printTriggered.current && qrUrl) {
      printTriggered.current = true;
      triggerPrint(false);
    }
  }, [autoPrint, qrUrl]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-darkest/85 backdrop-blur-xs p-4 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-modal-title"
        className="relative flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-offwhite/15 bg-charcoal shadow-2xl"
      >
        {/* Header Modal */}
        <header className="flex items-center justify-between border-b border-offwhite/10 px-5 py-3.5">
          <div>
            <h2 id="receipt-modal-title" className="font-serif text-lg font-medium text-offwhite">
              Struk Transaksi · {queueLabel(order.queue_number)}
            </h2>
            <p className="text-xs text-offwhite-muted">Ukuran standar thermal kasir 57–58 mm</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau struk"
            className="inline-flex size-9 items-center justify-center rounded-md text-offwhite-muted transition hover:bg-charcoal-light hover:text-offwhite"
          >
            <CloseIcon className="size-4" />
          </button>
        </header>

        {/* Bilah Aksi Cepat Cetak & PDF */}
        <div className="grid grid-cols-2 gap-2.5 border-b border-offwhite/10 bg-charcoal-darkest/60 px-5 py-3">
          <button
            type="button"
            onClick={() => triggerPrint(false)}
            disabled={printing}
            className={`${adminButtonClass} !min-h-10 text-xs font-semibold gap-2`}
          >
            <PrinterIcon className="size-4" />
            <span>Cetak Struk (Print)</span>
          </button>
          <button
            type="button"
            onClick={() => triggerPrint(true)}
            disabled={printing}
            className={`${adminSecondaryClass} !min-h-10 text-xs font-medium gap-2 border-offwhite/20`}
            title="Pilih 'Save as PDF' di jendela dialog cetak"
          >
            <DownloadIcon className="size-4" />
            <span>Simpan PDF</span>
          </button>
        </div>

        {/* Kontainer Pratinjau Kertas Thermal (Scrollable jika pesanan panjang) */}
        <div className="flex-1 overflow-y-auto overscroll-contain bg-charcoal-darkest p-4 sm:p-6">
          <div className="mx-auto max-w-[280px]">
            {/* Indikator Roll Kertas */}
            <div className="mb-2 flex items-center justify-between text-[11px] text-offwhite-darker px-1">
              <span>Roll 57×30 mm</span>
              <span>Hitam-Putih Murni</span>
            </div>

            {/* Kertas Struk */}
            <div
              id="printable-receipt-card"
              className="receipt-preview-container rounded-sm overflow-hidden bg-white text-black shadow-xl"
            >
              <ReceiptThermal order={order} cashierName={cashierName} qrDataUrl={qrUrl} />
            </div>

            <p className="mt-3 text-center text-[11px] text-offwhite-darker leading-relaxed">
              Tips: Pada dialog print, gunakan margin <strong>None</strong> dan aktifkan <strong>Background graphics</strong> untuk hasil cetak thermal terbaik.
            </p>
          </div>
        </div>

        {/* Footer Selesai */}
        <footer className="border-t border-offwhite/10 bg-charcoal px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-9 px-4 rounded-md text-xs font-medium text-offwhite-muted hover:text-offwhite hover:bg-charcoal-light transition"
          >
            Kembali ke rincian
          </button>
        </footer>
      </div>

      {/* Target Cetak Terisolasi (Hanya muncul saat @media print) */}
      <div id="receipt-print-portal" className="hidden print:block">
        <ReceiptThermal order={order} cashierName={cashierName} qrDataUrl={qrUrl} />
      </div>
    </div>
  );
}
