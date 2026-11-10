import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createRuntime, type IncomingWaMessage, type WaDriver, type WaSession } from "../src/whatsapp/client";
import { startControlServer } from "../src/control/server";

const TOKEN = "token-uji-yang-cukup-panjang";

class FakeDriver implements WaDriver {
  qrHooks: { onQr(qr: string): void; onDisconnected(): void } | null = null;
  finishPairing: (() => void) | null = null;
  failNext: string | null = null;
  cleared = 0;
  sent: { chatId: string; text: string }[] = [];
  stopped: string[] = [];
  handler: ((message: IncomingWaMessage) => void) | null = null;
  connects = 0;

  connect(hooks: { onQr(qr: string): void; onDisconnected(): void }): Promise<WaSession> {
    this.connects += 1;
    this.qrHooks = hooks;
    if (this.failNext) { const message = this.failNext; this.failNext = null; return Promise.reject(new Error(message)); }
    return new Promise((resolve) => {
      hooks.onQr("QR-MENTAH-1");
      this.finishPairing = () => resolve({
        onMessage: (handler) => { this.handler = handler; },
        sendText: async (chatId, text) => { this.sent.push({ chatId, text }); },
        hostNumber: async () => "6281234567890@c.us",
        stop: async (reason) => { this.stopped.push(reason); },
      });
    });
  }
  async clearSession(): Promise<void> { this.cleared += 1; }
}

const tick = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

test("runtime: connecting -> awaiting_qr -> connected, nomor disamarkan, QR dihapus setelah tersambung", async () => {
  const driver = new FakeDriver();
  const received: string[] = [];
  const runtime = createRuntime(driver, (message) => { received.push(message.body); });
  assert.equal(runtime.status().state, "stopped");
  await runtime.start();
  await tick();
  assert.equal(runtime.status().state, "awaiting_qr");
  assert.equal(runtime.status().qr, "QR-MENTAH-1");
  driver.finishPairing?.();
  await tick(); await tick();
  const status = runtime.status();
  assert.equal(status.state, "connected");
  assert.equal(status.qr, null);
  assert.equal(status.phone, "6281••••890");
  assert.ok(status.lastConnectedAt);
  driver.handler?.({ id: "1", from: "62@c.us", body: "halo bot", fromMe: false, isGroupMsg: false });
  assert.deepEqual(received, ["halo bot"]);
  await runtime.sendText("62@c.us", "hai");
  assert.deepEqual(driver.sent, [{ chatId: "62@c.us", text: "hai" }]);
  await runtime.start(); // sudah tersambung: tidak membuat koneksi kedua
  assert.equal(driver.connects, 1);
  await runtime.stop();
});

test("runtime: sendText sebelum tersambung ditolak", async () => {
  const runtime = createRuntime(new FakeDriver(), () => undefined);
  await assert.rejects(runtime.sendText("x", "y"), /belum tersambung/);
});

test("runtime: stop saat menunggu QR membatalkan koneksi; sesi basi ditutup setelah pairing selesai", async () => {
  const driver = new FakeDriver();
  const runtime = createRuntime(driver, () => undefined);
  await runtime.start();
  await tick();
  const finish = driver.finishPairing;
  await runtime.stop();
  assert.equal(runtime.status().state, "stopped");
  finish?.();
  await tick(); await tick();
  assert.equal(runtime.status().state, "stopped");
  assert.deepEqual(driver.stopped, ["dibatalkan"]);
});

test("runtime: gagal connect -> state error dengan pesan; logout menghapus sesi", async () => {
  const driver = new FakeDriver();
  driver.failNext = "Chromium tidak ditemukan";
  const runtime = createRuntime(driver, () => undefined);
  await runtime.start();
  await tick(); await tick();
  assert.equal(runtime.status().state, "error");
  assert.match(String(runtime.status().error), /Chromium tidak ditemukan/);
  await runtime.logout();
  assert.equal(driver.cleared, 1);
  assert.equal(runtime.status().state, "stopped");
});

test("runtime: terputus setelah tersambung -> reconnecting, bukan crash", async () => {
  const driver = new FakeDriver();
  const runtime = createRuntime(driver, () => undefined);
  await runtime.start();
  await tick();
  driver.finishPairing?.();
  await tick(); await tick();
  driver.qrHooks?.onDisconnected();
  assert.equal(runtime.status().state, "reconnecting");
  await runtime.stop();
});

test("API kontrol: token wajib, status/qr/connect/disconnect/logout bekerja", async () => {
  const driver = new FakeDriver();
  const runtime = createRuntime(driver, () => undefined);
  const server = startControlServer(runtime, { host: "127.0.0.1", port: 0, token: TOKEN, phone: "6281234567890", stats: () => ({ messagesHandled: 3 }) });
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/internal/control`;
  const call = async (path: string, method = "GET", token: string | null = TOKEN): Promise<{ status: number; body: Record<string, unknown> }> => {
    const response = await fetch(`${base}/${path}`, { method, headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
  };
  try {
    assert.equal((await call("status", "GET", null)).status, 401);
    assert.equal((await call("status", "GET", "salah")).status, 401);
    assert.equal((await call("status", "GET", `${TOKEN}x`)).status, 401);
    const status = await call("status");
    assert.equal(status.status, 200);
    assert.equal(status.body.state, "stopped");
    assert.equal(status.body.configuredPhone, "6281••••890");
    assert.equal(status.body.messagesHandled, 3);

    const connect = await call("connect", "POST");
    assert.equal(connect.status, 202);
    await tick();
    const qr = await call("qr");
    assert.equal(qr.body.qr, "QR-MENTAH-1");
    assert.equal(qr.body.state, "awaiting_qr");

    driver.finishPairing?.();
    await tick(); await tick();
    assert.equal((await call("status")).body.state, "connected");
    assert.equal((await call("qr")).body.qr, null);

    assert.equal((await call("disconnect", "POST")).body.state, "stopped");
    assert.equal((await call("logout", "POST")).status, 200);
    assert.equal(driver.cleared, 1);
    assert.equal((await call("tidak-ada", "GET")).status, 404);
  } finally {
    await runtime.stop();
    server.close();
  }
});
