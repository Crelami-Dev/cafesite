"use client";
import Link from "next/link";
import { BellIcon, BellOffIcon, ExternalLinkIcon } from "@/components/ui/icons";
import StatusBadge from "../ui/StatusBadge";

/** Bar atas: judul halaman, jumlah pesanan menunggu, suara, dan tautan ke website. */
export default function TopBar({
  title,
  waiting,
  canOrders,
  muted,
  onToggleMuted,
}: {
  title: string;
  waiting: number;
  canOrders: boolean;
  muted: boolean;
  onToggleMuted: () => void;
}): React.JSX.Element {
  return (
    <header className="sticky top-0 z-20 border-b border-offwhite/10 bg-charcoal/95 backdrop-blur supports-[backdrop-filter]:bg-charcoal/85">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 dashboard-wide:h-16 dashboard-wide:px-6 xl:px-10">
        <div className="min-w-0">
          <p className="hidden text-xs text-offwhite-darker dashboard-wide:block">Ruang kelola</p>
          <h1 className="truncate font-serif text-lg font-normal leading-tight text-offwhite dashboard-wide:text-xl">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {canOrders && waiting > 0 && (
            <Link href="/dashboard/orders" aria-label={`${waiting} pesanan menunggu`}>
              <StatusBadge tone="attention">{waiting} baru</StatusBadge>
            </Link>
          )}
          {canOrders && (
            <button
              type="button"
              onClick={onToggleMuted}
              aria-pressed={!muted}
              aria-label={muted ? "Nyalakan suara pesanan" : "Matikan suara pesanan"}
              className="inline-flex size-11 items-center justify-center rounded-md text-offwhite-muted transition hover:bg-charcoal-light hover:text-offwhite"
            >
              {muted ? <BellOffIcon /> : <BellIcon />}
            </button>
          )}
          <Link
            href="/"
            target="_blank"
            className="hidden min-h-11 items-center gap-2 rounded-md border border-offwhite/20 px-3 text-sm text-offwhite transition hover:border-offwhite/40 hover:bg-charcoal-light dashboard-wide:inline-flex"
          >
            Lihat website <ExternalLinkIcon className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
