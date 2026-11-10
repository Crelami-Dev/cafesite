import { execSync } from "node:child_process";
import type { BotEnv } from "../config/env";
import { logger, describeError } from "./logger";
import { allowOpenWaWithoutZstd } from "./openwaShim";

export interface IncomingWaMessage { id: string; from: string; body: string; fromMe: boolean; isGroupMsg: boolean }

export type WaState = "stopped" | "connecting" | "awaiting_qr" | "connected" | "reconnecting" | "error";

export interface WaStatus {
  state: WaState;
  lastConnectedAt: string | null;
  /** Teks QR mentah (render di dashboard). Hanya ada saat state = awaiting_qr. */
  qr: string | null;
  error: string | null;
  /** Nomor yang tertaut (disamarkan), diisi setelah tersambung. */
  phone: string | null;
}

export interface WaRuntime {
  /** Mulai koneksi di latar belakang; langsung kembali (QR muncul lewat status). */
  start(): Promise<void>;
  /** Putuskan sambungan tetapi simpan sesi (tidak perlu scan ulang). */
  stop(): Promise<void>;
  reconnect(): Promise<void>;
  /** Hapus sesi tersimpan: perangkat tertaut harus dipasangkan ulang lewat QR. */
  logout(): Promise<void>;
  sendText(chatId: string, text: string): Promise<void>;
  status(): WaStatus;
}

/** Lapisan tipis di atas library WhatsApp supaya runtime bisa diuji dengan driver palsu. */
export interface WaSession {
  onMessage(handler: (message: IncomingWaMessage) => void): void;
  sendText(chatId: string, text: string): Promise<void>;
  hostNumber(): Promise<string | null>;
  stop(reason: string): Promise<void>;
}

export interface WaDriver {
  /** Resolve setelah pairing selesai dan sesi siap kirim/terima. `hooks` dipanggil selama proses. */
  connect(hooks: { onQr(qr: string): void; onDisconnected(): void }): Promise<WaSession>;
  /** Hentikan paksa koneksi yang sedang dibuka (mis. menunggu QR) beserta browser-nya. Aman dipanggil kapan saja. */
  cancel?(): Promise<void>;
  /** Hapus data sesi tersimpan di disk. */
  clearSession(): Promise<void>;
}

const RETRY_BASE_MS = 5_000;
const RETRY_MAX_MS = 5 * 60_000;

function maskPhone(phone: string): string {
  return phone.length > 7 ? `${phone.slice(0, 4)}••••${phone.slice(-3)}` : "••••";
}

export function createRuntime(driver: WaDriver, onMessage: (message: IncomingWaMessage) => void | Promise<void>): WaRuntime {
  let session: WaSession | null = null;
  let generation = 0; // naik tiap start/stop supaya koneksi basi bisa dibuang
  let retryTimer: NodeJS.Timeout | null = null;
  let attempts = 0;
  const current: WaStatus = { state: "stopped", lastConnectedAt: null, qr: null, error: null, phone: null };

  function clearRetry(): void { if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; } }

  function scheduleRetry(myGeneration: number): void {
    clearRetry();
    const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** attempts);
    attempts += 1;
    current.state = "reconnecting";
    logger.warn("WhatsApp terputus; mencoba menyambung ulang.", { inMs: delay });
    retryTimer = setTimeout(() => { if (myGeneration === generation) void connect(); }, delay);
    retryTimer.unref();
  }

  async function connect(): Promise<void> {
    const myGeneration = ++generation;
    clearRetry();
    current.state = "connecting";
    current.error = null;
    current.qr = null;
    try {
      const next = await driver.connect({
        onQr: (qr) => { if (myGeneration === generation) { current.qr = qr; current.state = "awaiting_qr"; } },
        onDisconnected: () => {
          if (myGeneration !== generation || current.state === "stopped") return;
          session = null;
          current.phone = null;
          scheduleRetry(myGeneration);
        },
      });
      if (myGeneration !== generation) { await next.stop("dibatalkan").catch(() => undefined); return; }
      session = next;
      attempts = 0;
      next.onMessage((message) => {
        if (myGeneration !== generation) return;
        void Promise.resolve(onMessage(message)).catch((cause: unknown) => logger.error("Pesan masuk gagal diproses.", { error: describeError(cause) }));
      });
      current.state = "connected";
      current.qr = null;
      current.lastConnectedAt = new Date().toISOString();
      current.phone = await next.hostNumber().then((number) => (number ? maskPhone(number.replace(/@.*/, "")) : null)).catch(() => null);
      logger.info("WhatsApp tersambung.");
    } catch (cause: unknown) {
      if (myGeneration !== generation) return;
      current.error = describeError(cause).split("\n")[0] ?? "Gagal menyambung.";
      current.state = "error";
      current.qr = null;
      logger.error("Koneksi WhatsApp gagal.", { error: describeError(cause) });
      scheduleRetry(myGeneration);
      current.state = "error";
    }
  }

  async function stop(): Promise<void> {
    generation += 1;
    clearRetry();
    attempts = 0;
    const closing = session;
    session = null;
    current.state = "stopped";
    current.qr = null;
    current.error = null;
    current.phone = null;
    if (closing) await closing.stop("diminta dashboard").catch((cause: unknown) => logger.warn("Gagal menutup sesi WhatsApp.", { error: describeError(cause) }));
    // create() tidak bisa dibatalkan dari luar; tanpa ini Chromium menggantung saat "Batalkan" ditekan menunggu QR.
    await driver.cancel?.().catch((cause: unknown) => logger.warn("Gagal membatalkan koneksi.", { error: describeError(cause) }));
  }

  return {
    async start() {
      if (current.state === "connecting" || current.state === "awaiting_qr" || current.state === "connected") return;
      void connect();
    },
    stop,
    async reconnect() { await stop(); void connect(); },
    async logout() { await stop(); await driver.clearSession(); },
    async sendText(chatId, text) {
      if (!session || current.state !== "connected") throw new Error("WhatsApp belum tersambung.");
      await session.sendText(chatId, text);
    },
    status: () => ({ ...current }),
  };
}

