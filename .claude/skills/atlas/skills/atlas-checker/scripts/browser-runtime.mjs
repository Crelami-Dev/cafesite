import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export function loadPlaywright() {
  const candidates = [
    process.env.ATLAS_PLAYWRIGHT_PACKAGE,
    path.join(process.cwd(), 'package.json'),
    process.env.APPDATA && path.join(process.env.APPDATA, 'npm/node_modules/dev-browser/package.json'),
    process.env.HOME && path.join(process.env.HOME, '.npm-global/lib/node_modules/dev-browser/package.json'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const playwright = createRequire(path.resolve(candidate))('playwright');
      if (playwright.chromium) return playwright;
    } catch { /* Try the next explicitly supported installation. */ }
  }
  throw new Error('Playwright unavailable. Set ATLAS_PLAYWRIGHT_PACKAGE to a package.json that resolves playwright, or install it in your audit environment.');
}

export function findBrowserExecutable() {
  if (process.env.ATLAS_BROWSER_PATH) {
    if (!fs.existsSync(process.env.ATLAS_BROWSER_PATH)) throw new Error('ATLAS_BROWSER_PATH does not exist.');
    return process.env.ATLAS_BROWSER_PATH;
  }
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ];
  return candidates.find(candidate => fs.existsSync(candidate));
}

export async function launchBrowser() {
  const { chromium } = loadPlaywright();
  const executablePath = findBrowserExecutable();
  // If no system browser is found, Playwright resolves its own managed browser.
  return chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
}
