---
name: atlas-checker
description: >-
  Browser audit and visual screenshot self-critique gate for finished frontend UI.
  Run after building or modifying any page to verify zero overflow, clean tap targets,
  consistent corner radii, anti-slop quality across 320px-1440px, and inspect real
  browser screenshots iteratively until no visual awkwardness remains.
---

# Atlas Checker — Measure, Screenshot, Critique, Polish

Never declare frontend work finished from code alone. Render it in a real headless
browser across narrow mobile to wide desktop, read the screenshots with critical eyes,
and iterate until every fold holds up cleanly.

## Step 1 — Run Build / Integrity Check

- In framework projects (Next.js, Vite, Astro), run typecheck and production build first (`npx tsc --noEmit`, `npm run build`). Fix all compile errors before checking UI.
- For standalone static HTML/CSS pages, validate local HTTP serving without console errors.

## Step 2 — Run Automated Browser Audit & Capture Screenshots

Use the bundled lightweight audit script on your target URL (or HTML file path):

```bash
node <path-to-atlas-checker>/scripts/quick-check.mjs <url-or-file> --shots <temp-shots-dir>
```

**Viewports tested automatically:**
- `320x740` (ultra-narrow phone)
- `360x800` (standard Android mobile)
- `390x844` (modern iOS mobile)
- `820x1180` (portrait tablet)
- `1440x900` (desktop wide)

**Checks evaluated:**
- `FAIL` **Horizontal Overflow:** `scrollWidth > innerWidth` at any viewport.
- `FAIL` **Broken Images & Console Errors:** Any `<img>` with `naturalWidth === 0` or uncaught JS error.
- `FAIL` **Placeholder Residue:** Leftover `lorem ipsum`, `[Company Name]`, or `TODO:` rendered visibly.
- `WARN` **Small Tap Targets:** Interactive controls (`a`, `button`) smaller than `44px` height on mobile.
- `WARN` **CTA Stagger / Mismatch:** Sibling action buttons wrapping awkwardly at mismatched widths on slender screens.
- `WARN` **Twin-Card Slop & Radius Drift:** ≥3 identical-structure sibling cards in a row or inconsistent border-radius clusters outside circular pills.
- `WARN` **Tiny Body Copy & AI Slop Words:** Long body text under `14px` or common AI puffery words.

*(Fallback: If Node Playwright/Chromium is unavailable in the environment, use the `browser` subagent or equivalent browser automation at the same 5 widths and capture screenshots.)*

## Step 3 — Mandatory Visual Screenshot Inspection Loop

Open captured screenshots directly with `read_file` and critique honestly:

1. **First Screen Check (`1440` & `360`):** Is the headline unmistakable, does the main visual render sharply, and is the primary CTA completely visible above the fold?
2. **Narrow Screen Check (`320` & `360`):** Are paired buttons clean (either balanced 2-column or equal full width), readable without cramped ellipsis, with zero crowding?
3. **Tablet Proportion Check (`820`):** Do split sections stack sensibly without stretched giant photos or hollow whitespace?
4. **Anti-Slop Eye Test:** Does the page look authentically built for its specific trade, with varied section rhythm and consistent corner geometry?

If anything looks cramped, generic, misaligned, or half-baked: **fix the root CSS/JSX cleanly, re-run `quick-check.mjs`, and re-inspect screenshots.** Never stop while a visual flaw remains obvious.

## Step 4 — Clean Up Before Finishing

Delete temporary screenshot folders/files created during verification so the repository stays clean. Report only observed checks, metrics, and exact edits made.

