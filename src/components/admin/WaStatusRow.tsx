"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { WaBotStatus, WaState } from "@/types";
import { ChatIcon, ChevronRightIcon } from "@/components/ui/icons";
import { adminRequest } from "./admin-api";
import StatusBadge, { type StatusTone } from "./ui/StatusBadge";

const LABEL: Record<WaState, { text: string; tone: StatusTone }> = {
  stopped: { text: "Belum terhubung", tone: "muted" },
  connecting: { text: "Menyiapkan", tone: "active" },
  awaiting_qr: { text: "Scan QR", tone: "attention" },
  connected: { text: "Terhubung", tone: "done" },
  reconnecting: { text: "Menyambung", tone: "active" },
  error: { text: "Perlu perhatian", tone: "error" },
};

/** Satu baris status WhatsApp bot untuk Ringkasan; detailnya ada di halaman WA Bot. */
export default function WaStatusRow(): React.JSX.Element {
  const [bot, setBot] = useState<WaBotStatus | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    adminRequest<WaBotStatus>("wabot/control")
      .then((r) => {
        if (live) setBot(r);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const view = failed || bot?.serviceOffline ? { text: "Layanan mati", tone: "error" as const } : bot ? LABEL[bot.state] : null;

  return (
    <Link
      href="/dashboard/wa-bot"
      className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-offwhite/10 bg-charcoal-light px-4 transition hover:-translate-y-0.5"
    >
      <span className="flex items-center gap-3">
        <ChatIcon className="size-5 text-offwhite-muted" />
        <span className="text-sm font-medium">WhatsApp Bot</span>
      </span>
      <span className="flex items-center gap-2">
        {view ? <StatusBadge tone={view.tone}>{view.text}</StatusBadge> : <span className="text-xs text-offwhite-darker">Memeriksa…</span>}
        <ChevronRightIcon className="size-4 text-offwhite-darker" />
      </span>
    </Link>
  );
}