/** Driver nyata berbasis @open-wa/wa-automate. Diimpor dinamis agar test tidak memuat Chromium. */
function killProcessTree(pid: number): void {
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    else process.kill(pid, "SIGKILL");
  } catch { /* proses sudah mati */ }
}

/**
 * Browser yang dibuka OpenWA adalah anak proses bot ini. Event pid dari library tidak selalu terisi, jadi
 * sebagai pengaman semua anak proses berjenis browser milik proses ini dimatikan (bot tidak membuka browser lain).
 */
function ownBrowserPids(): number[] {
  try {
    const out = process.platform === "win32"
      ? execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"ParentProcessId=${process.pid}\\" | Where-Object { $_.Name -match 'chrome|chromium|msedge' } | ForEach-Object { $_.ProcessId }"`, { encoding: "utf8" })
      : execSync(`pgrep -P ${process.pid} -f "chrom"`, { encoding: "utf8" });
    return out.split(/\s+/).map(Number).filter((value) => Number.isInteger(value) && value > 0);
  } catch { return []; }
}

function killOwnBrowsers(): void {
  for (const pid of ownBrowserPids()) killProcessTree(pid);
}

function isChromeProcess(pid: number): boolean {
  try {
    const out = process.platform === "win32" ? execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: "utf8" }) : execSync(`ps -p ${pid} -o comm=`, { encoding: "utf8" });
    return /chrome|chromium|msedge/i.test(out);
  } catch { return false; }
}

const SESSION_GOOD_BYTES = 2_000;

async function sessionPaths(env: BotEnv): Promise<{ data: string; backup: string; pids: string }> {
  const path = await import("node:path");
  const dir = path.resolve(env.waSessionDir);
  return { data: path.join(dir, `${env.waSessionId}.data.json`), backup: path.join(dir, `${env.waSessionId}.data.json.bak`), pids: path.join(dir, "browser.pids") };
}

/**
 * Pengaman login (OpenWA menyimpan sesi di satu berkas JSON yang bisa terkikis bila bot dimatikan paksa):
 * 1) Chrome sisa dari proses bot sebelumnya dimatikan (bila masih hidup ia memegang sesi WhatsApp);
 * 2) berkas sesi yang kosong/rusak dipulihkan dari cadangan terakhir yang baik.
 */
export async function guardSession(env: BotEnv): Promise<void> {
  const { readFile, writeFile, stat, copyFile, rm } = await import("node:fs/promises");
  const paths = await sessionPaths(env);
  for (const pid of (await readFile(paths.pids, "utf8").catch(() => "")).split(/\s+/).map(Number).filter((value) => value > 0)) {
    if (isChromeProcess(pid)) { killProcessTree(pid); logger.warn("Chrome sisa dari proses bot sebelumnya dimatikan.", { pid }); }
  }
  await rm(paths.pids, { force: true });
  const size = async (file: string): Promise<number> => (await stat(file).catch(() => null))?.size ?? 0;
  if ((await size(paths.data)) < SESSION_GOOD_BYTES && (await size(paths.backup)) >= SESSION_GOOD_BYTES) {
    await copyFile(paths.backup, paths.data);
    logger.warn("Berkas sesi WhatsApp kosong; dipulihkan dari cadangan terakhir.");
  }
  void writeFile; // (writeFile dipakai di rememberBrowsers)
}

