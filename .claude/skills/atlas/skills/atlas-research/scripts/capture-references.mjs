#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser } from '../../atlas-checker/scripts/browser-runtime.mjs';

const args = process.argv.slice(2);
const outputIndex = args.indexOf('--out');
if (outputIndex < 0 || !args[outputIndex + 1]) throw new Error('Usage: node capture-references.mjs --out <directory> <public-http-url> [...]');
const output = path.resolve(args[outputIndex + 1]);
args.splice(outputIndex, 2);
const settleIndex = args.indexOf('--settle-ms');
let settleMs = 2000;
if (settleIndex >= 0) {
  settleMs = Number(args[settleIndex + 1]);
  if (!Number.isFinite(settleMs) || settleMs < 0 || settleMs > 10000) throw new Error('--settle-ms must be 0-10000.');
  args.splice(settleIndex, 2);
}
if (!args.length) throw new Error('Supply at least one public reference URL.');
const urls = args.map(value => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use public HTTP(S) URLs without credentials.');
  return url.href;
});
fs.mkdirSync(output, { recursive: true });
const browser = await launchBrowser();
const results = [];
try {
  for (const [index, url] of urls.entries()) {
    const id = `${String(index + 1).padStart(2, '0')}-${new URL(url).hostname.replace(/[^a-z0-9.-]/gi, '-')}`;
    const context = await browser.newContext();
    const entry = { url, id, capturedAt: new Date().toISOString(), views: [], errors: [], visualInspection: 'NOT_YET_REVIEWED' };
    const page = await context.newPage();
    page.on('pageerror', error => entry.errors.push(error.message));
    try {
      for (const [width, height] of [[1440, 900], [390, 844]]) {
        await page.setViewportSize({ width, height });
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 3000))]));
        await page.waitForTimeout(settleMs);
        const screenshot = `${id}-${width}.png`;
        await page.screenshot({ path: path.join(output, screenshot), timeout: 15000 });
        const observed = await page.evaluate(() => ({
          finalUrl: location.href,
          title: document.title,
          headings: [...document.querySelectorAll('h1,h2')].filter(el => el.getBoundingClientRect().height > 0).slice(0, 12).map(el => el.textContent.trim().slice(0, 160)),
          bodyFont: getComputedStyle(document.body).fontFamily,
          overflow: document.documentElement.scrollWidth - innerWidth,
        }));
        let middleScreenshot = null;
        if (width === 1440 && response?.ok()) {
          await page.evaluate(() => window.scrollBy({ top: innerHeight * 0.8, behavior: 'instant' }));
          await page.waitForTimeout(900);
          middleScreenshot = `${id}-${width}-mid.png`;
          await page.screenshot({ path: path.join(output, middleScreenshot), timeout: 15000 });
        }
        entry.views.push({ width, height, status: response?.status(), screenshot, middleScreenshot, settleMs, ...observed });
      }
    } catch (error) { entry.errors.push(error.message); }
    results.push(entry);
    await context.close();
    fs.writeFileSync(path.join(output, 'capture-report.json'), JSON.stringify({ purpose: 'Read-only design reference research; no forms, consent buttons or account actions clicked', results }, null, 2));
    console.log(`${id}: ${entry.views.length} captures, ${entry.errors.length} runtime/capture notes`);
  }
} finally { await browser.close(); }
if (results.some(result => result.views.length !== 2 || result.views.some(view => view.status >= 400))) process.exitCode = 1;
