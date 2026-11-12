"use client";
import Link from "next/link";
import { LogOutIcon } from "@/components/ui/icons";
import { NAV_GROUPS, isActive, navIcon, shortLabel, type NavItem } from "./nav-config";

/**
 * Navigasi desktop. Tablet (md): rail ikon + label singkat 96px. Desktop (xl): sidebar 240px dengan grup.
 */
export default function Sidebar({
  pathname,
  items,
  waiting,
  name,
  roleLabel,
  canChangePassword,
  logoutBusy,
  onSignOut,
}: {
  pathname: string;
  items: readonly NavItem[];
  waiting: number;
  name: string;
  roleLabel: string;
  canChangePassword: boolean;
  logoutBusy: boolean;
  onSignOut: () => void;
}): React.JSX.Element {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-24 flex-col border-r border-offwhite/10 bg-charcoal-darkest py-5 dashboard-wide:flex xl:w-60">
      <Link
        href="/dashboard"
        className="mb-5 flex min-h-11 items-center justify-center font-serif text-lg xl:justify-start xl:px-5 xl:text-2xl"
      >
        <span className="xl:hidden">
          C<span className="text-terracotta-light">.</span>
        </span>
        <span className="hidden xl:inline">
          CafeSite<span className="text-terracotta-light">.</span>
        </span>
      </Link>

      <nav aria-label="Navigasi dashboard" className="flex-1 space-y-5 overflow-y-auto px-2 xl:px-3">
        {NAV_GROUPS.map((group) => {
          const groupItems = items.filter((n) => n.group === group);
          if (groupItems.length === 0) return null;
          return (
            <section key={group}>
              <p className="mb-1.5 hidden px-3 text-xs font-medium text-offwhite-darker xl:block">{group}</p>
              <div className="grid gap-1">
                {groupItems.map((n) => {
                  const active = isActive(pathname, n);
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[11px] leading-tight transition xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-sm ${
                        active
                          ? "bg-charcoal-light font-medium text-offwhite"
                          : "text-offwhite-muted hover:bg-charcoal-light/60 hover:text-offwhite"
                      }`}
                    >
                      {active && (
                        <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-terracotta" />
                      )}
                      {navIcon(n.id)}
                      <span className="max-w-full truncate xl:flex-1">
                        <span className="xl:hidden">{shortLabel(n)}</span>
                        <span className="hidden xl:inline">{n.label}</span>
                      </span>
                      {n.id === "orders" && waiting > 0 && (
                        <span
                          aria-label={`${waiting} pesanan menunggu`}
                          className="absolute right-2 top-1.5 min-w-5 rounded-full bg-terracotta px-1.5 text-center text-[11px] font-semibold tabular-nums text-offwhite-pure xl:static"
                        >
                          {waiting}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-offwhite/10 px-2 pt-3 xl:px-3">
        <div className="hidden px-3 pb-1 xl:block">
          <p className="truncate text-sm font-medium text-offwhite">{name}</p>
          <p className="truncate text-xs text-offwhite-darker">{roleLabel}</p>
        </div>
        {canChangePassword && (
          <Link
            href="/dashboard/password"
            className="hidden min-h-11 items-center rounded-md px-3 text-sm text-offwhite-muted hover:bg-charcoal-light hover:text-offwhite xl:flex"
          >
            Ubah kata sandi
          </Link>
        )}
        <button
          type="button"
          disabled={logoutBusy}
          onClick={onSignOut}
          className="flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-md text-[11px] text-offwhite-muted transition hover:bg-charcoal-light hover:text-offwhite disabled:opacity-50 xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-sm"
        >
          <LogOutIcon className="size-5" />
          {logoutBusy ? "Keluar…" : "Keluar"}
        </button>
      </div>
    </aside>
  );
}
