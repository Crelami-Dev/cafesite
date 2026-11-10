"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { WaBotStatus, WaState } from "@/types";
import { adminButtonClass, adminError, adminRequest, adminSecondaryClass } from "./admin-api";

type BotAction = "connect" | "restart" | "disconnect" | "logout";

const stateLabel: Record<WaState, { text: string; tone: "ok" | "warn" | "idle" | "bad" }> = {
  stopped: { text: "Belum terhubung", tone: "idle" },
  connecting: { text: "Menyiapkan koneksi…", tone: "warn" },
  awaiting_qr: { text: "Menunggu scan QR", tone: "warn" },
  connected: { text: "Terhubung", tone: "ok" },
  reconnecting: { text: "Menyambung ulang…", tone: "warn" },
  error: { text: "Gagal terhubung", tone: "bad" },
};
const toneClass = { ok: "bg-latte text-charcoal", warn: "bg-charcoal-light text-latte", idle: "bg-charcoal-light text-offwhite-muted", bad: "bg-terracotta text-offwhite-pure" } as const;
const steps = ["Buka WhatsApp di ponsel yang akan dijadikan nomor bot.", "Ketuk Setelan (atau menu ⋮) lalu Perangkat tertaut.", "Ketuk Tautkan perangkat, lalu arahkan kamera ke kode QR ini."];

async function toImage(qr: string): Promise<string> {
  return qr.startsWith("data:image") ? qr : QRCode.toDataURL(qr, { margin: 2, width: 288, errorCorrectionLevel: "M" });
}

export default function WaConnectionPanel(): React.JSX.Element {
  const [bot, setBot] = useState<WaBotStatus | null>(null);
  const [offline, setOffline] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const lastQr = useRef<string | null>(null);

  const refresh = useCallback(async (): Promise<WaBotStatus | null> => {
    try {
      const next = await adminRequest<WaBotStatus>("wabot/control");
      setBot(next);
      setOffline("");
      if (next.qr !== lastQr.current) {
        lastQr.current = next.qr;
        setQrImage(next.qr ? await toImage(next.qr) : "");
      }
      return next;
    } catch (cause: unknown) {
      setOffline(adminError(cause));
      return null;
    }
  }, []);

  // Polling cepat selama proses pairing, santai saat stabil.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function loop(): Promise<void> {
      const next = await refresh();
      if (cancelled) return;
      const fast = next !== null && ["connecting", "awaiting_qr", "reconnecting"].includes(next.state);
      timer = setTimeout(() => void loop(), fast ? 1500 : 5000);
    }
    void loop();
    return () => { cancelled = true; clearTimeout(timer); };
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
    } finally { setBusy(false); }
  }

  const state = bot?.state ?? "stopped";
  const label = stateLabel[state];
  const canConnect = state === "stopped" || state === "error";

  return (
    <section aria-labelledby="wa-connection-title" className="rounded-2xl border border-charcoal-border bg-charcoal p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="wa-connection-title" className="font-serif text-2xl">Koneksi WhatsApp</h2>
          <p className="mt-2 text-sm text-offwhite-muted">
            {state === "connected" ? `Nomor bot ${bot?.phone ?? bot?.configuredPhone ?? "tertaut"} aktif membalas pelanggan.` : "Hubungkan nomor WhatsApp yang akan dipakai sebagai bot kedai."}
          </p>
        </div>
        <span role="status" aria-live="polite" className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-sm font-medium ${toneClass[offline ? "bad" : label.tone]}`}>
          {offline ? "Server bot mati" : label.text}
        </span>
      </div>

      {offline && (
        <div role="alert" className="mt-4 rounded-xl border border-terracotta p-4 text-sm">
          <p className="break-words text-terracotta-light">{offline}</p>
          <p className="mt-2 text-offwhite-muted">Di terminal: <code className="rounded bg-charcoal-darkest px-1.5 py-0.5">cd server &amp;&amp; npm run dev</code></p>
        </div>
      )}

      {!offline && state === "awaiting_qr" && (
        <div className="mt-5 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
          <div className="grid h-[304px] w-[304px] max-w-full place-items-center rounded-xl bg-offwhite p-2">
            {qrImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL dinamis, tidak cocok untuk next/image
              <img src={qrImage} width={288} height={288} alt="Kode QR untuk menautkan WhatsApp bot" className="h-auto max-w-full" />
            ) : <p className="text-sm text-charcoal">Membuat QR…</p>}
          </div>
          <div>
            <h3 className="font-medium text-latte">Cara menautkan</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-offwhite-muted">{steps.map((step) => <li key={step}>{step}</li>)}</ol>
            <p className="mt-4 text-xs text-offwhite-darker">QR berganti otomatis tiap beberapa detik; halaman ini memperbaruinya sendiri. Jangan bagikan QR ke siapa pun.</p>
          </div>
        </div>
      )}

      {!offline && state === "connecting" && <p className="mt-4 text-sm text-offwhite-muted">Menyalakan WhatsApp Web di server. Pertama kali bisa memakan waktu hingga satu menit…</p>}
      {!offline && state === "reconnecting" && <p className="mt-4 text-sm text-offwhite-muted">Koneksi terputus; bot mencoba menyambung lagi otomatis. Kalau terus gagal, tekan Sambung ulang.</p>}
      {bot?.error && !offline && <p role="alert" className="mt-4 break-words text-sm text-terracotta-light">{bot.error}</p>}
      {actionError && <p role="alert" className="mt-4 break-words text-sm text-terracotta-light">{actionError}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {canConnect && <button disabled={busy || Boolean(offline)} className={adminButtonClass} onClick={() => void run("connect")}>{busy ? "Memproses…" : "Hubungkan WhatsApp"}</button>}
        {(state === "connecting" || state === "awaiting_qr") && <button disabled={busy} className={adminSecondaryClass} onClick={() => void run("disconnect")}>Batalkan</button>}
        {(state === "connected" || state === "reconnecting") && <button disabled={busy} className={adminSecondaryClass} onClick={() => void run("restart")}>Sambung ulang</button>}
        {state === "connected" && <button disabled={busy} className={adminSecondaryClass} onClick={() => void run("disconnect")}>Putuskan sementara</button>}
        {!offline && state !== "stopped" && state !== "connecting" && <button disabled={busy} className={adminSecondaryClass} onClick={() => void run("logout")}>Keluar &amp; ganti nomor</button>}
      </div>

      {bot && !offline && (
        <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-charcoal-border pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-offwhite-darker">Terhubung terakhir</dt><dd>{bot.lastConnectedAt ? new Date(bot.lastConnectedAt).toLocaleString("id-ID") : "—"}</dd></div>
          <div><dt className="text-offwhite-darker">Pesan diproses</dt><dd>{bot.messagesHandled ?? 0}</dd></div>
          <div><dt className="text-offwhite-darker">Jawaban AI</dt><dd>{bot.ai ?? "—"}</dd></div>
          <div><dt className="text-offwhite-darker">Pencarian dokumen</dt><dd>{bot.embedding ?? "—"}</dd></div>
        </dl>
      )}
    </section>
  );
}
