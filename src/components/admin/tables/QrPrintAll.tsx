"use client";

import { useState } from "react";
import Image from "next/image";
import type { AdminFloor, AdminTable } from "@/types";
import AdminNotice from "../AdminNotice";
import { adminButtonClass, adminError, adminSecondaryClass } from "../admin-api";
import { isLocalOnlyUrl, qrBaseUrl, qrPng, tableOrderUrl } from "./qr";

interface QrPrintAllProps {
  floors: AdminFloor[];
  tables: AdminTable[];
  activeFloorId?: string;
}

export default function QrPrintAll({ floors, tables, activeFloorId }: QrPrintAllProps): React.JSX.Element {
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [printTables, setPrintTables] = useState<AdminTable[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");

  const floorTables = activeFloorId ? tables.filter((table) => table.floor_id === activeFloorId && table.order_mode !== "takeaway") : [];
  const activeFloor = floors.find((floor) => floor.id === activeFloorId);

  async function prepare(subset: AdminTable[]): Promise<void> {
    setError("");
    if (isLocalOnlyUrl(qrBaseUrl())) {
      setError("QR akan berisi alamat localhost dan tidak bisa dibuka dari HP pelanggan. Buka dashboard lewat alamat jaringan (mis. http://192.168.x.x:3000) atau domain website, atau isi NEXT_PUBLIC_ORDER_BASE_URL.");
      return;
    }
    setPreparing(true);
    try {
      const entries = await Promise.all(subset.map(async (table) => [table.id, await qrPng(tableOrderUrl(qrBaseUrl(), table.id, table.qr_key))] as const));
      setPrintTables(subset);
      setCodes(Object.fromEntries(entries));
      window.setTimeout(() => { window.print(); setCodes({}); setPrintTables([]); }, 100);
    } catch (cause: unknown) {
      setError(`QR belum siap dicetak. ${adminError(cause)}`);
    } finally {
      setPreparing(false);
    }
  }

  return (
    <>
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          {activeFloor && (
            <button
              type="button"
              disabled={floorTables.length === 0 || preparing}
              className={adminSecondaryClass}
              onClick={() => void prepare(floorTables)}
            >
              {preparing ? "Menyiapkan QR…" : `Cetak QR ${activeFloor.name}`}
            </button>
          )}
          <button
            type="button"
            disabled={tables.length === 0 || preparing}
            className={adminButtonClass}
            onClick={() => void prepare(tables)}
          >
            {preparing ? "Menyiapkan QR…" : "Cetak semua QR"}
          </button>
        </div>
        <AdminNotice message={error} error />
      </div>
      {Object.keys(codes).length > 0 && (
        <div className="qr-print-section hidden grid-cols-2 gap-6 print:grid">
          {printTables.map((table) => {
            const floor = floors.find((item) => item.id === table.floor_id);
            return (
              <article key={table.id} className="qr-print-card border border-black p-5 text-center">
                <p className="text-sm">{floor?.name}</p>
                <h1 className="mt-1 text-2xl font-bold">{table.label}</h1>
                {codes[table.id] && <Image unoptimized src={codes[table.id]} width={192} height={192} alt={`QR meja ${table.label}`} className="mx-auto mt-3 h-48 w-48" />}
                <p className="mt-2 text-xs">Pindai untuk memesan dari meja ini</p>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
