import { loadEnv, getAiConfig, getEmbeddingConfig } from "./config/env";
import { openDatabase } from "./db/database";
import { createOpenWaDriver, createRuntime } from "./whatsapp/client";
import { createBot } from "./bot";
import { notifyReadyOrders } from "./order/notify";
import { startControlServer } from "./control/server";
import { startRagWorker } from "./rag/worker";
import { makeEmbedder } from "./rag/retrieve";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { logger, describeError, setLogLevel } from "./whatsapp/logger";

async function main(): Promise<void> {
  const env = loadEnv();
  setLogLevel(env.logLevel);
  const db = openDatabase(env.dbPath);
  const ai = getAiConfig(env);
  const embedder = makeEmbedder(getEmbeddingConfig(env));
  let bot: ReturnType<typeof createBot>;
  /** Kirim gagal sesaat (koneksi WhatsApp bergoyang) dicoba sekali lagi supaya pelanggan tidak dibiarkan tanpa balasan. */
  const sendWithRetry = async (chatId: string, text: string): Promise<void> => {
    try { await runtime.sendText(chatId, text); }
    catch (first: unknown) {
      logger.warn("Kirim pesan gagal, mencoba sekali lagi.", { error: describeError(first) });
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await runtime.sendText(chatId, text);
    }
  };
  const runtime = createRuntime(createOpenWaDriver(env), (message) => bot.handle(message));
  bot = createBot({ db, env, ai, embedder, send: sendWithRetry });
  const stats = { startedAt: new Date().toISOString() };

  // Ingat apakah pengguna ingin bot menyala, agar reboot/restart tersambung sendiri tanpa membuka dashboard.
  const flag = path.join(env.waSessionDir, "autostart");
  const setAutostart = (on: boolean): void => { try { if (on) { mkdirSync(env.waSessionDir, { recursive: true }); writeFileSync(flag, "1"); } else rmSync(flag, { force: true }); } catch { /* non-fatal */ } };
  const controlled = {
    ...runtime,
    start: async () => { setAutostart(true); await runtime.start(); },
    stop: async () => { setAutostart(false); await runtime.stop(); },
    logout: async () => { setAutostart(false); await runtime.logout(); },
  };

  const control = startControlServer(controlled, {
    host: env.botControlHost,
    port: env.botControlPort,
    token: env.botControlToken,
    phone: env.waBotPhone,
    stats: () => ({
      ...stats,
      messagesHandled: bot.stats.messagesHandled,
      ai: ai ? "aktif" : "lokal (NVIDIA_API_KEY belum diisi)",
      embedding: embedder ? "aktif" : "kata kunci",
      documents: Number(db.prepare("SELECT COUNT(*) AS n FROM rag_jobs WHERE status = 'done'").get()?.n ?? 0),
    }),
  });
  const failControl = (error: NodeJS.ErrnoException): void => {
    logger.error(error.code === "EADDRINUSE"
      ? `Port kontrol ${env.botControlPort} sudah dipakai: ada bot lain yang masih berjalan. Hentikan dulu bot lama (satu sesi WhatsApp tidak boleh dipakai dua bot sekaligus, nanti WhatsApp ter-logout).`
      : "Server kontrol gagal.", { error: describeError(error) });
    process.exit(1);
  };
  control.on("error", failControl);
  // Pastikan hanya ada SATU bot: port harus berhasil dikunci SEBELUM menyentuh sesi WhatsApp (mematikan Chrome sisa, memulihkan berkas sesi).
  await new Promise<void>((resolve) => { control.once("listening", resolve); control.once("error", () => undefined); });
  const worker = startRagWorker(db, embedder, env.ragPollMs);

  const timer = setInterval(() => bot.tick(), 30_000);
  timer.unref();
  // Kasir menandai pesanan "siap" di dashboard -> pelanggan diberi tahu lewat WhatsApp (nomor HP yang diisi saat memesan).
  let notifying = false;
  const notifyTimer = setInterval(() => {
    if (notifying || runtime.status().state !== "connected") return;
    notifying = true;
    void notifyReadyOrders(db, (chatId, text) => runtime.sendText(chatId, text)).finally(() => { notifying = false; });
  }, 5_000);
  notifyTimer.unref();

  let closing = false;
  const shutdown = (signal: string): void => {
    if (closing) return;
    closing = true;
    logger.info("Bot dihentikan.", { signal });
    clearInterval(timer);
    clearInterval(notifyTimer);
    worker.stop();
    control.close();
    void runtime.stop().finally(() => { db.close(); process.exit(0); });
    setTimeout(() => process.exit(0), 8_000).unref();
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  logger.info("Bot siap. Hubungkan WhatsApp lewat Dashboard > WhatsApp Bot.", { control: `${env.botControlHost}:${env.botControlPort}`, db: env.dbPath });
  if (existsSync(flag)) await runtime.start();
}

void main().catch((error: unknown) => {
  logger.error("Bot gagal dimulai.", { error: describeError(error) });
  process.exit(1);
});
