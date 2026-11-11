"use client";
import Link from "next/link";
import { LogOutIcon } from "@/components/ui/icons";
import { adminSecondaryClass } from "../admin-api";
import { NAV_GROUPS, isActive, navIcon, type NavItem } from "./nav-config";

/** Isi sheet "Lainnya" (mobile): semua modul yang diizinkan, per grup, plus akun. */
export default function NavSheet({
  pathname,
  items,
  name,
  email,
  canChangePassword,
  logoutBusy,
  onNavigate,
  onSignOut,
}: {
  pathname: string;
  items: readonly NavItem[];
  name: string;
  email: string;
  canChangePassword: boolean;
  logoutBusy: boolean;
  onNavigate: () => void;
  onSignOut: () => void;
}): React.JSX.Element {
  return (
    <div className="grid gap-6">
      <nav aria-label="Semua halaman" className="grid gap-5">
        {NAV_GROUPS.map((group) => {
          const groupItems = items.filter((n) => n.group === group);
          if (groupItems.length === 0) return null;
          return (
            <section key={group}>
              <p className="mb-2 text-xs font-medium text-offwhite-darker">{group}</p>
              <div className="grid grid-cols-2 gap-2">
                {groupItems.map((n) => {
                  const active = isActive(pathname, n);
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 text-sm transition ${
                        active
                          ? "border-terracotta bg-terracotta/10 font-medium text-offwhite"
                          : "border-offwhite/10 text-offwhite-muted hover:border-offwhite/30"
                      }`}
                    >
                      {navIcon(n.id)}
                      <span className="min-w-0 truncate">{n.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      <div className="grid gap-3 border-t border-offwhite/10 pt-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-offwhite-darker">{email}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/" target="_blank" className={adminSecondaryClass}>
            Lihat website
          </Link>
          {canChangePassword ? (
            <Link href="/dashboard/password" onClick={onNavigate} className={adminSecondaryClass}>
              Kata sandi
            </Link>
          ) : (
            <span />
          )}
        </div>
        <button type="button" disabled={logoutBusy} onClick={onSignOut} className={adminSecondaryClass}>
          <LogOutIcon className="size-4" />
          {logoutBusy ? "Keluar…" : "Keluar"}
        </button>
      </div>
    </div>
  );
}
