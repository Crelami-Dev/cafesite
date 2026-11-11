"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminBootstrap, AdminModule, Order } from "@/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { adminError, adminRequest, adminSecondaryClass } from "./admin-api";
import AdminNotice from "./AdminNotice";
import AdminManage from "./AdminManage";
import MenuManager from "./MenuManager";
import WaBotManager from "./WaBotManager";
import TableManager from "./tables/TableManager";
import OrderManager from "./orders/OrderManager";
import { useOrderSound } from "./orders/useOrderSound";

interface ModuleMeta {
  id: AdminModule;
  label: string;
  caption: string;
}

const navigation: ModuleMeta[] = [
  { id: "wa_bot", label: "WhatsApp Bot", caption: "Dokumen RAG & status asisten WhatsApp." },
  { id: "orders", label: "Pesanan", caption: "Dari pesanan masuk sampai tersaji ke meja." },
  { id: "menu", label: "Menu kedai", caption: "Pilihan yang membuat mereka kembali." },
  { id: "tables", label: "Meja & QR", caption: "Tempat untuk setiap cerita." },
  { id: "cafe", label: "Info kafe", caption: "Bantu mereka menemukan kedai." },
  { id: "gallery", label: "Galeri", caption: "Sudut-sudut kecil yang berarti." },
  { id: "testimonials", label: "Testimoni", caption: "Cerita dari mereka yang singgah." },
  { id: "faq", label: "Pertanyaan umum", caption: "Jawaban yang membuat kunjungan lebih mudah." },
  { id: "location", label: "Panduan lokasi", caption: "Arah yang jelas, sambutan yang hangat." },
  { id: "reports", label: "Laporan", caption: "Kenali ritme kedai dari angkanya." },
  { id: "modules", label: "Akses tim", caption: "Ruang kerja yang sesuai untuk tim." },
];

const groups: { title: string; ids: AdminModule[] }[] = [
  { title: "Operasional", ids: ["orders", "menu", "tables", "wa_bot"] },
  { title: "Konten", ids: ["cafe", "gallery", "testimonials", "faq", "location"] },
  { title: "Analitik & tim", ids: ["reports", "modules"] },
];

