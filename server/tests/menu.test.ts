import test from "node:test";
import assert from "node:assert/strict";
import { fetchMenu, matchCartText, splitCartText } from "../src/order/menu";
import { testDb } from "./helpers";

test("splitCartText memahami angka di depan/belakang dan pemisah", () => {
  assert.deepEqual(splitCartText("2 americano, 1 nasi goreng").map(({ query, quantity }) => ({ query, quantity })), [{ query: "americano", quantity: 2 }, { query: "nasi goreng", quantity: 1 }]);
  assert.deepEqual(splitCartText("es kopi susu x2 + nasi goreng 3").map(({ query, quantity }) => ({ query, quantity })), [{ query: "es kopi susu", quantity: 2 }, { query: "nasi goreng", quantity: 3 }]);
  assert.deepEqual(splitCartText("2x latte dan americano").map(({ query, quantity }) => ({ query, quantity })), [{ query: "latte", quantity: 2 }, { query: "americano", quantity: 1 }]);
});

test("matchCartText: cocok, habis, tidak ada, ambigu, batas jumlah", () => {
  const menu = fetchMenu(testDb());
  const r = matchCartText("2 americano, cheesecake, pizza, ca, 99 latte", menu);
  assert.equal(r.matched.find((m) => m.entry.id === "americano")?.quantity, 2);
  assert.equal(r.matched.find((m) => m.entry.id === "latte")?.quantity, 20);
  assert.deepEqual(r.unavailable.map((e) => e.id), ["cheesecake"]);
  assert.deepEqual(r.notFound, ["pizza"]);
  assert.equal(r.ambiguous[0]?.query, "ca");
  assert.equal(r.ambiguous[0]?.candidates.length, 3);
});

test("matchCartText: kata urutan bebas dan huruf besar", () => {
  const menu = fetchMenu(testDb());
  assert.equal(matchCartText("LATTE CAFFE", menu).matched[0]?.entry.id, "latte");
});
