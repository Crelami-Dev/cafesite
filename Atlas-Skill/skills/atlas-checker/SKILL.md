---
name: atlas-checker
description: >-
  Deep multi-viewport browser audit, interactive smoke tester, and visual screenshot
  critic gate. Run after building or modifying any frontend UI to catch overflow,
  contrast failures, overlapping controls, stuck opacity:0 animations, broken
  interactions, and inspect 1:1 fold screenshots iteratively until polished.
---

# Atlas Checker — Deep Audit, Visual Inspection & Iterative Polish

Code compiles ≠ UI looks good or works reliably. Every build/edit MUST pass both automated DOM/contrast/animation checks AND human-eye inspection across 1:1 viewport screenshots before finishing.

## Step 1 — Compile / Serving Integrity Check

- **Framework Apps (Next.js / Vite):** Run `npx tsc --noEmit` and `npm run build` first. Zero warnings/errors allowed before inspecting UI.
- **Static Pages:** Serve via local loopback HTTP (`quick-check.mjs` starts one automatically on an ephemeral port when passed a `.html` path). Never ignore `404` favicon/asset errors in console output.

## Step 2 — Run Deep Headless Audit (`quick-check.mjs`)

Execute the upgraded audit script:

```bash
node <path-to-atlas-checker>/scripts/quick-check.mjs <url-or-html-path> --shots <temp-shots-dir>
```

Add `--no-click-test` only if targeting a page where clicking controls triggers destructive navigation.

**Viewports & Multi-Fold Captures:**
- **`320x740`** (`320.png`) — Ultra-narrow phone; tests header cramming, paired CTA wrap, and zero horizontal overflow.
- **`360x800`** (`360.png`, `360-mid.png`, `360-low.png`, `360-full.png`) — Android standard across top, mid-scroll, and footer folds.
- **`390x844`** (`390.png`) — Modern iOS viewport.
- **`820x1180`** (`820.png`) — Portrait tablet; catches awkward 2-column squishing and tall whitespace voids.
- **`1440x900`** (`1440.png`, `1440-mid.png`, `1440-low.png`, `1440-full.png`) — Wide desktop top, middle, bottom, and full-page scroll views.

**Automated Gates Enforced:**
1. `FAIL` **Horizontal Overflow:** `scrollWidth > innerWidth` at any of the 5 widths.
2. `FAIL` **Broken Media / Missing Fonts / Console & Runtime Errors:** Unloaded `<img>`, failed stylesheet/bundle/favicon `404`, uncaught page errors.
3. `FAIL` **Stuck Scroll Animations (`opacity: 0`):** Scrolls through `45%` and `85%`, waits `650ms` for `animejs`/reveal settles, and fails if any visible section, heading, card, or `[data-reveal]` stays invisible (`opacity < 0.9`).
4. `FAIL` **Interactive Smoke Failure:** Clicks interactive controls (`[role="tab"]`, mobile menu toggles, non-nav `<button>`, `<details>`), verifying real DOM/ARIA state changes with zero runtime errors.
5. `FAIL` / `WARN` **WCAG Contrast Audit:** Computes effective opaque background under headings, body copy, and primary buttons; flags text under `4.5:1` (`3.0:1` for large headings `>= 24px`).
6. `WARN` **Element Overlap & Typography Measure:** Detects unintentional overlapping bounding boxes on sibling visible controls/text, body font `< 15px`, unreadable wide prose paragraphs (`> 78ch`), small mobile tap targets (`< 40px`), uneven CTA stagger on slender widths, >3 non-pill corner radii, twin 3-card grids, and AI slop phrases.

## Step 3 — Mandatory 1:1 Visual Screenshot Critic Loop

Inspect **both full-page AND cropped per-fold 1:1 screenshots** via `read_file` (`320.png`, `360.png`, `360-mid.png`, `360-low.png`, `820.png`, `1440.png`, `1440-mid.png`, `1440-low.png`):

1. **Above-the-Fold Authority (`1440.png` & `360.png`):** Is the page visually compelling at first glance (not a sterile flat wireframe), balanced left-to-right, with hero CTA + signature centerpiece clearly visible?
2. **Mobile Precision (`320.png`, `360-mid.png`, `360-low.png`):** Does the mobile nav button open cleanly? Are paired buttons balanced, code/terminal badges non-breaking, table/form inputs spacious, and spacing harmonious?
3. **Tablet Split Check (`820.png`):** Do multi-column panels have generous breathing room without wrapping badges into 2 awkward lines?
4. **Mid & Footer Folds (`1440-mid.png`, `1440-low.png`):** Are animated SVG flows sharp, section transitions distinct, contrast strong on dark/light bands, and interactive controls clearly styled?

Whenever ANY flaw appears in automated logs OR screenshot eyes: **fix the root CSS/HTML/JS/TSX cleanly, re-run `quick-check.mjs`, and re-inspect updated screenshots.**

## Step 4 — Clean Up

Remove temporary screenshot folders (`rm -rf <temp-shots-dir>`) before concluding or committing so no scratch PNGs pollute the repository.
