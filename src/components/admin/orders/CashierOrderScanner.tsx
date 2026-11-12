"use client";
import { useCallback, useState } from "react";
import { QrScannerModal } from "@/components/order/QrScannerModal";
import { adminRequest, adminSecondaryClass } from "../admin-api";
import type { Order, CashierOrderScannerProps } from "@/types";
export default function CashierOrderScanner({
  onFound,
}: CashierOrderScannerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const decode = useCallback(
    async (payload: string): Promise<void> => {
      const result = await adminRequest<{ order: Order | null }>(
        "orders/resolve-qr",
        { method: "POST", body: JSON.stringify({ payload }) },
      );
      if (!result.order)
        throw new Error(
          "Pesanan tidak ditemukan. Cari nomor pesanan pelanggan.",
        );
      onFound(result.order.id);
    },
    [onFound],
  );
  return (
    <>
      <button
        type="button"
        className={adminSecondaryClass}
        onClick={() => setOpen(true)}
      >
        Scan QR pelanggan
      </button>
      {open && (
        <QrScannerModal onClose={close} onDecode={decode} kind="cashier" />
      )}
    </>
  );
}
