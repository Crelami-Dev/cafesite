---
name: atlas-lean-code
description: >-
  Simplicity and anti-overengineering discipline for clean, fast frontend code.
  Use alongside UI implementation to prefer native CSS/platform primitives over
  heavy abstractions, preserve project tokens, eliminate dead bloat, and load
  media efficiently without inventing unnecessary features.
---

# Atlas Lean Code — Simple, Fast, Maintainable

If 4 lines of clean CSS achieve the exact visual result of 60 lines of JS resize observers
or 3 wrapper components, always choose the 4 lines of CSS.

## 1. Native Platform First

- **CSS Before JavaScript:** Use CSS `grid`, `flex`, `gap`, `clamp()`, `aspect-ratio`, `scroll-snap-type`, and `:focus-visible` instead of calculating layout positions or scroll offsets manually in JS.
- **Zero Redundant Abstractions:** Do not create single-use helper wrappers, over-engineered factory hooks, or duplicate style systems when Tailwind utilities or a short CSS token file already covers the need.
- **Semantic HTML Always:** Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<button>` for actions, `<a href>` for navigation — never clickable `<div>` elements.

## 2. Token & Dependency Hygiene

- **No Hardcoded Random Colors:** Bind colors through CSS custom properties (`--bg`, `--surface`, `--ink`, `--muted`, `--accent`) or Tailwind theme tokens so palette tweaks propagate cleanly.
- **No Unnecessary Packages:** Do not install UI kits, icon packs, or animation frameworks when existing project dependencies or inline SVG/CSS solve the task cleanly.
- **Server-First Rendering (React/Next.js):** Keep components as Server Components by default; add `"use client"` strictly at small interactive leaves.

## 3. Media & Perceived Speed

- Reserve explicit image dimensions (`width`/`height` or `aspect-ratio`) on every media container so layout never jumps (`CLS = 0`).
- Use modern lightweight formats (WebP/AVIF where applicable), lazy-load below-the-fold images cleanly, and keep hero imagery eager without blocking skeleton overlays on first paint.
- Keep markup clean and readable — no dead commented-out blocks, no leftover debug telemetry, no bloated inline SVG blobs where crisp minimal vector geometry works.