/** Simpan cadangan sesi hanya bila isinya sehat, dan catat PID Chrome milik bot ini untuk dibersihkan saat start berikutnya. */
export async function snapshotSession(env: BotEnv): Promise<void> {
  const { copyFile, stat, writeFile } = await import("node:fs/promises");
  const paths = await sessionPaths(env);
  if (((await stat(paths.data).catch(() => null))?.size ?? 0) >= SESSION_GOOD_BYTES) await copyFile(paths.data, paths.backup).catch(() => undefined);
  await writeFile(paths.pids, ownBrowserPids().join("\n")).catch(() => undefined);
}

export function createOpenWaDriver(env: BotEnv): WaDriver {
  let browserPid: number | null = null;
  return {
    async cancel() {
      if (browserPid !== null) killProcessTree(browserPid);
      browserPid = null;
      killOwnBrowsers();
    },
    async connect(hooks) {
      allowOpenWaWithoutZstd();
      const { create, ev } = await import("@open-wa/wa-automate");
      let startedWithSessionBytes = 0;
      const onQr = (event: { details?: { qr?: string } }): void => {
        const qr = event.details?.qr;
        if (!qr) return;
        if (startedWithSessionBytes >= SESSION_GOOD_BYTES) logger.warn("WhatsApp meminta scan QR padahal ada sesi tersimpan: sesi ditolak/kedaluwarsa di sisi WhatsApp (mis. perangkat tertaut dihapus, atau ada bot lain memakai sesi yang sama).", { sessionBytes: startedWithSessionBytes });
        else logger.info("Belum ada sesi tersimpan; scan QR untuk pertama kali.");
        hooks.onQr(qr);
      };
      const onGone = (): void => hooks.onDisconnected();
      const onBrowser = (event: { details?: { pid?: number } }): void => { browserPid = event.details?.pid ?? browserPid; };
      const onBrowserUp = (event: { details?: { pid?: number } }): void => { onBrowser(event); setTimeout(() => void snapshotSession(env), 1500); };
      ev.on("launch.browser.init.after", onBrowserUp);
      ev.on("launch.auth.qr.generated", onQr);
      ev.on("session.connection.disconnected", onGone);
      ev.on("session.logout", onGone);
      try {
        await guardSession(env);
        startedWithSessionBytes = (await (await import("node:fs/promises")).stat((await sessionPaths(env)).data).catch(() => null))?.size ?? 0;
        if (startedWithSessionBytes >= SESSION_GOOD_BYTES) logger.info("Sesi tersimpan ditemukan, mencoba melanjutkan tanpa QR.", { sessionBytes: startedWithSessionBytes });
        // Peringatan OpenWA (mis. "portable_session_bootstrap_failed", "session_reset_for_pairing") menjelaskan KENAPA login hilang; simpan ke console dan berkas.
        const { resolve: resolvePath } = await import("node:path");
        const client = await create({
          sessionId: env.waSessionId, headless: true, qrTimeout: 0, authTimeout: 0, sessionDataPath: env.waSessionDir,
          logging: [{ type: "console", level: "warn" }, { type: "file", level: "warn", filename: resolvePath(env.waSessionDir, "openwa-warnings.log") }],
        });
        await snapshotSession(env);
        const backupTimer = setInterval(() => void snapshotSession(env), 5 * 60_000);
        backupTimer.unref();
        return {
          onMessage(handler) {
            client.onMessage((message) => {
              const raw = message as unknown as { id: string; from: string; body?: string; self?: string; fromMe?: boolean; isGroupMsg?: boolean; broadcast?: boolean };
              handler({
                id: String(raw.id),
                from: String(raw.from),
                body: raw.body ?? "",
                fromMe: raw.fromMe === true || raw.self === "out",
                isGroupMsg: raw.isGroupMsg === true || String(raw.from).endsWith("@g.us") || raw.broadcast === true,
              });
            });
          },
          async sendText(chatId, text) { await client.sendText(chatId, text); },
          async hostNumber() { return client.getHostNumber(); },
          async stop(reason) { clearInterval(backupTimer); ev.off("launch.auth.qr.generated", onQr); ev.off("launch.browser.init.after", onBrowserUp); ev.off("session.connection.disconnected", onGone); ev.off("session.logout", onGone); await client.stop(reason); killOwnBrowsers(); },
        };
      } catch (error) {
        ev.off("launch.auth.qr.generated", onQr); ev.off("launch.browser.init.after", onBrowserUp);
        ev.off("session.connection.disconnected", onGone);
        ev.off("session.logout", onGone);
        throw error;
      }
    },
    async clearSession() {
      // Folder sesi khusus WhatsApp; isinya dikosongkan tanpa bergantung pada tata letak internal OpenWA.
      const { readdir, rm } = await import("node:fs/promises");
      const path = await import("node:path");
      const dir = path.resolve(env.waSessionDir);
      if (path.parse(dir).root === dir) throw new Error("WA_SESSION_DIR tidak boleh root drive.");
      for (const entry of await readdir(dir).catch(() => [] as string[])) await rm(path.join(dir, entry), { recursive: true, force: true });
    },
  };
}
