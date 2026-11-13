---
name: atlas-plan
description: "Plan frontend work around audience, truthful content, current research, subject-specific concepts, responsive height and width, interaction contracts, simple architecture and explicit verification evidence."
---

# Atlas Plan - a clear brief before implementation

Create or update a brief with [brief-template](../../references/brief-template.md). Planning is a decision record, not an unrequested approval ceremony.

## 1. Establish the assignment

Record:

- The user's actual desired outcome, including what “better” means in this task.
- Audience, entry point, device context and intended next action.
- Routes, components and data that may change.
- Existing code, brand rules, installed tools and protected work.
- Scope exclusions, deadline or performance constraints if supplied.
- What can be decided reversibly and what genuinely needs clarification.

For a skill-only request, the output is the package and verification, not a new website. For a visual redesign, a lint pass alone cannot establish completion.

## 2. Translate business intent into a visitor job

Write a concrete sentence: “A visitor arriving from Instagram can check the menu, decide whether this cafe suits them, and open directions.”

Use the sentence to evaluate sections and interactions. Do not confuse the business owner's wishlist with the visitor's reading order.

Identify the main uncertainty: product fit, price, availability, credibility, location, learning value, compatibility or service process. The first meaningful evidence should address it.

## 3. Audit content and assets

Classify every major input:

| State | Meaning | Action |
|---|---|---|
| Confirmed | Supplied or verifiable actual data | Use with provenance where needed |
| Draft | Copy proposed for real content | Mark for review in source/notes |
| Demonstration | Fictional concept data | Label clearly and do not claim real operations |
| Missing | Required but unavailable | Use an honest placeholder or continue independent work |
| Prohibited | Outside scope or unauthorized | Do not implement |

Inspect actual image dimensions, content, duplicates, rights/context and crop options. A filename is not an asset review. Do not claim a stock workshop is the client's factory.

Inventory long names, descriptions, prices, addresses and translated text now. Content shape determines layout.

## 4. Read the host before proposing architecture

Inspect routes, data modules, existing components, tokens, icon system and dependencies. Read installed framework documentation for the version in use.

Identify which pieces are static, interactive, asynchronous or shared. Reuse local primitives where they fit. Do not add a provider, store, API, design application or dependency before the problem requires one.

Write the smallest implementation plan that still includes complete behavior and verification.

## 5. Commission current research

Follow [atlas-research](../atlas-research/SKILL.md) for a new visual concept or substantial redesign. Define questions first; then inspect multiple theme-relevant live references.

The output should change or confirm a decision about content, composition, typography, media, interactions or responsive behavior. Do not choose a style before research and then search only for sites that resemble it.

For supplied reference work, determine what the user values: mood, information density, structure, typography, interaction or fidelity. Do not assume permission to copy the entire reference.

## 6. Develop and select concepts

Write at least three substantially different composition ideas for a fresh direction. They may differ in narrative, evidence order, media role or interaction model. Swapping left/right, rounding the photo or changing fonts does not count.

For each record:

- The subject-specific idea in one sentence.
- The first thing the visitor understands.
- Main evidence and action.
- Why available assets support it.
- Mobile behavior and likely implementation cost.
- A failure mode or reason to reject it.

Choose the strongest fit, not the most unusual. Use [domain-reasoning](../../references/domain-reasoning.md) to ask better questions without turning industries into preset skins.

## 7. Map the page as an argument

For each proposed section record the visitor question, content/evidence, composition and next action.

Remove sections that repeat the same answer. A page does not automatically need benefits, statistics, testimonials, pricing, FAQ and a newsletter.

Choose a rhythm from the actual argument. Some pages should be concise; others need dense editorial reading, filters or comparisons. Do not force “one section per screen” or alternate backgrounds purely for variety.

Give the footer a job: useful navigation, factual business context, contact/action where real, and necessary legal/demo information.

## 8. Specify type and visual roles

Record actual content samples before final type sizes:

- Display, section heading, body, utility label, data and control roles.
- Family choice and why the glyphs fit the language and brand.
- Provisional fluid range, measure, line-height and fallback.
- Tested headline wraps on a narrow and short phone.
- Canvas, ink, action and any required semantic colors.
- Border, surface, spacing and geometry relationships.
- Main media role and focal crop at each important layout.

These are decisions to test, not universal formulas. Use [typography](../../references/typography.md) before locking the visual system.

## 9. Define real interaction contracts

List each control, user intention, state change, keyboard behavior, completion/error feedback and data source.

Distinguish:

- Navigation to existing content.
- Local selection/filtering.
- Disclosure or modal navigation.
- Form validation and local demonstration.
- Actual server submission.
- Destructive or externally visible action requiring specific authorization.

Do not show a fake success state for a missing service. Do not create tabs for content that is easier to read sequentially. Use [interaction-design](../../references/interaction-design.md).

## 10. Budget height and width

Plan at least:

- 320x568: shortest target phone, headline wraps and action visibility.
- 375x667 and 390x844: common phone proportions, open navigation and form keyboard.
- 768-820: tablet-specific density, not an oversized phone by accident.
- 1366x768: short desktop with real header height.
- 1440x900: desktop composition and shared edges.

For a requested one-screen hero, measure navigation plus content against the small viewport, reserve safe-area space, and keep the actual action visible. Use minimum height rather than clipping; enlarged text and open menus may require growth.

For normal pages, an intentional continuation beyond a screen is allowed. Explain it through reading needs rather than an oversized image.

## 11. Plan motion and engineering cost

Give each proposed effect a trigger, purpose, final state, reduced-motion outcome and cleanup strategy.

Choose the simplest useful technology: native disclosure, CSS transition, local state, existing animation tool, then a new dependency only when justified. Do not add counters, diagrams, scroll locks or continuous effects just to satisfy a motion list.

Consider load time, fonts, image bytes, hydration and maintenance as part of design feasibility.

## 12. Define proof before coding

Specify commands, exact interaction outcomes, routes, device/height cases, screenshot locations and manual limitations.

Set acceptance criteria from the task, not from whatever the bundled checker happens to support. The checker cannot prove theme fit, every control, photographic contrast, screen-reader behavior or a real phone.

Plan the first critique, revision and fresh adversarial review. Keep a question open: “What could still be materially better?”

## Handoff and exit

The brief is ready when an implementer can explain what to build, why this structure fits, what content is real, how interactions behave and how success will be verified.

Do not start detailed UI code while the primary job, content or direction is still an unexplained guess. Continue independently on reversible work; ask only for information that genuinely changes the scope or factual output.
