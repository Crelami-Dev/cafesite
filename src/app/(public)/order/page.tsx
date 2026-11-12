import { OrderStart } from "@/components/order/OrderStart";

import { getMenuItems } from "@/lib/content";

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

  const menu = (await getMenuItems()).filter(item => item.isAvailable !== false);
  return <OrderStart menu={menu} meja={meja} k={key} />;
}
