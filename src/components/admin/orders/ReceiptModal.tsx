"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
 * Ukuran halaman otomatis menyesuaikan 58mm x panjang konten (tanpa sisa kertas A4).
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
  const [mounted, setMounted] = useState(false);
  const printTriggered = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Fungsi penyesuaian ukuran kertas 58mm dinamis sebelum dialog cetak dibuka
  const applyThermalPageSize = (): number => {
    const portal = document.getElementById("receipt-print-portal");
    if (!portal) return 180;

    // Buat clone sementara dengan lebar tepat 58mm untuk mengukur tinggi asli kertas kasir
    const clone = portal.cloneNode(true) as HTMLElement;
    clone.id = "temp-thermal-measure-clone";
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.width = "58mm";
    clone.style.display = "block";
    clone.style.visibility = "hidden";
    document.body.appendChild(clone);

    const paper = clone.querySelector(".receipt-thermal-paper") as HTMLElement | null;
    if (paper) {
      paper.style.width = "58mm";
      paper.style.maxWidth = "58mm";
      paper.style.padding = "3mm 2.5mm";
    }

    const heightPx = clone.scrollHeight || clone.offsetHeight;
    clone.remove();

    // 1px ≈ 0.264583 mm @ 96 DPI. Tambahkan 4mm margin aman
    const heightMm = Math.max(90, Math.ceil(heightPx * 0.264583) + 4);

    let style = document.getElementById("thermal-page-size-style") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "thermal-page-size-style";
      document.head.appendChild(style);
    }

    style.textContent = `
      @page {
        size: 58mm ${heightMm}mm !important;
        margin: 0mm !important;
      }
      @media print {
        html, body {
          width: 58mm !important;
          max-width: 58mm !important;
          height: ${heightMm}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          overflow: hidden !important;
        }
      }
    `;

    return heightMm;
  };

  // Bersihkan override style saat modal ditutup
  useEffect(() => {
    return () => {
      const style = document.getElementById("thermal-page-size-style");
      if (style) style.remove();
    };
  }, []);

  // Fungsi Cetak via Window Print dengan setelan ukuran 58mm dan judul file otomatis
  const triggerPrint = (isPdf = false): void => {
    setPrinting(true);
    const originalTitle = document.title;
    const cleanQueue = queueLabel(order.queue_number).replace(/[^a-zA-Z0-9-]/g, "");
    document.title = `Struk-${cleanQueue}-CafeSite`;

    applyThermalPageSize();

    // Pastikan ukuran @page telah diterapkan di DOM sebelum browser print dipanggil
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setPrinting(false);
    }, 150);
  };

  useEffect(() => {
    if (autoPrint && !printTriggered.current && qrUrl && mounted) {
      printTriggered.current = true;
      triggerPrint(false);
    }
  }, [autoPrint, qrUrl, mounted]);

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
            <p className="text-xs text-offwhite-muted">Ukuran kertas pas roll thermal 57–58 mm</p>
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
            title="Pilih 'Save as PDF' di dialog cetak — ukuran kertas langsung pas 58mm"
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
              Ukuran kertas otomatis <strong>58mm × panjang pesanan</strong>. Pada printer kasir atau Save as PDF, tidak akan menyisakan ruang kosong A4.
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

      {/* Target Cetak Terisolasi (Langsung di body agar bebas dari layout dashboard) */}
      {mounted &&
        createPortal(
          <div id="receipt-print-portal" className="hidden print:block">
            <ReceiptThermal order={order} cashierName={cashierName} qrDataUrl={qrUrl} />
          </div>,
          document.body,
        )}
    </div>
  );
}

