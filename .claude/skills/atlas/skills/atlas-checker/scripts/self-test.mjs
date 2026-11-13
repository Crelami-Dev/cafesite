#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const outputIndex = process.argv.indexOf('--out');
const root = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-checker-regression-'));
fs.mkdirSync(root, { recursive: true });
const checker = path.join(import.meta.dirname, 'quick-check.mjs');
const good = fs.readFileSync(path.join(import.meta.dirname, 'fixtures/audit-good.html'), 'utf8');
const bad = good
  .replace('document.getElementById(\'fixture-nav\').hidden = !open;', '// Broken: ARIA changes without visible navigation.')
  .replace("document.getElementById(item.getAttribute('aria-controls')).hidden = !active;", '// Broken: selected state changes without visible panel.')
  .replace('<a data-primary href=', '<a hidden data-primary href=')
  .replace('</main>', '<section style="width:1800px"><h2 style="color:color(srgb 0.94 0.94 0.94)">Low contrast fixture</h2><img src="missing.png" width="200" height="100" alt="Intentionally broken image"></section></main>');
const paths = {};
const minimal = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>No smoke controls</title><link rel="icon" href="data:">${good.match(/<style>[\s\S]*?<\/style>/)[0]}</head><body><main><section data-hero><h1>No applicable smoke controls</h1><a data-primary href="#target">Visible primary action</a></section><section id="target">End</section></main></body></html>`;
for (const [name, content] of [['good', good], ['bad', bad], ['read-only', good], ['no-controls', minimal]]) {
  paths[name] = path.join(root, `${name}.html`);
  fs.writeFileSync(paths[name], content);
}

function audit(name, clickArgs = ['--click-test']) {
  const shots = path.join(root, name);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [checker, paths[name], '--shots', shots, ...clickArgs, '--hero', '[data-hero]', '--hero-action', '[data-primary]'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    child.stdout.on('data', chunk => { log += chunk; });
    child.stderr.on('data', chunk => { log += chunk; });
    child.on('error', reject);
    const timer = setTimeout(() => { child.kill(); reject(new Error(`${name} fixture audit timed out`)); }, 180000);
    child.on('close', status => {
      clearTimeout(timer);
      fs.writeFileSync(path.join(root, `${name}.log`), log);
      if (!fs.existsSync(path.join(shots, 'report.json'))) return reject(new Error(`${name} audit produced no report: ${log}`));
      resolve({ name, status, report: JSON.parse(fs.readFileSync(path.join(shots, 'report.json'), 'utf8')) });
    });
  });
}

const cases = [];
function verify(name, fn) { fn(); cases.push({ name, status: 'PASS' }); }
const [positive, negative, readOnly, noControls] = await Promise.all([audit('good'), audit('bad'), audit('read-only', []), audit('no-controls')]);
verify('Known-good page exits zero with no failures', () => { assert.equal(positive.status, 0); assert.equal(positive.report.totalFails, 0); });
verify('Short phone viewports are actually present', () => {
  for (const height of [568, 667]) assert.ok(positive.report.results.some(result => result.viewport.height === height));
});
verify('Actual primary action is nonzero, visible and within each phone', () => {
  for (const result of positive.report.results.filter(result => result.viewport.width <= 420)) {
    assert.ok(result.metrics.hero.actionVisible);
    assert.ok(result.metrics.hero.actionHeight >= 44);
    assert.ok(result.metrics.hero.actionBottom > 0 && result.metrics.hero.actionBottom <= result.viewport.height + 1);
  }
});
verify('Menu and tab checks both execute and inspect visible panels', () => {
  assert.equal(positive.report.interactive.status, 'passed');
  assert.ok(positive.report.interactive.checks.some(check => check.kind === 'menu' && check.panelVisible));
  assert.ok(positive.report.interactive.checks.some(check => check.kind === 'tab' && check.panelVisible));
});
verify('Known-bad page exits one', () => assert.equal(negative.status, 1));
const failures = negative.report.results.flatMap(result => result.fails);
for (const prefix of ['overflow:', 'contrast:', 'broken-images:', 'hero-visibility:', 'hero-action-fit:']) {
  verify(`Rejects ${prefix}`, () => assert.ok(failures.some(failure => failure.startsWith(prefix))));
}
verify('HTTP missing resource is recorded', () => assert.ok(negative.report.resources.some(resource => resource.includes('404'))));
verify('ARIA-only menu/tab changes do not pass visible behavior', () => {
  assert.equal(negative.report.interactive.status, 'failed');
  assert.equal(negative.report.interactive.issues.length, 2);
});
verify('Default audit performs no clicks and reports skipped', () => {
  assert.equal(readOnly.status, 0);
  assert.equal(readOnly.report.interactive.status, 'skipped');
  assert.equal(readOnly.report.interactive.checks.length, 0);
});
verify('Opt-in smoke with zero applicable controls is skipped, not passed', () => {
  assert.equal(noControls.status, 0);
  assert.equal(noControls.report.interactive.status, 'skipped');
  assert.equal(noControls.report.interactive.checks.length, 0);
});
for (const args of [['--unknown'], ['--shots'], ['page.html', '--hero', '#hero']]) {
  verify(`Invalid usage rejects ${args.join(' ')}`, () => assert.equal(spawnSync(process.execPath, [checker, ...args], { encoding: 'utf8' }).status, 2));
}
verify('Help exits successfully', () => assert.equal(spawnSync(process.execPath, [checker, '--help'], { encoding: 'utf8' }).status, 0));
fs.writeFileSync(path.join(root, 'self-test-report.json'), JSON.stringify({ cases, total: cases.length, positive: positive.report, negative: negative.report, readOnly: readOnly.report, noControls: noControls.report, limitations: 'Controlled regression fixtures verify selected mechanics, not the visual quality or complete accessibility of arbitrary sites.' }, null, 2));
console.log(`PASS ${cases.length} checker regression cases. Evidence: ${root}`);
