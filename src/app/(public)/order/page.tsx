import { OrderMenu } from "@/components/order/OrderMenu";
import { OrderGate } from "@/components/order/OrderGate";
import { getMenuItems } from "@/lib/content";
import { isLocalMode } from "@/lib/server/local-session";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import type { OrderPageProps } from "@/types/ordering";

export const metadata: Metadata = {
  title: "Pesan dari meja",
  description:
    "Scan QR di meja CafeSite, pilih menu, lalu pesan untuk makan di tempat atau dibawa pulang. Bayar di kasir.",
  alternates: { canonical: "/order" },
};

/**
 * Halaman pesan. Mode lokal (SQLite): wajib scan QR meja dulu (anti iseng) — tanpa ?meja=&k= yang sah,
 * yang tampil adalah layar "Scan QR di meja". Menu selalu dibaca langsung dari database (sama dengan dashboard).
 */
export default async function OrderPage({ searchParams }: OrderPageProps): Promise<ReactElement> {
  const query = await searchParams;
  const meja = typeof query.meja === "string" ? query.meja.slice(0, 60) : "";
  const key = typeof query.k === "string" ? query.k.slice(0, 64) : "";

  if (isLocalMode()) {
    const { resolveScannedTable } = await import("@/lib/server/local-orders");
    const table = meja ? resolveScannedTable(meja, key) : null;
    if (!table) return <OrderGate invalid={Boolean(meja)} />;
    const menu = (await getMenuItems()).filter((item) => item.isAvailable !== false);
    return <OrderMenu key={table.id} initialMenu={menu} table={table} />;
  }

  const menu = (await getMenuItems()).filter((item) => item.isAvailable !== false);
  return <OrderMenu key={meja} initialMenu={menu} table={meja ? { id: meja, label: meja, status: "available", key: "" } : null} />;
}
