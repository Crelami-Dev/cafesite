import assert from "node:assert/strict";
import test from "node:test";
import { parseScan, scanProblem, scanUrl } from "../src/lib/order-scan";
import { tableOrderUrl, qrPng, qrSvg } from "../src/components/admin/tables/qr";

Object.defineProperty(globalThis, "window", {
  value: { location: { origin: "https://cafesite-five.vercel.app" } },
  configurable: true,
});

test("QR pada screenshot terbaca sebagai QR tanpa kunci, bukan diabaikan", () => {
  const payload = "https://cafesite-five.vercel.app/order?meja=TKW";
  assert.equal(parseScan(payload), null);
  assert.match(scanProblem(payload)!, /QR terbaca.*belum memiliki kunci/);
});

test("dashboard menolak membuat QR tanpa kunci", () => {
  for (const key of [undefined, "", " "]) {
    assert.throws(() => tableOrderUrl(window.location.origin, "TKW", key), /Kunci QR meja belum tersedia/);
  }
});

test("QR baru membawa kode meja dan kunci sampai URL tujuan scanner", async () => {
  const payload = tableOrderUrl(window.location.origin, "TKW", "test-key_1234567");
  const scan = parseScan(payload);
  assert.deepEqual(scan, { meja: "TKW", k: "test-key_1234567" });
  assert.equal(scanProblem(payload), null);
  assert.equal(scanUrl(scan!), "/order?meja=TKW&k=test-key_1234567");
  assert.match(await qrPng(payload), /^data:image\/png;base64,/);
  assert.match(await qrSvg(payload), /<svg/);
});

test("QR lain memberi petunjuk dan tidak diteruskan sebagai meja", () => {
  assert.equal(parseScan("https://example.com"), null);
  assert.match(scanProblem("https://example.com")!, /bukan QR pemesanan meja/);
});
