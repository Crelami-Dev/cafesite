---
name: atlas-anti-slop
description: >-
  Anti-AI-slop and anti-plain-wireframe visual, layout, copywriting, and anime.js
  motion standards adaptable to any domain. Use when designing, building, or restyling
  landing pages, product sites, shops, or web apps so output looks bespoke, crisp,
  and alive rather than templated or sterile.
---

# Atlas Anti-Slop — Taste, Depth & Living Motion

"Clean minimal" is NOT an excuse for a flat, lifeless wireframe of 1px boxes stacked vertically. Genuine craft comes from **deliberate contrast hierarchy, authentic domain artifacts, expressive typography, honest copywriting, and responsive motion choreography**.

## 1. Layout & Anti-Wireframe Rules

- **Ban the "3 Identical Twin Cards" Grid:** Never repeat `[circle icon + 3-word heading + 2-line blurb] x 3` columns.
  - *Replace with:* Numbered `01 / 02 / 03` interactive master-detail switcher, `5/7` editorial media splits, interactive payload/state inspector, annotated architectural flow strip, or 2-tier asymmetric comparison.
- **Ban the "Conveyor Belt" Section Pattern:** Never stack `[Centered Pill -> Centered H2 -> Centered Muted Subtitle -> Centered Boxes]` across every fold. Alternate left-aligned editorial openers, dark contrast bands, split calculators, and full-width diagrams.
- **Ban Plain Wireframe Sterility:**
  - Introduce intentional surface depth: pair subtle structural grid/dot backgrounds (pure CSS `radial-gradient` / `linear-gradient` micro-patterns matching the brand, NEVER neon/purple radial blurs) with distinct inset terminal/panel surfaces and crisp accent indicator rails (`box-shadow: inset 3px 0 0 var(--accent)`).
  - Add crisp visual hierarchy inside cards/panels: window/terminal header bars, numbered indices (`01`, `02`, `03`), syntax-toned JSON/code spans strictly within the core palette + semantic HTTP status tags, and animated SVG diagrams where architecture matters.
- **Equal Content Edges:** `<header>`, `<main>` sections, and `<footer>` share exact `--max` container width and `--gutter` padding. Never leave orphaned elements misaligned outside the page grid.
- **Mobile Navigation & Button Pair Discipline (`320px–390px`):**
  - Never simply hide `<nav>` links on mobile (`display: none`) without providing a working accessible menu drawer/toggle (`>= 44x44px` tap target) if the page has section anchors or subpages.
  - Never let paired Hero buttons wrap asymmetrically on `320px–360px` (`flex-wrap` leaving one button wide and one narrow). Use balanced equal columns (`grid-cols-2` when short labels fit at 320px, otherwise stacked full-width) and keep `header` CTA labels concise (`Coba Gratis`) so header height stays compact (`64px`).

## 2. Geometry & Domain Authenticity

- Keep one radius token family locked across buttons, inputs, panels, and cards. Never stick `rounded-none` next to `rounded-3xl` boxes.
- Adapt artifacts directly to the business:
  - **Hospitality / Food / Physical Venue:** High-craft photography (`next/image`, real `alt`), location/hours clarity, frictionless menu/order path — zero SaaS charts or sci-fi shaders.
  - **Dev-Tools / Infra / SaaS:** Real interactive product UI (live webhook inspector, retry/backoff timeline, interactive volume estimator, SVG pipeline diagram, honest technical limits) — zero cheesy stock handshake photos.

## 3. Copywriting Anti-Slop (Bahasa Indonesia & English)

- **Banned Buzzwords:** *elevate, seamless, unlock, unleash, empower, harness, delve, tapestry, cutting-edge, game-changer, next-gen, solusi komprehensif, di era digital, transformasi bisnis, tingkatkan pengalaman, rasakan sensasi*.
- **Banned AI Tics:**
  - *"Bukan sekadar X, melainkan Y"* / *"It's not just X, it's Y"*.
  - Self-congratulatory adjectives (*"Jujur, Tenang, Sederhana"* repeated as headings when facts should speak instead).
  - Staccato two-fragment headings on every section (*"Cepat. Aman. Andal."*).
- **Write Instead:** Concrete numbers, latencies, prices, constraints (*"Batas payload 512 KB"*, *"Latensi proxy 14 ms di region Jakarta"*), specific `[Verb] + [Object]` CTAs (*"Putar Ulang Payload"*, *"Buat Rute Sandbox"*).

## 4. Motion Choreography Standard (`animejs` v4)

Motion is mandatory when building modern interactive landing pages — use **`animejs` (`v4`)** cleanly to clarify state, guide reading flow, and prove live mechanics:

- **Framework & Delivery:**
  - **Next.js / React:** Import `import { animate, stagger, svg, createTimeline } from "animejs"` inside `"use client"` leaf components or a shared client motion utility.
  - **Static HTML:** Bundle local `anime.esm.min.js` (`<script type="module">`) rather than fragile third-party CDNs so offline audits and strict CSP environments work 100%.
- **4 Intentional Motion Moments (No Gratuitous Circus):**
  1. **Hero Entrance Stagger:** Sequence `[eyebrow, h1, lead, cta-pair, centerpiece]` on load (`duration: 480–560ms`, `stagger(65)`, `ease: "outQuart"`).
  2. **Scroll-Triggered Section Reveal:** Observe sections below the fold with `IntersectionObserver`. Arm hidden initial offset (`opacity: 0; translateY: 16px`) *only* after verifying reduced motion is off and the section is actually below the fold; reveal cleanly once and **strip inline animation styles in `onComplete`** so nothing ever remains stuck at `opacity: 0`.
  3. **Live Diagram / Centerpiece Feedback:** Animate SVG signal lines or active state transitions (`svg.createDrawable`, dot/packet pulse along `<path>`, panel transition `opacity + translateY(8 -> 0)`) whenever the user clicks a tab, simulates a replay, or switches scenarios.
  4. **Numeric Interpolation:** Animate numeric counters/calculators cleanly on slider or tab changes using small tween objects (`tabular-nums` CSS mandatory so numbers never jitter horizontally).
- **Accessibility:** Always short-circuit immediately when `window.matchMedia("(prefers-reduced-motion: reduce)").matches` is true, rendering final static state at full `opacity: 1`.
