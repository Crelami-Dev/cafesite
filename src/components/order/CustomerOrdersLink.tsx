"use client";
import type { CustomerOrdersLinkProps } from "@/types";
import Link from "next/link";
import { useCustomerOrders } from "./CustomerOrdersProvider";
export function CustomerOrdersLink({
  className = "",
  onClick,
  compact = false,
}: CustomerOrdersLinkProps): React.JSX.Element | null {
  const { hasOrders, orders } = useCustomerOrders();
  if (!hasOrders) return null;
  const active = orders.filter(
    (order) => !["completed", "cancelled"].includes(order.status),
  ).length;
  return (
    <Link
      className={`inline-flex min-h-11 items-center gap-2 ${className}`}
      href="/pesanan"
      onClick={onClick}
    >
      {compact ? (
        <>
          <span className="sm:hidden">Pesanan</span>
          <span className="hidden sm:inline">Pesanan saya</span>
        </>
      ) : (
        "Pesanan saya"
      )}
      {active > 0 && (
        <span className="rounded-full bg-terracotta px-2 py-0.5 text-xs text-offwhite">
          {active}
        </span>
      )}
    </Link>
  );
}
