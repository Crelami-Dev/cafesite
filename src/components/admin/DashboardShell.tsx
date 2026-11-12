"use client";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import type { DashboardAccount, Order } from "@/types";
import { dashboardNavigation } from "@/lib/admin-navigation";
import { adminRequest, adminError } from "./admin-api";
import { useOrderSound } from "./orders/useOrderSound";
import DashboardDialog from "./DashboardDialog";
import Sidebar from "./shell/Sidebar";
import TopBar from "./shell/TopBar";
import MobileNav from "./shell/MobileNav";
import NavSheet from "./shell/NavSheet";
import { mobileSlots } from "./shell/nav-config";

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

  const current = dashboardNavigation.find((n) =>
    n.href === "/dashboard" ? pathname === n.href : pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  const title = pathname.endsWith("/password") ? "Kata sandi" : (current?.label ?? "Ringkasan");
  const waiting = orders.filter((o) => o.status === "waiting").length;
  const slots = mobileSlots(available);

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

  return (
    <Context.Provider value={{ account, orders, error, loading, refresh, muted, toggleMuted }}>
      <div className="min-h-dvh bg-charcoal text-offwhite md:pl-24 xl:pl-60">
        {!account.mustChangePassword && (
          <Sidebar
            pathname={pathname}
            items={available}
            waiting={waiting}
            name={account.profile.name}
            roleLabel={account.profile.role === "admin" ? "Admin" : "Staf kedai"}
            canChangePassword
            logoutBusy={logoutBusy}
            onSignOut={() => void signOut()}
          />
        )}

        <TopBar
          title={title}
          waiting={waiting}
          canOrders={canOrders}
          muted={muted}
          onToggleMuted={toggleMuted}
        />

        <div className="mx-auto max-w-[1280px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 md:px-6 md:pb-12 md:pt-6 xl:px-10 xl:pt-8">
          {error && (
            <div
              role="alert"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-terracotta-light/40 bg-terracotta/10 p-4 text-sm"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void refresh()}
                className="min-h-11 rounded-md px-3 font-medium underline"
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
          <MobileNav
            pathname={pathname}
            slots={slots}
            waiting={waiting}
            moreOpen={open}
            onMore={() => setOpen(true)}
          />
        )}

        {open && (
          <DashboardDialog title="Ruang kelola" onClose={() => setOpen(false)}>
            <NavSheet
              pathname={pathname}
              items={available}
              name={account.profile.name}
              email={account.profile.email}
              canChangePassword
              logoutBusy={logoutBusy}
              onNavigate={() => setOpen(false)}
              onSignOut={() => void signOut()}
            />
          </DashboardDialog>
        )}
      </div>
    </Context.Provider>
  );
}
