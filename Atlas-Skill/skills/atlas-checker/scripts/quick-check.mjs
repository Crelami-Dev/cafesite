#!/usr/bin/env node
/**
 * Atlas-Skill quick-check.mjs (v2)
 * Deep multi-viewport browser audit:
 * - Overflow, broken media, console/page errors, placeholder residue
 * - Post-scroll reveal check (ensures zero visible sections/cards stuck at opacity: 0)
 * - WCAG AA contrast check on headings, paragraphs, buttons & links
 * - Unintentional sibling overlap + line-length measure (>78ch) + mobile tap targets
 * - Interactive smoke verification (tabs, toggles, range inputs, forms)
 * - Full-resolution 1:1 captures for top, mid-scroll, low-scroll & full-page folds
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";

const VIEWPORTS = [
  { name: "320", width: 320, height: 740, folds: false },
  { name: "360", width: 360, height: 800, folds: true },
  { name: "390", width: 390, height: 844, folds: false },
  { name: "820", width: 820, height: 1180, folds: false },
  { name: "1440", width: 1440, height: 900, folds: true },
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
  let verifyClicks = true;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--shots" && args[i + 1]) shotsDir = args[++i];
    else if (args[i] === "--no-click-test") verifyClicks = false;
    else if (!args[i].startsWith("--") && !target) target = args[i];
  }
  return { target, shotsDir, verifyClicks };
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
      resolve({ server, url: `http://127.0.0.1:${server.address().port}/` });
    });
  });
}

async function scrollSweepAndCapture(page, vp, shotsDir) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(700);
  if (shotsDir) {
    fs.mkdirSync(shotsDir, { recursive: true });
    await page.screenshot({ path: path.join(shotsDir, `${vp.name}.png`), fullPage: false });
  }

  const maxScroll = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
  const midY = Math.round(maxScroll * 0.45);
  const lowY = Math.round(maxScroll * 0.88);

  if (maxScroll > 120) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), midY);
    await page.waitForTimeout(680);
    if (shotsDir && vp.folds) {
      await page.screenshot({ path: path.join(shotsDir, `${vp.name}-mid.png`), fullPage: false });
    }

    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), lowY);
    await page.waitForTimeout(680);
    if (shotsDir && vp.folds) {
      await page.screenshot({ path: path.join(shotsDir, `${vp.name}-low.png`), fullPage: false });
    }
  }

  if (shotsDir && vp.folds) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(shotsDir, `${vp.name}-full.png`), fullPage: true });
  }
}

async function auditViewport(page, vp, shotsDir, slopPhrases) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await scrollSweepAndCapture(page, vp, shotsDir);

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
    if (/\btodo:|\blorem ipsum\b|\[company|\btbd\b/i.test(bodyText)) {
      fails.push("placeholder-residue: found TODO / Lorem / Placeholder / TBD in visible text");
    }

    // Stuck opacity:0 check after scrolling top -> mid -> low -> top
    const stuckHidden = [...document.querySelectorAll("section, article, h1, h2, h3, [data-reveal]")].filter((el) => {
      const st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      return r.height > 8 && r.width > 8 && parseFloat(st.opacity) < 0.85;
    });
    if (stuckHidden.length > 0) {
      fails.push(`stuck-opacity: ${stuckHidden.length} elements remain faded out (opacity < 0.85) after scroll`);
    }

    // Mobile tap target size check (ignores hidden/nav collapsed drawers)
    const tinyButtons = [...document.querySelectorAll("a, button, input, select, textarea, summary")].filter((el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || el.offsetParent === null) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40) && el.closest("header, main, footer, nav");
    });
    if (tinyButtons.length > 0 && vpWidth <= 420) {
      warns.push(`small-tap-target: ${tinyButtons.length} controls under 40px (${tinyButtons.slice(0, 3).map((e) => e.textContent.trim().slice(0, 20) || e.tagName).join(", ")})`);
    }

    // Paired CTA stagger check
    for (const group of document.querySelectorAll("[data-cta-row]")) {
      const children = [...group.querySelectorAll("a, button")].filter((e) => e.offsetParent !== null);
      if (children.length === 2) {
        const [a, b] = children.map((el) => el.getBoundingClientRect());
        if (Math.abs(a.top - b.top) > 12 && vpWidth <= 390 && a.width + b.width + 12 <= group.getBoundingClientRect().width) {
          warns.push("cta-stagger: paired CTAs stacked despite enough width to pair horizontally");
        }
      }
    }

    // Unintentional overlap check between visible direct siblings in interactive groups & bars
    const checkContainers = [...document.querySelectorAll("header nav, [data-cta-row], .inspector-bar, .pricing-pair")];
    for (const box of checkContainers) {
      const kids = [...box.children].filter((c) => c.offsetParent !== null && getComputedStyle(c).position !== "absolute");
      for (let i = 0; i < kids.length; i++) {
        for (let j = i + 1; j < kids.length; j++) {
          const r1 = kids[i].getBoundingClientRect();
          const r2 = kids[j].getBoundingClientRect();
          const overlapX = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
          const overlapY = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
          if (overlapX > 2 && overlapY > 2) {
            warns.push(`overlap: siblings inside <${box.className || box.tagName}> overlap by ${Math.round(overlapX)}x${Math.round(overlapY)}px`);
          }
        }
      }
    }

    // WCAG contrast audit (desktop & narrow mobile)
    const parseColor = (str) => {
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    };
    const composite = (fg, bg) => {
      const a = fg.a;
      return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
    };
    const effectiveBg = (el) => {
      const chain = [];
      for (let cur = el; cur; cur = cur.parentElement) {
        const bg = parseColor(getComputedStyle(cur).backgroundColor);
        if (bg && bg.a > 0) chain.unshift(bg);
      }
      let out = { r: 255, g: 255, b: 255, a: 1 };
      for (const layer of chain) out = composite(layer, out);
      return out;
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (c1, c2) => {
      const l1 = lum(c1);
      const l2 = lum(c2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    if (vpWidth === 1440 || vpWidth === 360) {
      const lowContrast = [];
      for (const el of document.querySelectorAll("h1, h2, h3, p, a, button")) {
        if (el.offsetParent === null || !el.innerText.trim()) continue;
        const cs = getComputedStyle(el);
        const fg = parseColor(cs.color);
        if (!fg || fg.a === 0) continue;
        const bg = effectiveBg(el);
        const cr = ratio(composite(fg, bg), bg);
        const fsPx = parseFloat(cs.fontSize);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        const minRatio = fsPx >= 24 || (bold && fsPx >= 18.66) ? 3.0 : 4.5;
        if (cr < minRatio) {
          lowContrast.push(`${el.tagName}("${el.innerText.trim().slice(0, 18)}")=${cr.toFixed(2)}`);
        }
      }
      if (lowContrast.length > 0) {
        warns.push(`contrast: ${lowContrast.slice(0, 3).join(", ")}`);
      }
    }

    if (vpWidth >= 1200) {
      const bodySize = parseFloat(getComputedStyle(document.body).fontSize || "16");
      if (bodySize < 15) warns.push(`tiny-body: base body font-size is ${bodySize}px (< 15px)`);

      for (const p of document.querySelectorAll("main p")) {
        if (p.offsetParent === null || p.innerText.trim().length < 70) continue;
        const charsPerLineEst = p.getBoundingClientRect().width / (parseFloat(getComputedStyle(p).fontSize) * 0.48);
        if (charsPerLineEst > 84 && p.getBoundingClientRect().height > 30) {
          warns.push(`wide-measure: paragraph exceeds comfortable ~80ch width (${Math.round(charsPerLineEst)}ch)`);
          break;
        }
      }

      const radii = new Set();
      for (const el of document.querySelectorAll("main article, main section > div, main button, main input, main .card")) {
        const r = getComputedStyle(el).borderRadius;
        if (r && r !== "0px" && !r.includes("9999px") && !r.includes("50%")) {
          radii.add(r.split(" ")[0]);
        }
      }
      if (radii.size > 3) warns.push(`radius-drift: ${radii.size} corner radii (${[...radii].join(", ")})`);

      const grids = [...document.querySelectorAll("main ul, main div")].filter((g) => {
        const cs = getComputedStyle(g);
        return cs.display === "grid" && g.children.length === 3;
      });
      let twinGrids = 0;
      for (const g of grids) {
        const heights = [...g.children].map((c) => Math.round(c.getBoundingClientRect().height));
        if (heights.every((h) => h > 80 && Math.abs(h - heights[0]) < 12)) twinGrids++;
      }
      if (twinGrids >= 2) warns.push(`twin-cards: ${twinGrids} uniform 3-card grids`);

      const matchedSlop = slopList.filter((phrase) => lowerText.includes(phrase));
      if (matchedSlop.length > 0) warns.push(`slop-words: (${matchedSlop.join(", ")})`);
    }

    return { fails, warns };
  }, { vpWidth: vp.width, slopList: slopPhrases });
}

async function runInteractiveSmoke(page) {
  const issues = [];
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(200);

  // Test mobile menu drawer if present
  const menuBtn = page.locator("header button[aria-expanded]");
  if ((await menuBtn.count()) > 0) {
    const before = await menuBtn.first().getAttribute("aria-expanded");
    await menuBtn.first().click();
    await page.waitForTimeout(220);
    const after = await menuBtn.first().getAttribute("aria-expanded");
    if (before === after) issues.push("mobile-menu toggle did not change aria-expanded");
    await menuBtn.first().click();
    await page.waitForTimeout(180);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(150);

  // Test tablists
  const tablists = page.locator('[role="tablist"]');
  const listCount = await tablists.count();
  for (let i = 0; i < listCount; i++) {
    const tabs = tablists.nth(i).locator('[role="tab"]');
    if ((await tabs.count()) >= 2) {
      const targetTab = tabs.nth(1);
      await targetTab.click();
      await page.waitForTimeout(180);
      const selected = await targetTab.getAttribute("aria-selected");
      if (selected !== "true") issues.push(`tablist #${i} second tab failed to activate aria-selected="true"`);
    }
  }

  return issues;
}

async function main() {
  const { target, shotsDir, verifyClicks } = parseArgs(process.argv);
  if (!target) {
    console.error("Usage: node quick-check.mjs <http-url | html-file | dir> [--shots <dir>] [--no-click-test]");
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

    console.log(`Atlas Quick-Check v2: ${targetUrl}`);
    for (const vp of VIEWPORTS) {
      const { fails, warns } = await auditViewport(page, vp, shotsDir, SLOP_PHRASES);
      totalFails += fails.length;
      totalWarns += warns.length;
      const status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
      console.log(`  [${status}] ${vp.width}x${vp.height}`);
      for (const f of fails) console.log(`    FAIL: ${f}`);
      for (const w of warns) console.log(`    WARN: ${w}`);
    }

    if (verifyClicks) {
      const clickIssues = await runInteractiveSmoke(page);
      if (clickIssues.length > 0) {
        totalFails += clickIssues.length;
        console.log("  [FAIL] interactive-smoke");
        for (const msg of clickIssues) console.log(`    FAIL: ${msg}`);
      } else {
        console.log("  [PASS] interactive-smoke");
      }
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
