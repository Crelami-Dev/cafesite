---
name: atlas-lean-code
description: >-
  Clean engineering and anti-overengineering discipline for fast, maintainable UI code.
  Prefers native CSS primitives for layout, clean token architecture, semantic HTML,
  server-first React boundaries, and standardized anime.js v4 helpers without dead bloat.
---

# Atlas Lean Code — Clean Primitives, Intentional Motion

Never write 80 lines of fragile resize listeners or create 6 wrapper abstractions when native CSS + clean tokenized styles do the job cleanly. At the same time, use proven project tools (`animejs` v4) whenever choreographed motion or SVG line/signal animation adds real clarity.

## 1. Native Layout First

- **CSS Handles Geometry:** Use CSS `grid`, `flexbox`, `gap`, `clamp()`, `min()` / `max()`, `aspect-ratio`, and `:focus-visible` for all responsive layout, sizing, and fluid typography. Never measure viewport widths in JS to position grid cards.
- **Semantic HTML Strictly:** Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<button type="button">` for state actions, and `<a href>` for navigation. Wire ARIA attributes (`aria-expanded`, `aria-controls`, `aria-selected`, `role="tablist"`) cleanly on custom interactive controls.
- **Zero Redundant Wrappers:** Keep component depth shallow. Avoid single-use wrapper `<div className="inner-wrap-2">` layers and avoid building elaborate factory/provider boilerplate for simple local state.

## 2. Tokens, Assets & `animejs` Hygiene

- **Design Tokens Mandatory:** Centralize surface, text, border, radius, and accent values in `:root` custom properties or `tailwind.config` / CSS variables so color/contrast adjustments propagate cleanly everywhere.
- **Standardized `animejs` v4 Usage:**
  - Always import only needed symbols (`animate`, `stagger`, `svg`, `createTimeline`).
  - Provide a tiny reusable helper `prefersReducedMotion()` and `releaseProps(el)` (`opacity`, `transform`, `clip-path`, `will-change`, `transition`) invoked in `onComplete` so animated elements never retain stale inline transforms or `opacity: 0`.
  - Wrap `IntersectionObserver` scroll-reveals in an explicit threshold (`0.12`) AND add a lightweight fallback/completion guarantee so fast-scrolling users or programmatic audit scrolls (`window.scrollTo`) reveal every band completely with zero stuck invisible blocks.
- **No Unnecessary Heavy Dependencies:** Do not install full component suites, chart libraries, icon font packs, or extra animation frameworks when `animejs` + clean inline `<svg>` icons + native HTML/CSS already solve the requirement.
- **Server-First Next.js:** Keep pages and static sections as Server Components; put `"use client"` strictly around interactive leaves (inspectors, drawers, filters, animated diagrams).

## 3. Media & First-Paint Speed

- Always specify explicit dimensions (`width` / `height` or `aspect-ratio`) on image and SVG diagram boxes so Cumulative Layout Shift stays `0`.
- Keep hero assets local/eager and crisp (`.webp`/`.avif` for raster photos, crisp `viewBox` inline `<svg>` for technical diagrams and favicons so zero `404` requests occur).
- Strip unused CSS rules, dead commented experiments, and debug `console.log` calls before verification.
