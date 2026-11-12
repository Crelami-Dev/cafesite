"use client";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  readOrderTokens,
  ORDER_REGISTRY_EVENT,
  orderRequest,
  queueLabel,
} from "@/lib/order-client";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Order, CustomerOrdersState, CartProviderProps } from "@/types";

const Context = createContext<CustomerOrdersState | null>(null);
function subscribe(fn: () => void): () => void {
  window.addEventListener("storage", fn);
  window.addEventListener(ORDER_REGISTRY_EVENT, fn);
  return () => {
    window.removeEventListener("storage", fn);
    window.removeEventListener(ORDER_REGISTRY_EVENT, fn);
  };
}
const snapshot = (): string => JSON.stringify(readOrderTokens());
const terminal = (order: Order): boolean =>
  ["completed", "cancelled"].includes(order.status);
export function CustomerOrdersProvider({
  children,
}: CartProviderProps): React.JSX.Element {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  const tokens = useMemo(
    () => JSON.parse(raw) as Record<string, string>,
    [raw],
  );
  const [orders, setOrders] = useState<Order[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState<string[]>([]),
    [alerts, setAlerts] = useState<Order[]>([]),
    [enabled, setEnabled] = useState(false);
  const cache = useRef<Order[]>([]),
    busy = useRef(false),
    audio = useRef<AudioContext | null>(null),
    alive = useRef(true);
  const inaccessible = useRef(new Set<string>());
  const notified = useRef(new Set<string>());
  const sound = useCallback((): void => {
    const ctx = audio.current;
    if (!ctx || ctx.state !== "running") return;
    for (let i = 0; i < 3; i++) {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain(),
        start = ctx.currentTime + i * 0.22;
      oscillator.frequency.value = i === 1 ? 880 : 660;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    }
    navigator.vibrate?.([180, 100, 180]);
  }, []);
  const enable = useCallback(async (): Promise<void> => {
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      setEnabled(audio.current.state === "running");
      sound();
    } catch {
      setEnabled(false);
      setError(
        "Suara tidak tersedia di browser ini. Pemberitahuan visual tetap aktif.",
      );
    }
  }, [sound]);
  const notify = useCallback(
    async (order: Order): Promise<void> => {
      const deliver = (): void => {
        if (!alive.current || document.hidden) return;
        if (notified.current.has(order.id)) return;
        const key = `cafesite:ready-notified:${order.id}`;
        try {
          if (localStorage.getItem(key)) return;
          localStorage.setItem(key, "1");
        } catch {
          /* This tab still shows the alert. */
        }
        notified.current.add(order.id);
        setAlerts((current) =>
          current.some((value) => value.id === order.id)
            ? current
            : [...current, order],
        );
        try { sound(); } catch { setEnabled(false); }
      };
      if (navigator.locks) {
        try { await navigator.locks.request("cafesite-customer-alert", deliver); }
        catch { deliver(); }
      } else deliver();
    },
    [sound],
  );
  const load = useCallback(
    async (all = false): Promise<void> => {
      if (busy.current || document.hidden) return;
      const known = new Map(cache.current.map((order) => [order.id, order]));
      if (all) inaccessible.current.clear();
      const entries = Object.entries(tokens).filter(
        ([id]) =>
          !inaccessible.current.has(id) &&
          (all || !known.has(id) || !terminal(known.get(id)!)),
      );
      if (!entries.length) return;
      busy.current = true;
      setLoading(true);
      try {
        const next = new Map(
          cache.current
            .filter((order) => tokens[order.id])
            .map((order) => [order.id, order]),
        );
        const missing: string[] = [];
        for (let i = 0; i < entries.length; i += 20) {
          const result = await orderRequest<{
            orders: Order[];
            unavailable: string[];
          }>("/api/orders/lookup", {
            method: "POST",
            body: JSON.stringify({
              orders: entries
                .slice(i, i + 20)
                .map(([id, token]) => ({ id, token })),
            }),
          });
          for (const order of result.orders) {
            next.set(order.id, order);
            if (order.status === "ready") await notify(order);
          }
          for (const id of result.unavailable) {
            next.delete(id);
            missing.push(id);
            inaccessible.current.add(id);
          }
        }
        if (!alive.current) return;
        cache.current = [...next.values()].sort(
          (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
        );
        setOrders(cache.current);
        setUnavailable([...new Set([...inaccessible.current, ...missing])]);
        setError("");
      } catch (cause) {
        if (alive.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Status belum dapat diperbarui.",
          );
      } finally {
        busy.current = false;
        if (alive.current) setLoading(false);
      }
    },
    [tokens, notify],
  );
  const refresh = useCallback(() => load(true), [load]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      void audio.current?.close();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    const run = (): void => {
      void load();
    };
    const first = window.setTimeout(run, 0),
      timer = window.setInterval(run, 5000);
    document.addEventListener("visibilitychange", run);
    window.addEventListener("online", run);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
      window.removeEventListener("online", run);
    };
  }, [load]);
  const realtimeIds = Object.keys(tokens)
    .filter((id) => !orders.some((order) => order.id === id && terminal(order)))
    .join(",");
  useEffect(() => {
    const client = getBrowserSupabase();
    if (!client || !realtimeIds) return;
    // Realtime is a hint only: every response is read through the token-protected API.
    let channel = client.channel("customer-owned-orders");
    for (const id of realtimeIds.split(","))
      channel = channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        () => {
          void load();
        },
      );
    channel.subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [realtimeIds, load]);
  return (
    <Context.Provider
      value={{
        orders,
        hasOrders: Object.keys(tokens).length > 0,
        loading,
        error,
        unavailable,
        refresh,
        enabled,
        enable,
      }}
    >
      {children}
      {alerts.length > 0 && (
        <aside
          className="fixed inset-x-4 top-28 z-[90] ml-auto max-w-md rounded-xl border border-terracotta-light bg-charcoal p-5 text-offwhite shadow-floating"
          role="status"
          aria-live="polite"
        >
          <p className="font-serif text-2xl">Pesanan siap diambil</p>
          <p className="mt-2 text-sm">
            {alerts.map((order) => queueLabel(order.queue_number)).join(", ")} ·
            Silakan menuju kasir.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/order/${alerts[0].id}`}
              className="btn btn--primary"
              onClick={() => setAlerts([])}
            >
              Lihat pesanan
            </Link>
            <button
              className="min-h-11 px-3 text-sm"
              type="button"
              onClick={() => setAlerts([])}
            >
              Mengerti
            </button>
          </div>
        </aside>
      )}
    </Context.Provider>
  );
}
export function useCustomerOrders(): CustomerOrdersState {
  const value = useContext(Context);
  if (!value) throw new Error("CustomerOrdersProvider diperlukan.");
  return value;
}
