"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WaBotStatus, WaState } from "@/types";
import { adminButtonClass, adminError, adminRequest, adminSecondaryClass } from "./admin-api";

type BotAction = "connect" | "restart" | "disconnect" | "logout";

const stateLabel: Record<WaState, { text: string; tone: "ok" | "warn" | "idle" | "bad" }> = {
  stopped: { text: "○ Belum terhubung", tone: "idle" },
  connecting: { text: "↻ Menyiapkan koneksi…", tone: "warn" },
  awaiting_qr: { text: "◷ Menunggu scan QR", tone: "warn" },
  connected: { text: "✓ Terhubung", tone: "ok" },
  reconnecting: { text: "↻ Menyambung ulang…", tone: "warn" },
  error: { text: "! Perlu perhatian", tone: "bad" },
};

const toneClass = {
  ok: "border border-offwhite bg-offwhite text-charcoal",
  warn: "border border-offwhite/20 bg-charcoal-light text-offwhite",
  idle: "border border-offwhite/15 bg-charcoal-light/60 text-offwhite-muted",
  bad: "border border-terracotta/50 bg-terracotta/15 text-terracotta-light",
} as const;

const steps = [
  "Buka WhatsApp di ponsel yang akan dijadikan nomor bot.",
  "Ketuk Setelan (atau menu ⋮) lalu Perangkat tertaut.",
  "Ketuk Tautkan perangkat, lalu arahkan kamera ke kode QR ini.",
];

async function toImage(qr: string): Promise<string> {
  if (qr.startsWith("data:image")) return qr;
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(qr, { margin: 2, width: 288, errorCorrectionLevel: "M" });
}

