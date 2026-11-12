"use client";

import type { Order } from "@/types";
import { formatPhone, formatRupiah, fulfillmentLabel, queueLabel } from "./order-format";

interface ReceiptThermalProps {
  order: Order;
  cashierName?: string;
  qrDataUrl?: string;
}

/**
 * Komponen Struk Kasir Thermal Standar 57-58 mm.
 *
 * Didesain dengan prinsip tipografi monospace kasir murni, hitam-putih kontras tinggi,
 * sangat rapi dan proporsional untuk pesanan sedikit (1 item) maupun pesanan banyak (banyak item + catatan khusus).
 */
export default function ReceiptThermal({
  order,
  cashierName = "Kasir",
  qrDataUrl,
}: ReceiptThermalProps): React.JSX.Element {
  const createdDate = order.created_at ? new Date(order.created_at) : new Date();
  const dateFormatted = createdDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeFormatted = createdDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const totalItemsCount = order.items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div
      className="receipt-thermal-paper mx-auto w-full max-w-[270px] bg-white text-black p-4 font-mono text-[11px] leading-tight select-text shadow-md print:shadow-none print:p-0 print:max-w-none print:w-[58mm]"
      style={{
        fontFamily: "'Courier New', Courier, 'Lucida Console', Monaco, monospace",
      }}
    >
      {/* Header Kedai */}
      <div className="text-center">
        <h1 className="text-base font-bold tracking-wider uppercase">CAFESITE.</h1>
        <p className="text-[10px] mt-0.5 text-gray-700">Artisan Coffee & Eatery</p>
        <p className="text-[9px] mt-0.5 text-gray-600 leading-3">
          Jl. Babakan Tengah No. 45, Bogor
          <br />
          Telp/WA: 0896-4785-1864
        </p>
      </div>

      {/* Garis Pembatas Dobel */}
      <div className="my-2 border-b-2 border-black border-dashed" />

      {/* Banner Nomor Antrean */}
      <div className="text-center py-1 bg-gray-100 border border-black/30 rounded-xs print:bg-transparent print:border-black">
        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-800">Nomor Antrean</p>
        <p className="text-2xl font-bold tracking-wider my-0.5">{queueLabel(order.queue_number)}</p>
        <p className="text-[10px] font-semibold uppercase">{fulfillmentLabel(order)}</p>
      </div>

      {/* Garis Pembatas Putus-putus */}
      <div className="my-2 border-b border-black border-dashed" />

      {/* Metadata Transaksi */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span className="text-gray-600">No. Order</span>
          <span className="font-semibold">{order.id ? order.id.slice(0, 8).toUpperCase() : "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Waktu</span>
          <span>{dateFormatted} {timeFormatted}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Pelanggan</span>
          <span className="font-semibold truncate max-w-[130px]">{order.customer_name}</span>
        </div>
        {order.phone && (
          <div className="flex justify-between">
            <span className="text-gray-600">Kontak</span>
            <span>{formatPhone(order.phone)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Kasir</span>
          <span>{cashierName}</span>
        </div>
      </div>

      {/* Garis Pembatas Item */}
      <div className="my-2 border-b border-black border-dashed" />

      {/* Header Tabel Item */}
      <div className="flex justify-between text-[10px] font-bold pb-1 border-b border-black/20">
        <span>MENU</span>
        <div className="flex gap-2">
          <span className="w-6 text-center">QTY</span>
          <span className="w-16 text-right">TOTAL</span>
        </div>
      </div>

      {/* Daftar Item Pesanan */}
      <div className="divide-y divide-black/10 py-1">
        {order.items.map((item, idx) => (
          <div key={item.id || idx} className="py-1.5 first:pt-1 last:pb-1">
            <div className="flex items-start justify-between gap-1 text-[11px]">
              <span className="font-semibold leading-snug flex-1 break-words">
                {item.name}
              </span>
              <div className="flex shrink-0 gap-2 items-start tabular-nums">
                <span className="w-6 text-center text-gray-700">{item.quantity}</span>
                <span className="w-16 text-right font-medium">
                  {formatRupiah(item.unit_price * item.quantity).replace("Rp", "").trim()}
                </span>
              </div>
            </div>

            {/* Sub-informasi harga satuan jika qty > 1 */}
            {item.quantity > 1 && (
              <p className="text-[9px] text-gray-500 pl-0.5">
                @{formatRupiah(item.unit_price).replace("Rp", "").trim()} / porsi
              </p>
            )}

            {/* Catatan Khusus Item (wrap rapi berindentasi) */}
            {item.notes && (
              <p className="mt-0.5 pl-2 text-[9.5px] italic text-gray-700 border-l border-black/30">
                * {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Garis Pembatas Subtotal */}
      <div className="my-2 border-b border-black border-dashed" />

      {/* Rincian Pembayaran */}
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Item ({totalItemsCount})</span>
          <span className="tabular-nums font-medium">
            {formatRupiah(order.total).replace("Rp", "").trim()}
          </span>
        </div>
        <div className="flex justify-between text-[9.5px] text-gray-600">
          <span>Pajak Resto (PB1 0%)</span>
          <span className="tabular-nums">0</span>
        </div>

        <div className="pt-1.5 mt-1 border-t-2 border-black border-dashed flex justify-between items-baseline text-xs font-bold">
          <span className="text-[11px] uppercase tracking-wider">TOTAL AKHIR</span>
          <span className="text-sm tabular-nums">{formatRupiah(order.total)}</span>
        </div>

        <div className="pt-1 flex justify-between items-center text-[10px]">
          <span className="text-gray-600">Metode Bayar</span>
          <span className="font-semibold uppercase">
            {order.payment_method === "cod" ? "Kasir (Tunai / QRIS)" : String(order.payment_method || "Kasir")}
          </span>
        </div>

        <div className="flex justify-between items-center text-[10px]">
          <span className="text-gray-600">Status</span>
          <span className="font-bold tracking-wider px-1.5 py-0.5 bg-black text-white text-[9px] rounded-xs print:border print:border-black print:text-black print:bg-transparent">
            {order.payment_status === "paid" ? "LUNAS" : "BELUM LUNAS"}
          </span>
        </div>
      </div>

      {/* Garis Pembatas Dobel Footer */}
      <div className="my-2.5 border-b-2 border-black border-dashed" />

      {/* QR Code / Barcode Mini & Ucapan */}
      <div className="text-center space-y-1.5">
        {qrDataUrl && (
          <div className="flex justify-center my-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR Pesanan ${queueLabel(order.queue_number)}`}
              className="size-20 print:size-18 mx-auto"
            />
          </div>
        )}

        <p className="text-[9.5px] font-medium leading-tight">
          Terima kasih atas kunjungannya!
        </p>
        <p className="text-[8.5px] text-gray-600 leading-tight">
          Simpan struk ini sebagai bukti pesanan.
          <br />
          IG: @cafesite.id · www.cafesite.id
        </p>

        {/* Pola Gerigi Kertas Kasir (Hanya tampil di preview layar) */}
        <div
          className="pt-2 text-center text-gray-400 text-[8px] tracking-[4px] print:hidden select-none"
          aria-hidden="true"
        >
          - - - - - - - - - - - - - - - -
        </div>
      </div>
    </div>
  );
}
