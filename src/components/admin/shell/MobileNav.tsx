"use client";
import Link from "next/link";
import { MoreIcon } from "@/components/ui/icons";
import { isActive, navIcon, shortLabel, type NavItem } from "./nav-config";

/** Bottom nav mobile: tiga modul utama (menurut izin) + "Lainnya". Tap target 56px. */
export default function MobileNav({
  pathname,
  slots,
  waiting,
  onMore,
  moreOpen,
}: {
  pathname: string;
  slots: readonly NavItem[];
  waiting: number;
  onMore: () => void;
  moreOpen: boolean;
}): React.JSX.Element {
  return (
    <nav
      aria-label="Navigasi utama"
      style={{ gridTemplateColumns: `repeat(${slots.length + 1}, minmax(0, 1fr))` }}
      className="fixed inset-x-0 bottom-0 z-30 grid border-t border-offwhite/10 bg-charcoal-darkest pb-[env(safe-area-inset-bottom)] dashboard-wide:hidden"
    >
      {slots.map((n) => {
        const active = isActive(pathname, n);
        return (
          <Link
            key={n.id}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] transition ${
              active ? "font-semibold text-offwhite" : "text-offwhite-muted"
            }`}
          >
            {active && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-terracotta" />}
            <span className="relative">
              {navIcon(n.id, "size-6")}
              {n.id === "orders" && waiting > 0 && (
                <span
                  aria-label={`${waiting} pesanan menunggu`}
                  className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-terracotta px-1 text-center text-[10px] font-semibold leading-4 tabular-nums text-offwhite-pure"
                >
                  {waiting}
                </span>
              )}
            </span>
            <span className="max-w-full truncate px-1">{shortLabel(n)}</span>
          </Link>
        );
      })}
      <button
        type="button"
        aria-expanded={moreOpen}
        aria-haspopup="dialog"
        onClick={onMore}
        className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-offwhite-muted"
      >
        <MoreIcon className="size-6" />
        Lainnya
      </button>
    </nav>
  );
}
