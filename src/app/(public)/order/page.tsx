import { OrderMenu } from "@/components/order/OrderMenu";
import { menuItems } from "@/data/menu";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import type { MenuItem } from "@/types";
import type { OrderPageProps } from "@/types/ordering";

export const metadata: Metadata = {
  title: "Pesan dari meja",
  description:
    "Pilih menu CafeSite, pesan untuk makan di tempat atau dibawa pulang, dan pantau pesananmu langsung.",
  alternates: { canonical: "/order" },
};

export default async function OrderPage({
  searchParams,
}: OrderPageProps): Promise<ReactElement> {
  const query = await searchParams;
  const tableCode =
    typeof query.meja === "string" ? query.meja.slice(0, 60) : "";
  const addToOrderId =
    typeof query.tambah === "string" ? query.tambah.slice(0, 60) : "";
  // Demo menu remains visibly labelled until the live catalogue is configured.
  const initialMenu: MenuItem[] = menuItems.map((item: MenuItem): MenuItem => ({
    ...item,
    image: item.image?.startsWith("/Image/Menu/") ? item.image : undefined,
  }));
  return (
    <OrderMenu
      key={tableCode}
      initialMenu={initialMenu}
      tableCode={tableCode}
      addToOrderId={addToOrderId}
    />
  );
}
