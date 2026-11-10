"use client";

import { useEffect, useState } from "react";
import { cafeInfo } from "@/data/cafe";
import type { OpeningHour } from "@/types";
import { isOpenNow, OpenStatusResult } from "@/lib/utils";

/**
 * OpenNowBadge — Status buka/tutup (Client Component)
 * Pill netral hangat tanpa warna semafor (hijau/merah) dan tanpa animasi
 * berkedip — bedanya cuma titik kecil: terracotta saat buka, abu saat tutup.
 * `initialStatus` dihitung di Server Component (parent) agar tidak ada
 * hydration mismatch; setelah mount, badge menyegarkan tiap menit.
 */
export function OpenNowBadge({
  initialStatus,
  hours = cafeInfo.openingHours,
}: {
  initialStatus: OpenStatusResult;
  hours?: OpeningHour[];
}) {
  const [status, setStatus] = useState<OpenStatusResult>(initialStatus);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(isOpenNow(hours));
    }, 60_000);

    return () => clearInterval(interval);
  }, [hours]);

  return (
    <div
      suppressHydrationWarning
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium text-offwhite ${
        status.isOpen
          ? "border-terracotta/40 bg-terracotta/10"
          : "border-charcoal-border/70 bg-charcoal-light/40"
      }`}
      role="status"
      aria-label={status.isOpen ? "Kafe sedang buka" : "Kafe sedang tutup"}
    >
      <span
        suppressHydrationWarning
        className={`h-1.5 w-1.5 rounded-full ${
          status.isOpen ? "bg-terracotta" : "bg-offwhite-darker"
        }`}
        aria-hidden="true"
      />
      <span suppressHydrationWarning>{status.statusText}</span>
    </div>
  );
}
