import type { Order } from "@/types";
export const customerStatus: Record<Order["status"], string> = { waiting: "Menunggu pembayaran", preparing: "Sedang disiapkan", ready: "Siap diambil", completed: "Selesai", cancelled: "Dibatalkan" };
