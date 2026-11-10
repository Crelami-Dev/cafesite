import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "../src/db/database";

/** Dashboard (Next.js) dan bot membuka file SQLite yang sama; DDL keduanya tidak boleh menyimpang. */
test("SCHEMA_SQL di bot identik dengan di dashboard (src/lib/db/dev-sqlite.ts)", () => {
  const web = readFileSync(path.join(__dirname, "..", "..", "src", "lib", "db", "dev-sqlite.ts"), "utf8").replace(/\r\n/g, "\n");
  const match = /export const SCHEMA_SQL = `([\s\S]*?)`;/.exec(web);
  assert.ok(match?.[1], "SCHEMA_SQL tidak ditemukan di dev-sqlite.ts");
  assert.equal(match[1].trim(), SCHEMA_SQL.replace(/\r\n/g, "\n").trim());
});
