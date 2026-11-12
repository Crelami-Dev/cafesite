import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/lib/server/cloud-orders.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function loadResolver(tableKey) {
  const exports = {};
  const dependencies = {
    "server-only": {},
    "./local-orders": { tableKey },
    "./cloud-db": { cloudDb() { throw new Error("Database must not be queried for invalid QR"); } },
    "./validation": {},
    "./order-tickets": {},
    "./order-security": {},
  };
  vm.runInNewContext(compiled, {
    exports, Buffer,
    require: (name) => name in dependencies ? dependencies[name] : require(name),
  });
  return exports.resolveCloudTable;
}

test("QR tanpa kunci tidak mengakses secret atau database meskipun secret produksi belum tersedia", async () => {
  const resolve = loadResolver(() => { throw new Error("Secret is not configured"); });
  assert.equal(await resolve("TKW", ""), null);
  assert.equal(await resolve("TKW", undefined), null);
  assert.equal(await resolve("TKW", "x".repeat(65)), null);
});

test("QR dengan kunci salah tetap ditolak tanpa mengakses database", async () => {
  const resolve = loadResolver(() => "correct-key");
  assert.equal(await resolve("TKW", "wrong-key"), null);
});

test("QR berkunci tetap membutuhkan secret server, tidak melewati validasi", async () => {
  const resolve = loadResolver(() => { throw new Error("Secret is not configured"); });
  await assert.rejects(resolve("TKW", "some-key"), /Secret is not configured/);
});
