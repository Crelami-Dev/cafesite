#!/usr/bin/env node
/**
 * Atlas-Skill quick-check.mjs
 * Lean cross-viewport browser audit + screenshot generator for Atlas-Skill.
 * Zero project bloat: supports live HTTP URLs or local HTML files/directories.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";

const VIEWPORTS = [
  { name: "320", width: 320, height: 740 },
  { name: "360", width: 360, height: 800 },
  { name: "390", width: 390, height: 844 },
  { name: "820", width: 820, height: 1180 },
  { name: "1440", width: 1440, height: 900 },
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const SLOP_PHRASES = [
  "solusi komprehensif",
  "era digital",
  "mengubah cara anda",
  "transformasi bisnis",
  "inovasi terdepan",
  "next-gen",
  "game-changing",
  "revolutionary",
  "elevate your",
  "streamline your workflow",
  "seamlessly",
  "empowering teams",
];

function parseArgs(argv) {
  const args = argv.slice(2);
  let target = "";
  let shotsDir = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--shots" && args[i + 1]) {
      shotsDir = args[++i];
    } else if (!args[i].startsWith("--") && !target) {
      target = args[i];
    }
  }
  return { target, shotsDir };
}

function loadPlaywright() {
  const candidates = [
    path.join(process.cwd(), "package.json"),
    process.env.APPDATA ? path.join(process.env.APPDATA, "npm/node_modules/dev-browser/package.json") : "",
    process.env.HOME ? path.join(process.env.HOME, ".npm-global/lib/node_modules/dev-browser/package.json") : "",
  ].filter(Boolean);

  for (const pkgPath of candidates) {
    try {
      if (!fs.existsSync(pkgPath)) continue;
      const req = createRequire(pkgPath);
      const pw = req("playwright");
      if (pw?.chromium) return pw;
    } catch {}
  }
  throw new Error("Playwright not found. Install `playwright` locally or globally.");
}

function findBrowserExecutable() {
  if (process.env.ATLAS_BROWSER_PATH && fs.existsSync(process.env.ATLAS_BROWSER_PATH)) {
    return process.env.ATLAS_BROWSER_PATH;
  }
  const localAppData = process.env.LOCALAPPDATA || "";
  const msPlaywrightDir = localAppData ? path.join(localAppData, "ms-playwright") : "";
  const candidates = [];
  if (msPlaywrightDir && fs.existsSync(msPlaywrightDir)) {
    for (const entry of fs.readdirSync(msPlaywrightDir)) {
      if (entry.startsWith("chromium_headless_shell-")) {
        candidates.push(path.join(msPlaywrightDir, entry, "chrome-headless-shell-win64/chrome-headless-shell.exe"));
      } else if (entry.startsWith("chromium-")) {
        candidates.push(path.join(msPlaywrightDir, entry, "chrome-win64/chrome.exe"));
      }
    }
  }
  candidates.push(
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  );
  return candidates.find((p) => fs.existsSync(p));
}

function startStaticServer(targetPath) {
  const abs = path.resolve(targetPath);
  const stat = fs.statSync(abs);
  const rootDir = stat.isDirectory() ? abs : path.dirname(abs);
  const defaultFile = stat.isDirectory() ? "index.html" : path.basename(abs);

  const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || "/").split("?")[0];
    const relPath = cleanUrl === "/" ? defaultFile : cleanUrl.replace(/^\/+/, "");
    const resolved = path.resolve(rootDir, relPath);
    if (!resolved.startsWith(rootDir) || !fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      res.writeHead(404).end("Not found");
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(resolved).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve({ server, url: `http://127.0.0.1:${addr.port}/` });
    });
  });
}

async function auditViewport(page, vp, shotsDir, slopPhrases) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.waitForTimeout(180);

  if (shotsDir) {
    fs.mkdirSync(shotsDir, { recursive: true });
    await page.screenshot({ path: path.join(shotsDir, `${vp.name}.png`), fullPage: false });
    if (vp.name === "1440" || vp.name === "360") {
      await page.screenshot({ path: path.join(shotsDir, `${vp.name}-full.png`), fullPage: true });
    }
  }

  return page.evaluate(({ vpWidth, slopList }) => {
    const fails = [];
    const warns = [];

    const docOverflow = document.documentElement.scrollWidth - window.innerWidth;
    if (docOverflow > 1) {
      fails.push(`overflow: scrollWidth exceeds viewport by ${docOverflow}px`);
    }

    const brokenImages = [...document.querySelectorAll("img")].filter(
      (img) => img.offsetParent !== null && (!img.complete || img.naturalWidth === 0),
    );
    if (brokenImages.length > 0) {
      fails.push(`broken-images: ${brokenImages.length} unloaded img elements`);
    }

    const bodyText = (document.body.innerText || "").trim();
    const lowerText = bodyText.toLowerCase();
    if (/todo|lorem ipsum|placeholder|coming soon|tbd\b/i.test(bodyText)) {
      fails.push("placeholder-residue: found TODO / Lorem / Placeholder / TBD in visible text");
    }

    const tinyButtons = [...document.querySelectorAll("a, button, input, select, textarea, summary")].filter((el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || el.offsetParent === null) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40) && el.closest("header, main, footer, nav");
    });
    if (tinyButtons.length > 0 && vpWidth <= 420) {
      warns.push(`small-tap-target: ${tinyButtons.length} controls under 40px on mobile (${tinyButtons.slice(0, 3).map((e) => e.textContent.trim().slice(0, 20) || e.tagName).join(", ")})`);
    }

    // Check adjacent primary/secondary CTA stagger in Hero/CTA rows
    const ctaGroups = [...document.querySelectorAll("[data-cta-row]")];
    for (const group of ctaGroups) {
      const children = [...group.querySelectorAll("a, button")].filter((e) => e.offsetParent !== null);
      if (children.length === 2) {
        const [a, b] = children.map((el) => el.getBoundingClientRect());
        if (Math.abs(a.top - b.top) > 12 && vpWidth <= 390 && a.width + b.width + 12 <= group.getBoundingClientRect().width) {
          warns.push("cta-stagger: paired CTAs stacked despite enough width to pair horizontally");
        }
      }
    }

    if (vpWidth >= 1200) {
      const pStyle = getComputedStyle(document.body);
      const bodySize = parseFloat(pStyle.fontSize || "16");
      if (bodySize < 15) warns.push(`tiny-body: base body font-size is ${bodySize}px (< 15px)`);

      const radii = new Set();
      for (const el of document.querySelectorAll("main article, main section > div, main button, main input, main .card")) {
        const r = getComputedStyle(el).borderRadius;
        if (r && r !== "0px" && !r.includes("9999px") && !r.includes("50%")) {
          radii.add(r.split(" ")[0]);
        }
      }
      if (radii.size > 3) {
        warns.push(`radius-drift: ${radii.size} non-pill corner radii detected (${[...radii].join(", ")})`);
      }

      const grids = [...document.querySelectorAll("main ul, main div")].filter((g) => {
        const cs = getComputedStyle(g);
        return cs.display === "grid" && g.children.length === 3;
      });
      let twinGrids = 0;
      for (const g of grids) {
        const heights = [...g.children].map((c) => Math.round(c.getBoundingClientRect().height));
        if (heights.every((h) => h > 80 && Math.abs(h - heights[0]) < 12)) twinGrids++;
      }
      if (twinGrids >= 2) {
        warns.push(`twin-cards: ${twinGrids} sections use uniform equal-height 3-card grids`);
      }

      const matchedSlop = slopList.filter((phrase) => lowerText.includes(phrase));
      if (matchedSlop.length > 0) {
        warns.push(`slop-words: found banned phrases (${matchedSlop.join(", ")})`);
      }
    }

    return { fails, warns };
  }, { vpWidth: vp.width, slopList: slopPhrases });
}

async function main() {
  const { target, shotsDir } = parseArgs(process.argv);
  if (!target) {
    console.error("Usage: node quick-check.mjs <http-url | html-file | dir> [--shots <dir>]");
    process.exit(2);
  }

  let serverObj = null;
  let targetUrl = target;
  if (!/^https?:\/\//i.test(target)) {
    serverObj = await startStaticServer(target);
    targetUrl = serverObj.url;
  }

  const pw = loadPlaywright();
  const executablePath = findBrowserExecutable();
  const browser = await pw.chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  const consoleErrors = [];
  let totalFails = 0;
  let totalWarns = 0;

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(targetUrl, { waitUntil: "networkidle" });

    console.log(`Atlas Quick-Check: ${targetUrl}`);
    for (const vp of VIEWPORTS) {
      const { fails, warns } = await auditViewport(page, vp, shotsDir, SLOP_PHRASES);
      totalFails += fails.length;
      totalWarns += warns.length;
      const status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
      console.log(`  [${status}] ${vp.width}x${vp.height}`);
      for (const f of fails) console.log(`    FAIL: ${f}`);
      for (const w of warns) console.log(`    WARN: ${w}`);
    }

    if (consoleErrors.length > 0) {
      totalFails += consoleErrors.length;
      console.log(`  [FAIL] console-errors (${consoleErrors.length})`);
      for (const err of consoleErrors) console.log(`    FAIL: ${err}`);
    }

    console.log(`Summary: ${totalFails} FAIL, ${totalWarns} WARN${shotsDir ? ` | Screenshots saved to ${shotsDir}` : ""}`);
    if (totalFails > 0) process.exitCode = 1;
  } finally {
    await browser.close();
    if (serverObj) serverObj.server.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

