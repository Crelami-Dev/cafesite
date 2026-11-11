"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import type { DashboardAccount, Order } from "@/types";
import { dashboardNavigation } from "@/lib/admin-navigation";
import { adminRequest, adminError, adminSecondaryClass } from "./admin-api";
import { useOrderSound } from "./orders/useOrderSound";
import DashboardDialog from "./DashboardDialog";

interface DashboardContextValue {
  account: DashboardAccount;
  orders: Order[];
  error: string;
  loading: boolean;
  refresh: () => Promise<void>;
  muted: boolean;
  toggleMuted: () => void;
}

const Context = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const value = useContext(Context);
  if (!value) throw new Error("Dashboard context missing");
  return value;
}

export default function DashboardShell({
  account,
  children,
}: {
  account: DashboardAccount;
  children: ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoutBusy, setLogoutBusy] = useState(false);
  const { muted, toggleMuted, unlock, play } = useOrderSound();
  const known = useRef<Set<string> | null>(null);
  const inFlight = useRef(false);

  const canOrders =
    !account.mustChangePassword &&
    (account.profile.role === "admin" ||
      account.modules.some((m) => m.id === "orders" && m.enabled));

  const refresh = useCallback(async (): Promise<void> => {
    if (!canOrders) {
      setLoading(false);
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await adminRequest<{ orders: Order[] }>("orders?view=active");
      if (
        known.current &&
        data.orders.some((o) => o.status === "waiting" && !known.current!.has(o.id))
      ) {
        play();
      }
      known.current = new Set(data.orders.map((o) => o.id));
      setOrders(data.orders);
      setError("");
    } catch (err) {
      setError(adminError(err));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [canOrders, play]);

  useEffect(() => {
    const tick = (): void => {
      if (!document.hidden) void refresh();
    };
    tick();
    const timer = window.setInterval(tick, 5000);
    document.addEventListener("visibilitychange", tick);
    const audio = (): void => {
      void unlock();
    };
    window.addEventListener("pointerdown", audio, { once: true });
    window.addEventListener("keydown", audio, { once: true });
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("pointerdown", audio);
      window.removeEventListener("keydown", audio);
    };
  }, [refresh, unlock]);

  const available = account.mustChangePassword
    ? []
    : dashboardNavigation.filter(
        (n) =>
          n.id === "summary" ||
          account.profile.role === "admin" ||
          account.modules.some((m) => m.id === n.id && m.enabled),
      );

  const current = dashboardNavigation.find((n) => n.href === pathname);
  const waiting = orders.filter((o) => o.status === "waiting").length;

  // Pilih hingga 3 item utama yang diizinkan untuk navigasi ringkas (mobile & tablet)
  const primaryShortIds = ["summary", "orders", "menu", "tables", "wa_bot", "cafe", "reports"];
  const quickNavItems = available
    .filter((n) => primaryShortIds.includes(n.id))
    .slice(0, 3);

  async function signOut(): Promise<void> {
    setLogoutBusy(true);
    try {
      const r = await fetch("/api/local-auth", { method: "DELETE" });
      if (!r.ok) throw new Error("Belum berhasil keluar.");
      router.replace("/auth");
      router.refresh();
    } catch (err) {
      setError(adminError(err));
      setLogoutBusy(false);
    }
  }

  const nav = (mobile = false): React.JSX.Element => (
    <nav aria-label={mobile ? "Semua halaman" : "Navigasi dashboard"} className="space-y-5">
      {["Kedai", "Operasional", "Konten", "Pengelolaan"].map((group) => {
        const items = available.filter((n) => n.group === group);
        if (items.length === 0) return null;
        return (
          <section key={group}>
            <p className="mb-2 px-3 text-xs font-medium tracking-wide text-offwhite-darker">
              {group}
            </p>
            <div className="grid gap-1">
              {items.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === n.href ? "page" : undefined}
                  className={`flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-charcoal-lighter ${
                    pathname === n.href
                      ? "bg-charcoal-light font-medium text-offwhite"
                      : "text-offwhite-muted"
                  }`}
                >
                  <span>{n.label}</span>
                  {n.id === "orders" && waiting > 0 ? (
                    <span
                      aria-label={`${waiting} pesanan menunggu`}
                      className="rounded-md bg-terracotta px-2 py-0.5 text-xs font-semibold tabular-nums text-offwhite"
                    >
                      {waiting}
                    </span>
                  ) : pathname === n.href ? (
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </nav>
  );

  return (
    <Context.Provider value={{ account, orders, error, loading, refresh, muted, toggleMuted }}>
      <div className="min-h-dvh bg-charcoal text-offwhite md:pl-28 xl:pl-60">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-28 flex-col border-r border-offwhite/10 bg-charcoal-darkest px-3 py-6 md:flex xl:w-60 xl:px-4">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex min-h-11 items-center px-2 font-serif text-xl xl:px-3 xl:text-3xl"
          >
            CafeSite<span className="text-terracotta-light">.</span>
          </Link>
          <div className="hidden flex-1 overflow-y-auto xl:block">{nav()}</div>
          <nav aria-label="Navigasi ringkas" className="grid gap-2 xl:hidden">
            {available.slice(0, 4).map((n) => (
              <Link
                href={n.href}
                key={n.id}
                aria-current={pathname === n.href ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center rounded-lg px-2 py-2.5 text-center text-xs transition ${
                  pathname === n.href
                    ? "bg-charcoal-light font-medium text-offwhite"
                    : "text-offwhite-muted hover:bg-charcoal-light/60"
                }`}
              >
                <span>
                  {n.id === "menu" ? "Menu" : n.label}
                  {n.id === "orders" && waiting > 0 ? ` (${waiting})` : ""}
                </span>
              </Link>
            ))}
            {available.length > 0 && (
              <button
                type="button"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={() => setOpen(true)}
                className="min-h-11 rounded-lg border border-offwhite/10 px-2 text-xs text-offwhite-muted transition hover:border-offwhite/40 hover:text-offwhite"
              >
                Lainnya
              </button>
            )}
          </nav>
          <div className="mt-auto border-t border-offwhite/10 pt-4">
            <p className="hidden truncate px-3 text-sm font-medium text-offwhite xl:block">
              {account.profile.name}
            </p>
            <p className="hidden truncate px-3 text-xs text-offwhite-darker xl:block">
              {account.profile.role === "admin" ? "Pemilik" : "Staf kedai"}
            </p>
            {account.profile.role === "staff" && (
              <Link
                href="/dashboard/password"
                className="mt-2 hidden min-h-11 items-center rounded-lg px-3 text-xs text-offwhite-muted hover:bg-charcoal-light hover:text-offwhite xl:flex"
              >
                Ubah kata sandi
              </Link>
            )}
            <button
              type="button"
              disabled={logoutBusy}
              onClick={() => void signOut()}
              className="mt-1 flex min-h-11 w-full items-center justify-center rounded-lg px-3 text-xs text-offwhite-muted transition hover:bg-charcoal-light hover:text-offwhite xl:justify-start xl:text-sm"
            >
              {logoutBusy ? "Keluar…" : "Keluar"}
            </button>
          </div>
        </aside>

        <div className="mx-auto max-w-[1440px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 md:px-6 md:pb-10 xl:px-10 xl:pt-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-offwhite/10 pb-5">
            <div className="min-w-0">
              <p className="mb-1 text-xs text-offwhite-darker">
                Ruang kelola <span className="md:hidden">/ CafeSite</span>
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl">
                {pathname.endsWith("/password")
                  ? "Kata sandi"
                  : (current?.label ?? "Ringkasan")}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" target="_blank" className={adminSecondaryClass}>
                Lihat website ↗
              </Link>
              {account.profile.role === "staff" && !pathname.endsWith("/password") && (
                <Link href="/dashboard/password" className={adminSecondaryClass}>
                  Kata sandi
                </Link>
              )}
            </div>
          </header>

          {error && (
            <div
              role="alert"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-terracotta/50 bg-terracotta/10 p-4 text-sm"
            >
              <span>! {error}</span>
              <button
                type="button"
                onClick={() => void refresh()}
                className="min-h-11 rounded-lg px-3 font-medium underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          <main id="main-content" className="min-w-0">
            {children}
          </main>
        </div>

        {!account.mustChangePassword && (
          <nav
            aria-label="Navigasi utama"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, quickNavItems.length + 1)}, minmax(0, 1fr))`,
            }}
            className="fixed inset-x-0 bottom-0 z-30 grid border-t border-offwhite/10 bg-charcoal-darkest px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
          >
            {quickNavItems.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                aria-current={pathname === n.href ? "page" : undefined}
                className={`flex min-h-14 items-center justify-center border-t-2 px-1 text-center text-xs transition ${
                  pathname === n.href
                    ? "border-terracotta font-semibold text-offwhite"
                    : "border-transparent text-offwhite-muted"
                }`}
              >
                <span className="truncate">
                  {n.id === "menu" ? "Menu" : n.label}
                  {n.id === "orders" && waiting > 0 ? ` (${waiting})` : ""}
                </span>
              </Link>
            ))}
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
              className="min-h-14 border-t-2 border-transparent px-1 text-xs text-offwhite-muted"
            >
              Lainnya
            </button>
          </nav>
        )}

        {open && (
          <DashboardDialog title="Ruang kelola" onClose={() => setOpen(false)}>
            {nav(true)}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-offwhite/10 pt-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{account.profile.name}</p>
                <p className="truncate text-xs text-offwhite-darker">{account.profile.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {account.profile.role === "staff" && (
                  <Link
                    className={adminSecondaryClass}
                    href="/dashboard/password"
                    onClick={() => setOpen(false)}
                  >
                    Kata sandi
                  </Link>
                )}
                <button
                  type="button"
                  disabled={logoutBusy}
                  onClick={() => void signOut()}
                  className={adminSecondaryClass}
                >
                  {logoutBusy ? "Keluar…" : "Keluar"}
                </button>
              </div>
            </div>
          </DashboardDialog>
        )}
      </div>
    </Context.Provider>
  );
}
