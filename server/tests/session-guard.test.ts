import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { guardSession, snapshotSession } from "../src/whatsapp/client";
import type { BotEnv } from "../src/config/env";

async function sandbox(): Promise<{ env: BotEnv; dir: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(path.join(tmpdir(), "wa-session-"));
  const env = { waSessionDir: dir, waSessionId: "cafesite" } as BotEnv;
  return { env, dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}
const good = JSON.stringify({ token: "x".repeat(3000) });

test("sesi sehat dicadangkan; berkas sesi yang kosong dipulihkan dari cadangan", async () => {
  const { env, dir, cleanup } = await sandbox();
  try {
    await writeFile(path.join(dir, "cafesite.data.json"), good);
    await snapshotSession(env);
    assert.equal(await readFile(path.join(dir, "cafesite.data.json.bak"), "utf8"), good);
    await writeFile(path.join(dir, "cafesite.data.json"), "{}"); // terkikis
    await guardSession(env);
    assert.equal(await readFile(path.join(dir, "cafesite.data.json"), "utf8"), good);
  } finally { await cleanup(); }
});

test("cadangan tidak pernah ditimpa dengan berkas kosong; sesi sehat tidak diganti", async () => {
  const { env, dir, cleanup } = await sandbox();
  try {
    await writeFile(path.join(dir, "cafesite.data.json"), good);
    await snapshotSession(env);
    await writeFile(path.join(dir, "cafesite.data.json"), "{}");
    await snapshotSession(env); // tidak boleh menimpa cadangan yang baik
    assert.equal(await readFile(path.join(dir, "cafesite.data.json.bak"), "utf8"), good);
    const newer = JSON.stringify({ token: "z".repeat(4000) });
    await writeFile(path.join(dir, "cafesite.data.json"), newer);
    await guardSession(env);
    assert.equal(await readFile(path.join(dir, "cafesite.data.json"), "utf8"), newer);
  } finally { await cleanup(); }
});

test("tanpa cadangan dan tanpa berkas: tidak error (pairing pertama)", async () => {
  const { env, cleanup } = await sandbox();
  try { await guardSession(env); } finally { await cleanup(); }
});

test("daftar PID lama yang bukan Chrome tidak dimatikan dan berkasnya dibersihkan", async () => {
  const { env, dir, cleanup } = await sandbox();
  try {
    await writeFile(path.join(dir, "browser.pids"), String(process.pid)); // proses uji ini sendiri (node), bukan Chrome
    await guardSession(env);
    assert.equal(await readFile(path.join(dir, "browser.pids"), "utf8").catch(() => null), null);
    assert.ok(process.kill(process.pid, 0)); // masih hidup
  } finally { await cleanup(); }
});
