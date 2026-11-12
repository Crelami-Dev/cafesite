---
name: atlas-design
description: >-
  Domain-adaptive Frontend Design Craft skill. Defines fresh visual direction,
  the strict 2-Core + 1-Support Color Law (60-30-10), typography pairing, spatial
  layout composition, surface depth, and authentic photography/visual art direction
  matched specifically to each website's industry—without locking into static templates.
---

# Atlas Design — Bespoke Visual Craft Per Domain

A coffee shop, a developer webhook tool, a high school, and a dental clinic serve completely different people and emotions. Never reuse one fixed aesthetic, color scheme, or section template across unrelated websites. Derive every visual choice from the subject itself.

## 1. The Iron Color Law: 2 Core Colors + 1 Support Accent (60 / 30 / 10)

Every website MUST define **one bespoke 3-color system** tailored to its industry — never recycle another project's palette and never introduce a 4th decorative hue:

- **Core Color 1 — Primary Canvas (`60%`):** Main page background + subtle tonal steps (`+3%/-4%` lightness or pure white/card elevation) for structural panels.
- **Core Color 2 — Structural Contrast (`30%`):** Primary ink (headings, body copy) + opacity scale (`70%–75%` muted text, `12%–25%` hairline borders) + high-contrast anchor section (such as dark editorial footer or inset media frame).
- **Support Accent — Catalyst Color (`10%`):** One unmistakable domain accent dedicated to primary CTAs (`[Verb] + [Object]`), active selectors, focus rings, and key badges.
- **WCAG AA Contrast Gate:** Verify `>= 4.5:1` contrast for all body text and button labels, and `>= 3.0:1` for display headings (`>= 24px`).

### Example Domain Translations *(Patterns Only — Never Copy Blindly)*

| Website Type | Core 1 (60% Canvas) | Core 2 (30% Ink) | Support (10% Accent) | Primary Visual Anchor |
|---|---|---|---|---|
| **Specialty Cafe / Bakery** | Warm Cream or Deep Espresso Roast | Charcoal Slate or Parchment Ink | Terracotta Brick / Burnt Sienna | Tangible photography of pour-over craft, menu board, location map |
| **Developer / Infra Tool** | Archival Paper `#F4F3EE` | Deep Terminal Slate `#15171C` | Signal Cobalt `#1D4ED8` | Live payload inspector, interactive CLI/SVG topology diagram |
| **School / Campus** | Warm Academic Chalk `#F7F5EE` | Deep Botanical Forest `#153226` | Burnished Ochre `#9A5B0A` | Real daylight campus/lab/library photography, curriculum explorer, admissions timeline |
| **Medical / Dental Clinic** | Crisp Mineral White `#F8FAFC` | Deep Navy Slate `#0F2942` | Calm Teal `#0F766E` | Approachable doctor portrait, clear department schedule, direct booking drawer |

*(Do NOT default every project to the colors in this table — pick the 2+1 trio that genuinely fits the brand brief and mood.)*

## 2. Typography Pairing That Matches the Voice

Choose fonts intentionally via `next/font` (or bundled WOFF2), pairing at most **2 families** (+ optional monospace for code/schedules):

- **Editorial / Education / Hospitality:** Humanist or academic display serif (`Fraunces`, `Newsreader`, `Playfair Display`) paired with clean readable grotesk sans (`Plus Jakarta Sans`, `Inter`). Tight tracking `-0.025em` to `-0.035em` on display `h1`, generous `1.55–1.65` line height on body, prose width capped `48ch–64ch`.
- **Technical / SaaS / Analytics:** Geometric grotesk (`Plus Jakarta Sans`, `Space Grotesk`) paired with crisp monospace (`JetBrains Mono`) for metrics, latencies, schedules, and tabular pricing (`font-variant-numeric: tabular-nums`).

## 3. Spatial Composition & Surface Depth

- Avoid flat wireframe look (`white box with 1px gray border repeated 8 times`). Build visual rhythm using:
  - Subtle tonal alternating bands (`Canvas -> Soft Tinted Band -> Canvas -> High-Contrast Core-2 Footer`)
  - Explicit surface layering (`Canvas` vs `Elevated Card` vs `Dark Inset Frame`)
  - Editorial asymmetric ratios (`55/45` or `40/60` splits) alternating with full-width galleries or tabbed master-detail views
- Lock **one consistent corner-radius geometry** matching the domain:
  - *Precision / Industrial:* `2px–4px`
  - *Academic / Editorial / Studio:* `4px–8px`
  - *Friendly / Family / Community:* `10px–16px`

## 4. Authentic Imagery & Asset Discipline (`next/image`)

- When building sites for physical places (schools, cafes, studios, hotels), **real photography or domain-matched generated images** carry 50% of the visual weight — never replace campus/craft photos with generic vector illustrations or flat SVG blobs.
- Direct image lighting, wardrobe, and environment colors to harmonize naturally with your **2 Core + 1 Support** palette (e.g., daylight wood/greenery/warm ochre tones for a Forest & Chalk school site).
- Export optimized `.webp`, define explicit `aspect-[...]` / `width` + `height` (`CLS = 0`), mark the hero photo `priority`, lazy-load below-the-fold images, and write concrete descriptive `alt` text for every image.

