import type { Metadata } from "next";
import { CustomerOrders } from "@/components/order/CustomerOrders";
export const metadata: Metadata = {
  title: "Pesanan saya",
  description: "Pantau pesanan aktif dan riwayat pembelian dari browser ini.",
  robots: { index: false, follow: false },
};
export default function Page(): React.JSX.Element {
  return <CustomerOrders />;
}
