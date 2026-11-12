"use client";
import { useCallback, useEffect, useState } from "react";
import { OrderGate } from "./OrderGate";
import { OrderMenu } from "./OrderMenu";
import { parseScan } from "@/lib/order-scan";
import type { OrderStartProps, ScanGrant } from "@/types";

const pending = new Map<string, Promise<ScanGrant>>();
function claim(meja: string, k: string): Promise<ScanGrant> {
  const key = `${meja}:${k}`;
  let request = pending.get(key);
  if (!request) {
    request = fetch("/api/order-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meja, k }),
    })
      .then(async (response) => {
        const value = (await response.json()) as ScanGrant & { error?: string };
        if (!response.ok)
          throw new Error(value.error || "QR belum dapat diperiksa.");
        return value;
      })
      .finally(() => pending.delete(key));
    pending.set(key, request);
  }
  return request;
}
export function OrderStart({
  menu,
  meja,
  k,
}: OrderStartProps): React.JSX.Element {
  const [grant, setGrant] = useState<ScanGrant | null>(null);
  const [message, setMessage] = useState("");
  const accept = useCallback(async (raw: string): Promise<void> => {
    const value = parseScan(raw);
    if (!value)
      throw new Error("QR pemesanan tidak valid atau belum memiliki kunci.");
    const next = await claim(value.meja, value.k);
    setGrant(next);
    setMessage("");
    window.history.replaceState(null, "", "/order");
  }, []);
  useEffect(() => {
    let live = true;
    try {
      sessionStorage.removeItem("cafesite:table-scan");
    } catch {
      /* optional legacy storage */
    }
    // A cached Next.js page can retain old props after replaceState. Only a QR
    // actually present in the address bar may initiate a new grant.
    const current = new URLSearchParams(window.location.search);
    if (meja && k && current.get("meja") === meja && current.get("k") === k) {
      void claim(meja, k)
        .then((next) => {
          if (live) {
            setGrant(next);
            window.history.replaceState(null, "", "/order");
          }
        })
        .catch((error: unknown) => {
          if (live)
            setMessage(
              error instanceof Error ? error.message : "Scan QR lagi.",
            );
        });
    }
    return () => {
      live = false;
    };
  }, [meja, k]);
  return grant ? (
    <OrderMenu initialMenu={menu} table={grant.source} scanGrant={grant} />
  ) : (
    <OrderGate
      invalid={Boolean(meja && !k)}
      onScan={accept}
      message={message}
    />
  );
}