export default function AdminDashboard({ localMode = false }: { localMode?: boolean }): React.JSX.Element {
  const [account, setAccount] = useState<AdminBootstrap | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<AdminModule>("orders");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [newOrderPulse, setNewOrderPulse] = useState(false);
  const waitingIds = useRef(new Set<string>());
  const knownOrderIds = useRef(new Set<string>());
  const latestOrderStatuses = useRef(new Map<string, string | null>());
  const activeModule = useRef<AdminModule>("orders");
  const { muted, toggleMuted, unlock, play } = useOrderSound();
  const client = localMode ? null : getBrowserSupabase();
  const router = useRouter();
  useEffect(() => { activeModule.current = active; }, [active]);

  const loadAccount = useCallback(
    async (): Promise<void> => {
      if (localMode) { setAccount({ profile: { id: "local-admin", role: "admin" }, modules: [] }); setAuthenticated(true); setLoading(false); return; }
      if (!client) {
        setLoading(false);
        return;
      }
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        setAccount(null);
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      setAuthenticated(true);
      try {
        setAccount(await adminRequest<AdminBootstrap>("bootstrap"));
        setError("");
      } catch (cause: unknown) {
        setAccount(null);
        setError(adminError(cause));
      } finally {
        setLoading(false);
      }
    },
    [client, localMode],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAccount(); }, 0);
    const listener = client?.auth.onAuthStateChange(() => {
      window.setTimeout(() => { void loadAccount(); }, 0);
    });
    return () => {
      window.clearTimeout(timer);
      listener?.data.subscription.unsubscribe();
    };
  }, [client, loadAccount]);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/auth");
    }
  }, [authenticated, loading, router]);

  useEffect(() => {
    if (!client || !account) return;
    const channel = client
      .channel("admin-permissions")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_modules" }, () => { void loadAccount(); })
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [client, account, loadAccount]);

  const canUseOrders = account?.profile.role === "admin" || account?.modules.some((module) => module.id === "orders" && module.enabled) === true;
  useEffect(() => {
    if (!client || !account || !canUseOrders) return;
    waitingIds.current.clear();
    knownOrderIds.current.clear();
    latestOrderStatuses.current.clear();
    let cancelled = false;
    void client.from("orders").select("id,status").then(({ data }) => {
      if (cancelled) return;
      const statuses = new Map((data ?? []).map((order) => [order.id, order.status]));
      latestOrderStatuses.current.forEach((status, id) => { if (status === null) statuses.delete(id); else statuses.set(id, status); });
      waitingIds.current = new Set([...statuses].filter(([, status]) => status === "waiting").map(([id]) => id));
      knownOrderIds.current = new Set([...knownOrderIds.current, ...(data ?? []).map((order) => order.id)]);
      setPendingOrders(waitingIds.current.size);
    });
    const channel = client.channel("admin-order-counter").on<Order>("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
      const id = String(payload.eventType === "DELETE" ? payload.old.id : payload.new.id);
      if (payload.eventType === "INSERT" && payload.new.status === "waiting" && !knownOrderIds.current.has(id)) { if (activeModule.current !== "orders") setNewOrderPulse(true); play(); }
      knownOrderIds.current.add(id);
      latestOrderStatuses.current.set(id, payload.eventType === "DELETE" ? null : String(payload.new.status));
      if (payload.eventType !== "DELETE" && payload.new.status === "waiting") waitingIds.current.add(id); else waitingIds.current.delete(id);
      setPendingOrders(waitingIds.current.size);
    }).subscribe();
    return () => { cancelled = true; void client.removeChannel(channel); };
  }, [account, canUseOrders, client, play]);

  // Mode lokal: hitung pesanan menunggu lewat polling (pengganti realtime Supabase).
  useEffect(() => {
    if (client || !localMode || !account) return;
    let first = true;
    const check = (): void => {
      if (document.hidden) return;
      void adminRequest<{ orders: Order[] }>("orders").then(({ orders }) => {
        const waiting = new Set(orders.filter((order) => order.status === "waiting").map((order) => order.id));
        const hasNew = [...waiting].some((id) => !knownOrderIds.current.has(id));
        if (hasNew && !first) { if (activeModule.current !== "orders") setNewOrderPulse(true); play(); }
        orders.forEach((order) => knownOrderIds.current.add(order.id));
        waitingIds.current = waiting;
        setPendingOrders(waiting.size);
        first = false;
      }).catch(() => undefined);
    };
    check();
    const timer = window.setInterval(check, 5000);
    return () => window.clearInterval(timer);
  }, [account, client, localMode, play]);

  useEffect(() => {
    const enableAudio = (): void => { void unlock(); };
    window.addEventListener("pointerdown", enableAudio, { once: true });
    window.addEventListener("keydown", enableAudio, { once: true });
    return () => { window.removeEventListener("pointerdown", enableAudio); window.removeEventListener("keydown", enableAudio); };
  }, [unlock]);

  const canUseMenu = account?.profile.role === "admin" || account?.modules.some((module) => module.id === "menu" && module.enabled) === true;

  async function signOut(): Promise<void> {
    if (localMode) { await fetch("/api/local-auth", { method: "DELETE" }); router.replace("/auth"); return; }
    if (!client) return;
    setBusy(true);
    const result = await client.auth.signOut();
    if (result.error) {
      setError("Belum berhasil keluar. Silakan coba lagi.");
    } else {
      setAccount(null);
      setAuthenticated(false);
      setError("");
    }
    setBusy(false);
  }

  const available = navigation.filter(
    (item) =>
      account?.profile.role === "admin" ||
      (item.id !== "modules" && account?.modules.some((module) => module.id === item.id && module.enabled)),
  );
  const selected = available.find((item) => item.id === active) ?? available[0];

  if (loading) {
    return (
      <main id="main-content" className="grid min-h-dvh place-items-center bg-charcoal-darkest px-6">
        <p role="status" className="text-sm text-offwhite-muted">Menyiapkan ruang kelola…</p>
      </main>
    );
  }

  if (!account) {
    return (
      <main className="grid min-h-dvh place-items-center bg-charcoal-darkest p-6">
        <div className="max-w-md text-center">
          <p className="text-sm text-offwhite-muted">
            {authenticated ? "Akun ini belum memiliki akses admin atau staf." : "Mengalihkan ke halaman masuk…"}
          </p>
          {authenticated && (
            <button className={`${adminSecondaryClass} mt-5`} onClick={() => void signOut()}>Keluar</button>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-charcoal-darkest lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="border-b border-charcoal-border bg-charcoal lg:flex lg:h-dvh lg:flex-col lg:sticky lg:top-0 lg:border-r lg:border-b-0">
        <Link
          href="/"
          className="flex items-center justify-between border-b border-charcoal-border/60 px-5 pt-6 pb-4 lg:block lg:px-6 lg:pt-7 lg:pb-5"
        >
          <span className="font-serif text-[1.65rem] leading-none tracking-tight text-offwhite transition-colors hover:text-terracotta-light">
            CafeSite<span className="text-terracotta-light">.</span>
          </span>
          <span className="hidden text-[9px] font-medium uppercase tracking-[0.24em] text-offwhite-darker lg:mt-2.5 lg:block">
            Ruang kelola
          </span>
        </Link>

        <nav aria-label="Modul dashboard" className="flex-1 overflow-y-auto px-3 py-3 lg:px-3.5 lg:py-4">
          {groups.map((group) => {
            const items = available.filter((item) => group.ids.includes(item.id));
            if (items.length === 0) return null;
            return (
              <div key={group.title} className="mb-4 lg:mb-5">
                <p className="hidden px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-offwhite-darker lg:block">
                  {group.title}
                </p>
                <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
                  {items.map((item) => {
                    const isSelected = selected?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { setActive(item.id); if (item.id === "orders") setNewOrderPulse(false); }}
                        aria-current={isSelected ? "page" : undefined}
                        className={`flex min-h-11 w-full shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                          isSelected
                            ? "bg-charcoal-light font-medium text-offwhite"
                            : "text-offwhite-muted hover:bg-charcoal-light/60 hover:text-offwhite"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta transition-opacity ${
                            isSelected ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.id === "orders" && pendingOrders > 0 && (
                          <span
                            aria-label={`${pendingOrders} pesanan menunggu`}
                            className={`min-w-6 shrink-0 rounded-full bg-terracotta px-1.5 py-0.5 text-center text-[10px] font-semibold text-offwhite-pure tabular-nums ${newOrderPulse && selected?.id !== "orders" ? "ring-2 ring-offwhite" : ""}`}
                          >
                            {pendingOrders}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="hidden border-t border-charcoal-border px-6 py-4 lg:mt-auto lg:block">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold capitalize text-offwhite">
              {account.profile.role === "admin" ? "Administrator" : "Tim kedai"}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={busy}
              className="min-h-11 shrink-0 text-xs text-offwhite-darker transition-colors hover:text-offwhite-muted disabled:opacity-50"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      <main id="main-content" className="min-w-0 px-4 py-6 md:px-8 md:py-8 xl:px-12">
        <header className="mb-6 border-b border-charcoal-border pb-6 md:mb-8 md:pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl">{selected?.label ?? "Ruang kelola"}</h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-offwhite-darker">
                {selected?.caption ?? "Minta admin mengaktifkan modul untuk akun staf."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                target="_blank"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-xl border border-charcoal-border px-4 text-xs text-offwhite-muted transition-colors hover:border-offwhite hover:text-offwhite"
              >
                Lihat website ↗
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={busy}
                className="min-h-11 text-xs text-offwhite-darker transition-colors hover:text-offwhite-muted lg:hidden disabled:opacity-50"
              >
                Keluar
              </button>
            </div>
          </div>
        </header>

        <AdminNotice message={error} error />
        {selected && (
          selected.id === "wa_bot" ? (
            <WaBotManager />
          ) : selected.id === "menu" ? (
            <MenuManager />
          ) : selected.id === "orders" ? (
            <OrderManager muted={muted} canManageMenu={canUseMenu} onToggleMuted={toggleMuted} />
          ) : selected.id === "tables" ? (
            <TableManager />
          ) : (
            <AdminManage module={selected.id} />
          )
        )}
      </main>
    </div>
  );
}
