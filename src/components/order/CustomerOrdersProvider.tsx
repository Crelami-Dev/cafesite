"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  playCafeSiteAlarm,
  stopCafeSiteVibration,
} from "@/lib/cafesite-alarm";
import {
  readOrderTokens,
  ORDER_REGISTRY_EVENT,
  orderRequest,
  queueLabel,
} from "@/lib/order-client";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { BellIcon, BellOffIcon, CloseIcon } from "@/components/ui/icons";
import type { Order, CustomerOrdersState, CartProviderProps } from "@/types";

const Context = createContext<CustomerOrdersState | null>(null);
const DISMISSED_PREFIX = "cafesite:ready-dismissed:";
const ALARM_INTERVAL_MS = 5400;

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

function hasStoredDismissal(orderId: string): boolean {
  try {
    return Boolean(localStorage.getItem(`${DISMISSED_PREFIX}${orderId}`));
  } catch {
    return false;
  }
}

export function CustomerOrdersProvider({
  children,
}: CartProviderProps): React.JSX.Element {
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  const tokens = useMemo(
    () => JSON.parse(raw) as Record<string, string>,
    [raw],
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Order[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(false);

  const cache = useRef<Order[]>([]);
  const busy = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const alive = useRef(true);
  const inaccessible = useRef(new Set<string>());
  const dismissed = useRef(new Set<string>());
  const notifiedBrowser = useRef(new Set<string>());

  const armAudio = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) return false;
      audio.current ??= new AudioCtor();
      if (audio.current.state === "suspended") {
        await audio.current.resume();
      }
      const isRunning = audio.current.state === "running";
      if (alive.current) setEnabled(isRunning);
      return isRunning;
    } catch {
      if (alive.current) setEnabled(false);
      return false;
    }
  }, []);

  // Silent auto-arm on first user interaction anywhere in the app
  useEffect(() => {
    const onGesture = (): void => {
      if (!audio.current || audio.current.state !== "running") {
        void armAudio();
      }
    };
    window.addEventListener("pointerdown", onGesture, { passive: true });
    window.addEventListener("keydown", onGesture, { passive: true });
    window.addEventListener("touchstart", onGesture, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };
  }, [armAudio]);

  const enable = useCallback(async (): Promise<void> => {
    setMuted(false);
    try {
      const running = await armAudio();
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "default"
      ) {
        void Notification.requestPermission().catch(() => {});
      }
      if (running) {
        playCafeSiteAlarm(audio.current, false);
      } else {
        setError(
          "Ketuk layar sekali lagi untuk mengaktifkan suara di browser ini.",
        );
      }
    } catch {
      setEnabled(false);
      setError(
        "Suara tidak tersedia di browser ini. Pemberitahuan visual tetap aktif.",
      );
    }
  }, [armAudio]);

  const dismissAlert = useCallback((orderId?: string): void => {
    stopCafeSiteVibration();
    setAlerts((current) => {
      const targets = orderId
        ? current.filter((item) => item.id === orderId)
        : current;
      for (const target of targets) {
        dismissed.current.add(target.id);
        try {
          localStorage.setItem(`${DISMISSED_PREFIX}${target.id}`, "1");
        } catch {
          /* Session fallback handles dismissal in-memory */
        }
      }
      return orderId ? current.filter((item) => item.id !== orderId) : [];
    });
  }, []);

  const toggleMute = useCallback((): void => {
    setMuted((prev) => {
      const next = !prev;
      if (next) {
        stopCafeSiteVibration();
      } else {
        void armAudio();
      }
      return next;
    });
  }, [armAudio]);

  const syncReadyAlerts = useCallback((loadedOrders: Order[]): void => {
    const activeReady = loadedOrders.filter((order) => {
      if (order.status !== "ready") return false;
      if (dismissed.current.has(order.id) || hasStoredDismissal(order.id)) {
        dismissed.current.add(order.id);
        return false;
      }
      return true;
    });

    setAlerts(activeReady);

    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      for (const order of activeReady) {
        if (notifiedBrowser.current.has(order.id)) continue;
        notifiedBrowser.current.add(order.id);
        try {
          new Notification(
            `CafeSite · Pesanan ${queueLabel(order.queue_number)} Siap!`,
            {
              body: "Silakan menuju kasir untuk mengambil pesananmu.",
              tag: `cafesite-ready-${order.id}`,
            },
          );
        } catch {
          /* Ignore restricted notification contexts */
        }
      }
    }
  }, []);

  // Continuous repeating alarm + long vibration + tab flash while ready alerts are active
  const alarmActive = alerts.length > 0 && !muted;

  useEffect(() => {
    if (!alarmActive) {
      stopCafeSiteVibration();
      return;
    }

    const triggerAlarm = async (): Promise<void> => {
      if (!alive.current) return;
      await armAudio();
      playCafeSiteAlarm(audio.current, true);
    };

    void triggerAlarm();
    const soundTimer = window.setInterval(() => {
      void triggerAlarm();
    }, ALARM_INTERVAL_MS);

    const originalTitle = document.title;
    const labels = alerts.map((o) => queueLabel(o.queue_number)).join(", ");
    let flashTick = false;
    const titleTimer = window.setInterval(() => {
      flashTick = !flashTick;
      document.title = flashTick
        ? `SIAP DIAMBIL: ${labels} — CafeSite`
        : originalTitle;
    }, 1100);

    return () => {
      window.clearInterval(soundTimer);
      window.clearInterval(titleTimer);
      document.title = originalTitle;
      stopCafeSiteVibration();
    };
  }, [alarmActive, alerts, armAudio]);

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
      if (!entries.length) {
        syncReadyAlerts(cache.current);
        return;
      }
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
        syncReadyAlerts(cache.current);
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
    [tokens, syncReadyAlerts],
  );

  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopCafeSiteVibration();
      void audio.current?.close();
      audio.current = null;
    };
  }, []);

  useEffect(() => {
    const run = (): void => {
      void load();
    };
    const first = window.setTimeout(run, 0);
    const timer = window.setInterval(run, 5000);
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
    for (const id of realtimeIds.split(",")) {
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
    }
    channel.subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [realtimeIds, load]);

  // Only float alerts for ready orders not currently open in front of the user
  const floatingAlerts = alerts.filter(
    (order) => pathname !== `/order/${order.id}`,
  );

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
        alerts,
        alarmActive,
        muted,
        toggleMute,
        dismissAlert,
      }}
    >
      {children}
      {floatingAlerts.length > 0 && (
        <aside
          className="fixed inset-x-3 bottom-4 z-[90] rounded-xl border border-terracotta bg-charcoal p-4 text-offwhite shadow-floating sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px]"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border ${
                  alarmActive
                    ? "animate-pulse border-terracotta bg-terracotta text-offwhite-pure"
                    : "border-offwhite/20 bg-charcoal-light text-offwhite"
                }`}
              >
                {muted ? (
                  <BellOffIcon className="size-4" />
                ) : (
                  <BellIcon className="size-4" />
                )}
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-terracotta-light">
                  {alarmActive ? "Alarm Aktif · Siap Diambil" : "Siap Diambil"}
                </p>
                <p className="mt-0.5 font-serif text-xl font-medium text-offwhite tabular-nums">
                  Antrean{" "}
                  {floatingAlerts
                    .map((order) => queueLabel(order.queue_number))
                    .join(", ")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-offwhite-muted">
                  Pesananmu sudah selesai diracik. Silakan menuju kasir sekarang.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissAlert()}
              aria-label="Matikan alarm"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-offwhite-muted transition hover:bg-charcoal-light hover:text-offwhite"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <Link
              href={`/order/${floatingAlerts[0].id}`}
              className="btn btn--primary min-h-10 px-4 py-2 text-xs"
            >
              Lihat pesanan
            </Link>
            <button
              type="button"
              onClick={() => dismissAlert()}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-offwhite/20 px-3.5 py-2 text-xs font-medium text-offwhite transition hover:border-offwhite/40 hover:bg-charcoal-light"
            >
              Saya ke kasir · Matikan
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
