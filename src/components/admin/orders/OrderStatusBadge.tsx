import type { OrderStatus } from "@/types";
import { CheckIcon, ClockIcon, CloseIcon, RefreshIcon } from "@/components/ui/icons";
import StatusBadge from "../ui/StatusBadge";

/** Status pesanan: ikon + kata + isian (tanpa warna ke-4). */
export default function OrderStatusBadge({ status }: { status: OrderStatus }): React.JSX.Element {
  const icon = "size-3.5";
  switch (status) {
    case "waiting":
      return (
        <StatusBadge tone="attention" icon={<ClockIcon className={icon} />}>
          Menunggu
        </StatusBadge>
      );
    case "preparing":
      return (
        <StatusBadge tone="active" icon={<RefreshIcon className={icon} />}>
          Diproses
        </StatusBadge>
      );
    case "ready":
      return (
        <StatusBadge tone="done" icon={<CheckIcon className={icon} />}>
          Siap
        </StatusBadge>
      );
    case "completed":
      return (
        <StatusBadge tone="muted" icon={<CheckIcon className={icon} />}>
          Selesai
        </StatusBadge>
      );
    case "cancelled":
      return (
        <StatusBadge tone="muted" icon={<CloseIcon className={icon} />}>
          Dibatalkan
        </StatusBadge>
      );
  }
}
