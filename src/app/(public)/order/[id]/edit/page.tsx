import type { Metadata } from "next";
import { EditCustomerOrder } from "@/components/order/EditCustomerOrder";
import type { OrderTrackingPageProps } from "@/types";
export const metadata: Metadata = {
  title: "Ubah pesanan",
  description: "Ubah pesanan yang belum dibayar sebelum diproses kasir.",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: OrderTrackingPageProps): Promise<React.JSX.Element> {
  return <EditCustomerOrder id={(await params).id} />;
}