export default function WaConnectionPanel(): React.JSX.Element {
  const [bot, setBot] = useState<WaBotStatus | null>(null);
  const [offline, setOffline] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const lastQr = useRef<string | null>(null);

  const refresh = useCallback(async (manual = false): Promise<WaBotStatus | null> => {
    if (manual) setChecking(true);
    try {
      const next = await adminRequest<WaBotStatus>(manual ? "wabot/control?force=1" : "wabot/control");
      setBot(next);
      setOffline(next.serviceOffline ? (next.offlineReason ?? "Layanan bot WhatsApp sedang tidak dijalankan.") : "");
      if (next.qr !== lastQr.current) {
        lastQr.current = next.qr;
        setQrImage(next.qr ? await toImage(next.qr) : "");
      }
      return next;
    } catch (cause: unknown) {
      setOffline(adminError(cause));
      return null;
    } finally {
      if (manual) setChecking(false);
    }
  }, []);

  // Polling cepat selama proses pairing, santai saat stabil, dan hemat saat layanan dimatikan.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function loop(): Promise<void> {
      const next = await refresh();
      if (cancelled) return;
      const isOffline = !next || Boolean(next.serviceOffline);
      const fast = !isOffline && ["connecting", "awaiting_qr", "reconnecting"].includes(next.state);
      timer = setTimeout(() => void loop(), fast ? 1500 : isOffline ? 15000 : 5000);
    }
    void loop();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refresh]);

  async function run(action: BotAction): Promise<void> {
    if (action === "logout" && !window.confirm("Keluar dari WhatsApp ini? Sesi dihapus dan nomor harus dipasangkan ulang lewat QR.")) return;
    setBusy(true);
    setActionError("");
    try {
      setBot(await adminRequest<WaBotStatus>("wabot/control", { method: "POST", body: JSON.stringify({ action }) }));
      await refresh();
    } catch (cause: unknown) {
      setActionError(adminError(cause));
    } finally {
      setBusy(false);
    }
  }

  const isInitialLoading = bot === null && !offline;
  const isOffline = Boolean(offline);
  const state = bot?.state ?? "stopped";
  const label = stateLabel[state];
  const canConnect = !isInitialLoading && !isOffline && (state === "stopped" || state === "error");

  return (
    <section aria-labelledby="wa-connection-title" className="rounded-xl border border-offwhite/10 bg-charcoal p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="wa-connection-title" className="font-serif text-2xl">
            Koneksi WhatsApp
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-offwhite-muted">
            {isOffline
              ? "Layanan asisten WhatsApp sedang dimatikan. Pemesanan via website dan kasir tetap berjalan normal."
              : state === "connected"
                ? `Nomor bot ${bot?.phone ?? bot?.configuredPhone ?? "tertaut"} aktif membalas pelanggan.`
                : "Hubungkan nomor WhatsApp yang akan dipakai sebagai asisten kedai."}
          </p>
        </div>
        <span
          role="status"
          aria-live="polite"
          className={`inline-flex min-h-8 shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${
            toneClass[isInitialLoading || isOffline ? "idle" : label.tone]
          }`}
        >
          {isInitialLoading ? "Memeriksa…" : isOffline ? "○ Layanan nonaktif" : label.text}
        </span>
      </div>

      {isOffline && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-offwhite/10 bg-charcoal-light/35 px-4 py-3.5 text-sm">
          <div className="min-w-0 space-y-1">
            <p className="text-offwhite-muted">
              Untuk menyalakan asisten WhatsApp, jalankan service bot di terminal:
            </p>
            <code className="inline-block rounded-lg border border-offwhite/10 bg-charcoal-darkest px-2.5 py-1 font-mono text-xs text-offwhite">
              cd server &amp;&amp; npm run dev
            </code>
          </div>
          <button
            type="button"
            disabled={checking || busy}
            className={`${adminSecondaryClass} shrink-0`}
            onClick={() => void refresh(true)}
          >
            {checking ? "Memeriksa…" : "Periksa status"}
          </button>
        </div>
      )}

      {!isOffline && state === "awaiting_qr" && (
        <div className="mt-5 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
          <div className="grid h-[304px] w-[304px] max-w-full place-items-center rounded-xl bg-offwhite p-2">
            {qrImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL dinamis, tidak cocok untuk next/image
              <img src={qrImage} width={288} height={288} alt="Kode QR untuk menautkan WhatsApp bot" className="h-auto max-w-full" />
            ) : (
              <p className="text-sm text-charcoal">Membuat QR…</p>
            )}
          </div>
          <div>
            <h3 className="font-medium text-offwhite-muted">Cara menautkan</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-offwhite-muted">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-offwhite-darker">
              QR berganti otomatis tiap beberapa detik; halaman ini memperbaruinya sendiri. Jangan bagikan QR ke siapa pun.
            </p>
          </div>
        </div>
      )}

      {!isOffline && state === "connecting" && (
        <p className="mt-4 text-sm text-offwhite-muted">
          Menyalakan WhatsApp Web di server. Pertama kali bisa memakan waktu hingga satu menit…
        </p>
      )}
      {!isOffline && state === "reconnecting" && (
        <p className="mt-4 text-sm text-offwhite-muted">
          Koneksi terputus; bot mencoba menyambung lagi otomatis. Kalau terus gagal, tekan Sambung ulang.
        </p>
      )}
      {bot?.error && !isOffline && (
        <p role="alert" className="mt-4 break-words text-sm text-terracotta-light">
          {bot.error}
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-4 break-words text-sm text-terracotta-light">
          {actionError}
        </p>
      )}

      {!isInitialLoading && !isOffline && (
        <div className="mt-5 flex flex-wrap gap-2">
          {canConnect && (
            <button disabled={busy} className={adminButtonClass} onClick={() => void run("connect")}>
              {busy ? "Memproses…" : "Hubungkan WhatsApp"}
            </button>
          )}
          {(state === "connecting" || state === "awaiting_qr") && (
            <button disabled={busy} className={adminSecondaryClass} onClick={() => void run("disconnect")}>
              Batalkan
            </button>
          )}
          {(state === "connected" || state === "reconnecting") && (
            <button disabled={busy} className={adminSecondaryClass} onClick={() => void run("restart")}>
              Sambung ulang
            </button>
          )}
          {state === "connected" && (
            <button disabled={busy} className={adminSecondaryClass} onClick={() => void run("disconnect")}>
              Putuskan sementara
            </button>
          )}
          {state !== "stopped" && state !== "connecting" && (
            <button disabled={busy} className={adminSecondaryClass} onClick={() => void run("logout")}>
              Keluar &amp; ganti nomor
            </button>
          )}
        </div>
      )}

      {bot && !isOffline && (
        <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-offwhite/10 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-offwhite-darker">Terhubung terakhir</dt>
            <dd className="tabular-nums">{bot.lastConnectedAt ? new Date(bot.lastConnectedAt).toLocaleString("id-ID") : "—"}</dd>
          </div>
          <div>
            <dt className="text-offwhite-darker">Pesan diproses</dt>
            <dd className="tabular-nums">{bot.messagesHandled ?? 0}</dd>
          </div>
          <div>
            <dt className="text-offwhite-darker">Jawaban AI</dt>
            <dd>{bot.ai ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-offwhite-darker">Pencarian dokumen</dt>
            <dd>{bot.embedding ?? "—"}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
