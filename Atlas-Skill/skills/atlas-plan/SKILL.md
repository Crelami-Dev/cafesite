---
name: atlas-plan
description: >-
  Architectural and visual pre-flight planner for any frontend page or component.
  Use before writing UI code when creating a new page, landing page, or redesign
  to lock theme identity, 60-30-10 color balance, unified border-radius geometry,
  varied section rhythm, responsive strategy (320px to 1440px), and strict scope boundaries.
---

# Atlas Plan — Plan First, Zero Guesswork

Stop before touching HTML, CSS, or TSX. Every AI-slop mistake happens because code
was generated before deciding how the page looks, reads, and adapts across screens.

## Required Mini-Plan (Write in 5 Concise Lines Before Coding)

Do not expand into bloated multi-page documentation unless the user invoked `/plan`.
State these 5 decisions plainly first:

1. **Theme & Domain Identity:** What business/product is this, who uses it, and
   what real atmosphere fits it? Derive colors, fonts, and geometry from the domain —
   never force a generic dark SaaS template onto a shop, cafe, clinic, or workshop.
2. **Palette Discipline (60 / 30 / 10):**
   - `60%` Primary canvas/ground
   - `30%` Structural contrast (text ink, subtle surface steps, borders)
   - `10%` Single accent catalyst (primary CTAs, active indicators, key markers)
   Never introduce an arbitrary 4th accent color or unprompted purple/neon glow.
3. **Unified Geometry (One Radius Family):** Choose **one** corner system fitted to
   the theme and keep it coherent across cards, media frames, buttons, and inputs:
   - *Technical / Precision:* sharp `0px–4px`
   - *Editorial / Hospitality / Craft:* subtle crisp `4px–6px`
   - *Consumer / Friendly App:* soft `8px–12px`
   Only micro status badges/dots may use `9999px` pill geometry.
4. **Section Rhythm Map (Anti-Repeat):** List each section in order with its
   unique layout pattern (e.g., `Split Hero -> Interactive Selector -> Asymmetric Media -> Pricing/Schedule + Integrated Footer`).
   Never place two consecutive sections with the same structure or twin card grids.
5. **Responsive Blueprint:** Plan how content behaves at:
   - **Slender Mobile (`320px–390px`):** Keep navigation usable, prevent jagged wrapped CTA pairs (use clean 2-column or uniform full-width pairs), maintain `>= 44px` tap targets.
   - **Portrait Tablet (`768px–820px`):** Prevent giant stretched images (`aspect-[16/10]` or capped heights) and orphaned half-empty rows.
   - **Desktop (`1280px–1440px`):** Keep hero complete on screen 1 without clipping primary CTAs; align outer container edges cleanly top-to-bottom.

## Scope & Anti-Invention Guard

- Build strictly what the prompt or existing repo architecture requires.
- Never invent extra pages, admin dashboards, fake client testimonials, unrequested stat bars (`"99% Uptime | 10K Users"`), or imaginary metrics.
- Missing facts? Use clear factual placeholders marked or omit the empty claim gracefully.

## Next Step

Once this 5-point mini-plan holds together, proceed using **atlas-anti-slop** + **atlas-lean-code**, then verify visually with **atlas-checker**.

