#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const outputIndex = process.argv.indexOf('--report');
const reportPath = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : null;
const destination = path.join(os.tmpdir(), `atlas-export-${crypto.randomUUID()}`);
const run = args => spawnSync(process.execPath, args, { encoding: 'utf8' });
const checks = [];
function verify(name, fn) { fn(); checks.push({ name, status: 'PASS' }); }

const exported = run([path.join(root, 'scripts/export-skill.mjs'), '--out', destination]);
assert.equal(exported.status, 0, exported.stderr);
const validate = () => run([path.join(destination, 'scripts/validate-package.mjs')]);
verify('Portable package validates independently', () => {
  const result = validate(); assert.equal(result.status, 0, result.stdout + result.stderr);
});
const proof = JSON.parse(fs.readFileSync(path.join(destination, 'export-proof.json'), 'utf8'));
verify('Exported hashes match content', () => {
  for (const [name, hash] of Object.entries(proof.files)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(destination, name))).digest('hex'), hash, name);
});
verify('Demos, private and generated directories are excluded', () => {
  for (const name of Object.keys(proof.files)) assert.ok(!/(^|\/)(demo-[^/]*|node_modules|maintenance|\.next|out|\.env[^/]*)(\/|$)/.test(name), name);
});
verify('Existing destination is not overwritten', () => {
  const result = run([path.join(root, 'scripts/export-skill.mjs'), '--out', destination]);
  assert.notEqual(result.status, 0);
  assert.ok(result.stderr.includes('Destination already exists'));
});
const entry = path.join(destination, 'SKILL.md');
const original = fs.readFileSync(entry, 'utf8');
try {
  fs.writeFileSync(entry, original + '\n[Deliberately invalid](missing-resource.md)\n');
  verify('Broken portable reference is rejected', () => {
    const result = validate(); assert.equal(result.status, 1); assert.ok(result.stdout.includes('Broken/nonportable link'));
  });
} finally { fs.writeFileSync(entry, original); }
verify('Restored package validates', () => assert.equal(validate().status, 0));
const report = { result: 'PASS', destination, exportedFiles: Object.keys(proof.files).length, checks, limits: 'Tests filesystem portability and package structure, not discovery UI or future model behavior.' };
if (reportPath) { fs.mkdirSync(path.dirname(reportPath), { recursive: true }); fs.writeFileSync(reportPath, JSON.stringify(report, null, 2)); }
console.log(JSON.stringify(report, null, 2));
