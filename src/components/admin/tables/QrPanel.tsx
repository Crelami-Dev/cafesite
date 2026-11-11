"use client";
import {useDialogFocus} from "../useDialogFocus";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { AdminFloor, AdminTable } from "@/types";
import AdminNotice from "../AdminNotice";
import { adminButtonClass, adminError, adminSecondaryClass } from "../admin-api";
import { downloadData, isLocalOnlyUrl, qrBaseUrl, qrPng, qrSvg, tableOrderUrl } from "./qr";

interface QrPanelProps {
  table: AdminTable;
  floor?: AdminFloor;
  onClose: () => void;
}

export default function QrPanel({ table, floor, onClose }: QrPanelProps): React.JSX.Element {
  useDialogFocus(onClose);
  const [png, setPng] = useState("");
  const [svg, setSvg] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const nextUrl = tableOrderUrl(qrBaseUrl(), table.id, table.qr_key);
    void Promise.all([qrPng(nextUrl), qrSvg(nextUrl)])
      .then(([nextPng, nextSvg]) => {
        if (cancelled) return;
        setUrl(nextUrl);
        setPng(nextPng);
        setSvg(nextSvg);
      })
      .catch((cause: unknown) => { if (!cancelled) setError(adminError(cause)); });
    return () => { cancelled = true; };
  }, [table.id, table.qr_key]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-charcoal-darkest/80 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="qr-title" className="w-full max-w-lg rounded-xl border border-charcoal-border bg-charcoal p-5 shadow-floating md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="qr-title" className="font-serif text-2xl">QR {table.label}</h2>
            <p className="mt-1 truncate text-xs text-offwhite-darker">{floor?.name} · {table.id}</p>
          </div>
          <button type="button" className="min-h-11 shrink-0 px-2 text-sm text-offwhite-muted hover:text-offwhite" onClick={onClose}>Tutup</button>
        </div>

        <AdminNotice message={error} error />

        <div className="mt-5 grid place-items-center rounded-xl bg-offwhite-pure p-5">
          {png ? (
            <Image unoptimized src={png} width={288} height={288} alt={`QR pemesanan untuk ${table.label}`} className="aspect-square w-full max-w-72" />
          ) : (
            <p className="grid aspect-square w-full max-w-72 place-items-center text-sm text-charcoal">Menyiapkan QR…</p>
          )}
        </div>
        {url && <p className="mt-3 break-all text-center text-xs text-offwhite-darker">{url}</p>}
        {url && isLocalOnlyUrl(url) && (
          <AdminNotice
            error
            message="QR ini berisi alamat localhost, jadi tidak bisa dibuka dari HP pelanggan. Buka dashboard lewat alamat jaringan (mis. http://192.168.x.x:3000) atau domain website, atau isi NEXT_PUBLIC_ORDER_BASE_URL, lalu buat QR lagi."
          />
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button disabled={!png} type="button" className={adminSecondaryClass} onClick={() => downloadData(`qr-${table.id}.png`, png)}>Unduh PNG</button>
          <button disabled={!svg} type="button" className={adminSecondaryClass} onClick={() => downloadData(`qr-${table.id}.svg`, svg, "image/svg+xml")}>Unduh SVG</button>
          <button disabled={!png} type="button" className={adminButtonClass} onClick={() => window.print()}>Cetak satu</button>
        </div>
      </section>

      <div className="qr-print-section hidden grid-cols-1 place-items-center p-8 print:grid">
        <article className="qr-print-card text-center">
          <p className="text-lg">{floor?.name}</p>
          <h1 className="mt-2 text-4xl font-bold">{table.label}</h1>
          {png && <Image unoptimized src={png} width={288} height={288} alt="" className="mx-auto mt-5 h-72 w-72" />}
          <p className="mt-4 text-sm">Pindai untuk memesan dari meja ini</p>
        </article>
      </div>
    </div>
  );
}
