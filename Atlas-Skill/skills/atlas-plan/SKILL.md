---
name: atlas-plan
description: >-
  Architectural, visual, and motion pre-flight planner for any frontend page or component.
  Use before writing UI code when creating a new page, landing page, or redesign
  to lock theme identity, 60-30-10 + WCAG contrast, surface layering, typography scale,
  unified border-radius geometry, varied section rhythm, anime.js motion choreography,
  and responsive strategy (320px to 1440px).
---

# Atlas Plan — Visual, Motion & Architecture Blueprint

Stop before writing HTML, CSS, TSX, or Tailwind classes. AI slop and generic wireframes happen when code starts before locking visual character, contrast hierarchy, responsive geometry, and motion choreography.

## 1. The 7-Point Pre-Flight Blueprint (Write Concisely Before Coding)

Unless the user explicitly invokes `/plan`, keep the plan tight (7 bullets, no multi-page essays), but **every single decision below must be locked explicitly**:

1. **Theme, Domain Identity & Signature Centerpiece:**
   - Define the brand, audience, and physical/digital craft of the trade.
   - Lock **at least one domain-authentic interactive centerpiece** (never an empty hero box or generic illustration): e.g., live payload inspector + animated SVG topology for dev tools, live schedule/seat picker for events, calibrated photo showcase + quick order flow for hospitality.
2. **Palette Discipline (60 / 30 / 10) & WCAG Contrast:**
   - `60%` Primary canvas + subtle secondary ground (`--bg`, `--bg-grid`/texture if suitable).
   - `30%` Structural contrast: ink (`--ink`), secondary slate/stone (`--muted`), layered surfaces (`--surface`, `--surface-elevated`), hairline borders (`--line`).
   - `10%` Single primary accent (`--accent` + hover state) reserved strictly for primary actions, active tabs, and critical markers.
   - **Hard Contrast Gate:** Normal body text and buttons must exceed **4.5:1** contrast; large display headings (`>= 24px` or bold `>= 19px`) must exceed **3.0:1**. Never place muted gray text on a tinted medium surface without verifying contrast.
3. **Surface Depth & Unified Geometry (One Radius Family):**
   - Distinguish **canvas vs elevated panel vs inset terminal/media** via subtle step differences (`--bg` vs `--surface` vs `--ink` band), hairline borders (`1px`), and restraint — not generic blurred drop shadows everywhere.
   - Lock **one** border-radius system matching the trade:
     - *Technical / Precision:* sharp `2px–4px`
     - *Editorial / Hospitality / Studio:* crisp `4px–8px`
     - *Consumer App:* soft `10px–14px`
   - Micro status pills/dots may use `9999px`; never mix square boxes right next to `24px` pill cards.
4. **Typography Scale, Measure & Tabular Precision:**
   - Define explicit scale contrast between `h1` (`clamp(2rem, 4.2vw, 3.4rem)`, tight `-0.03em` tracking, line-height `1.08–1.14`), `h2`, `h3`, and body (`>= 16px`, line-height `1.55–1.65`).
   - Cap prose paragraphs at **`48ch–66ch`** max width so desktop lines never stretch uncomfortably across 1200px.
   - Enforce `font-variant-numeric: tabular-nums` on prices, counters, latency metrics, and tables.
5. **Section Rhythm Map (Anti-Repeat + Above-the-Fold Balance):**
   - List each band top-to-bottom with **alternating structural patterns** (e.g., `Asymmetric Hero Split -> Animated Signal Flow Strip -> Master-Detail Interactive Tabs -> Spec & Honest Limits Split -> 2-Tier Comparison -> Dark Anchored Action Footer`).
   - Verify **Left/Right Balance** in split heroes: neither column should hang 300px taller/shorter than its partner.
6. **Motion Choreography Spec (`animejs` v4 Standard):**
   - Lock exactly how `animejs` (`v4`) brings clarity without clutter:
     - **Hero Entrance:** Fast staggered reveal (`<= 550ms`, `outQuart`) on headline, actions, and centerpiece.
     - **Scroll Reveal:** `IntersectionObserver` + `animejs` batching once per band — content must default visible if JS/reduced-motion is disabled, hidden only once observer is armed, and inline styles released on `onComplete`.
     - **Interactive State Feedback:** Tab swaps, active selection sliders, counter interpolation, or SVG signal packet pulses along topology paths (`svg.createDrawable` / `animate`).
   - Always honor `@media (prefers-reduced-motion: reduce)` and `matchMedia("(prefers-reduced-motion: reduce)")`.
7. **Responsive Blueprint (`320px–1440px`):**
   - **`320px–390px` (Mobile):** Include working collapsible/drawer nav if >2 links exist; keep paired primary/secondary buttons evenly paired or clean full-width; keep every tap target `>= 44x44px`; keep hero headline + main CTA cleanly readable without horizontal overflow.
   - **`768px–820px` (Tablet):** Collapse cramped 2-column inspector splits cleanly if a column drops below `340px`, preventing jagged wraps inside code bars or headers.
   - **`1280px–1440px` (Desktop):** Align outer container bounds strictly edge-to-edge from `<header>` through `<footer>`.

## 2. Scope & Anti-Invention Boundary

- Implement strictly what the prompt or repository architecture calls for.
- Never invent unrequested dashboards, auth gates, fake testimonials, vanity counters (`"99.99% Satisfaction | 50k Customers"`), or unverified external asset URLs.
- Keep copy grounded in real product specs, pricing, limits, and concrete actions.
