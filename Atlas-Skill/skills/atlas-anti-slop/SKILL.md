---
name: atlas-anti-slop
description: >-
  Anti-AI-slop visual, layout, copywriting, and motion standards adaptable to any
  website theme. Use when designing, building, or restyling any landing page, product
  site, shop, portfolio, or web app so output feels hand-crafted for the brand rather
  than generic templated AI output.
---

# Atlas Anti-Slop — Taste & Craft Without Templates

Good design comes from restraint, real subject matter, cohesive proportions, and
intentional variation — never from copying one static HTML template across every brand.

## 1. Visual & Layout Anti-Slop

Replace default AI patterns immediately with structured alternatives:

- **Ban the "3 Identical Twin Cards" Grid:** Never repeat three equal boxes containing `[circle icon + 3-word title + 2 equal lines of text]`.
  - *Instead use:* An interactive master-detail list (click row to update live preview), asymmetric `5/7` editorial splits, numbered index rows paired with one large stage visual, horizontal tabbed views, or bento layouts with deliberate size hierarchy.
- **Ban the "Conveyor Belt" Section Pattern:** Never repeat `[Centered Pill Eyebrow -> Centered H2 -> Centered Gray Subtitle -> Centered Card Grid]` on every scroll fold. Vary alignment (flush-left editorial, split-grid, full-bleed band) and density between neighbors.
- **Equal Content Edges:** Header, main sections, and footer share aligned left and right container bounds. Never offset random elements off-axis without grid alignment.
- **First Screen Discipline:** Above the fold holds the core value proposition, primary action (at most 2 buttons), and the real visual/work — never a decorative fluff banner pushing CTAs below the fold.
- **Zero Ornament Bloat:** No blurred gradient blobs floating behind cards, no default indigo/violet gradients, no nested cards-inside-cards, and no unprompted 3-number vanity stat bars.
- **Button Pair Integrity on Narrow Devices (`320px–390px`):** When placing 2 buttons together, never leave `flex-wrap` wrapping them into staggered uneven widths. Either pair them on equal `grid-cols-2` (`white-space: nowrap` if short) or uniform `w-full` stacked rows on mobile.

## 2. Geometry & Theme Adaptation

- Match shape language strictly to **atlas-plan**'s chosen radius family. Do not pair razor-sharp square photo frames (`rounded-none`) directly beside pill-heavy `rounded-2xl` cards unless hierarchy explicitly separates status pills from structural containers.
- Respect the site's subject:
  - *Physical places / Craft / Hospitality:* Real photography or authentic editorial UI leads; avoid fake futuristic 3D shaders.
  - *Software / Dev-Tools / SaaS:* Interactive or authentic live HTML product previews (diffs, JSON trace panels, CLI snippets, interactive calculators) beat abstract illustrations.

## 3. Copywriting Anti-Slop (Bahasa Indonesia & English)

- **Banned Buzzwords & Cliché Frames:** Avoid *elevate, seamless, unlock, unleash, empower, harness, delve, tapestry, testament, cutting-edge, game-changer, solusi terbaik, di era modern/digital, tingkatkan pengalaman, rasakan sensasi*.
- **Banned AI Structural Tics:** Never repeat *"Bukan sekadar X, melainkan Y"* / *"It's not just X, it's Y"*; avoid overusing *"Tenang / Jujur / Sederhana"* as empty self-praise when a concrete fact proves it; avoid robotic `"X. Y."` two-fragment headings on every section.
- **Positive Rule:** Write concrete facts (`price, speed, capacity, materials, honest tradeoffs`). Headlines state **what it is + who it serves**. Every button states **`[Verb] + [Object]`** (*Lihat katalog, Uji endpoint, Pesan menu* — never vague *"Learn more"* or *"Mulai"* alone).

## 4. Purposeful Motion

- Motion clarifies state transitions and gives quiet tactile feedback — never theatrics.
- **Limit to 3 clean behaviors:** (1) subtle one-time hero entrance, (2) immediate hover/press response on links, buttons, and clickable cards (`translateY(-2px)` / `.98` press / clean border shift), and (3) user-triggered state swaps.
- Animate cheap properties (`transform`, `opacity`, `clip-path`). Never trigger scroll-jacking, text parallax, or identical fade-up animations on 20 sibling items. Always respect `prefers-reduced-motion: reduce`.

