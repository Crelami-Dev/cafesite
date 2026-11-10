import test from "node:test";
import assert from "node:assert/strict";
import { BotAccess } from "../src/whatsapp/botAccess";
import { checkRateLimit } from "../src/queue/rateLimit";

const MIN = 60_000;

test("hanya 'halo bot' yang mengaktifkan chat; sebelum itu semua diabaikan", () => {
  const access = new BotAccess(10 * MIN, 8 * MIN);
  assert.equal(access.accept("a", "1", "pesan kopi", 0).kind, "ignore");
  assert.equal(access.accept("a", "2", "Halo Bot!", 0).kind, "enabled");
  const next = access.accept("a", "3", "menu apa?", MIN);
  assert.equal(next.kind, "message");
});

test("pesan duplikat (id sama) diabaikan", () => {
  const access = new BotAccess(10 * MIN, 8 * MIN);
  access.accept("a", "1", "halo bot", 0);
  assert.equal(access.accept("a", "2", "menu", 1).kind, "message");
  assert.equal(access.accept("a", "2", "menu", 2).kind, "ignore");
});

test("sesi habis setelah 10 menit tanpa pesan dan memanggil onClose", () => {
  const closed: string[] = [];
  const access = new BotAccess(10 * MIN, 8 * MIN, (from) => closed.push(from));
  access.accept("a", "1", "halo bot", 0);
  assert.equal(access.accept("a", "2", "menu", 10 * MIN + 1).kind, "ignore");
  assert.deepEqual(closed, ["a"]);
});

test("pengingat dikirim di menit ke-8 sekali saja dan tidak memperpanjang sesi", () => {
  const access = new BotAccess(10 * MIN, 8 * MIN);
  access.accept("a", "1", "halo bot", 0);
  assert.deepEqual(access.dueReminders(7 * MIN), []);
  assert.deepEqual(access.dueReminders(8 * MIN), ["a"]);
  assert.deepEqual(access.dueReminders(9 * MIN), []);
  const token = (access.accept("a", "2", "menu", 9 * MIN) as { token: object }).token;
  assert.equal(access.canReply("a", token, 9 * MIN + 1), true);
});

test("'tutup bot' menutup sesi; balasan basi (token lama) tidak boleh terkirim", () => {
  const access = new BotAccess(10 * MIN, 8 * MIN);
  access.accept("a", "1", "halo bot", 0);
  const token = (access.accept("a", "2", "menu", 1) as { token: object }).token;
  assert.equal(access.accept("a", "3", "tutup bot", 2).kind, "disabled");
  assert.equal(access.canReply("a", token, 3), false);
});

test("rate limit: lewat batas ditolak, window bergeser", () => {
  const config = { maxPerMinute: 2, windowMs: MIN };
  assert.equal(checkRateLimit("x", config, 0).allowed, true);
  assert.equal(checkRateLimit("x", config, 1).allowed, true);
  assert.equal(checkRateLimit("x", config, 2).allowed, false);
  assert.equal(checkRateLimit("x", config, MIN + 5).allowed, true);
});
