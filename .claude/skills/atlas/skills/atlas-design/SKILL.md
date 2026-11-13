---
name: atlas-design
description: "Art-direct frontend experiences from current research and the subject's evidence, with original composition, careful typography, purposeful media, coherent visual roles, contextual geometry and mobile-specific design."
---

# Atlas Design - make the subject determine the experience

Read the brief and research ledger. Design is the relationship among content, form, behavior and context, not a collection of attractive components.

## 1. Establish a visual thesis

Write a sentence explaining the visitor's experience and its connection to the subject. “An object catalogue that moves from lived space to useful details” is a thesis. “Premium, clean, modern” is not.

Identify:

- The page's main evidence: place, people, work, object, programme, workflow or result.
- The visual anchor and why it earns attention.
- The primary reading path.
- The action that follows understanding.
- One characteristic that belongs to this project.
- One tempting reference effect that will deliberately be omitted.

Do not invent a brand story or manufacturing claim to justify an aesthetic.

## 2. Select a composition, not a default hero

Use [composition-selection](../../references/composition-selection.md). Compare alternatives before committing.

A split hero, full-bleed scene, typographic cover, catalogue opening or interactive workspace can all work. None is the universal answer. Reverse the split only when reading order benefits; it is not a new concept by itself.

Ask what should occupy the visitor's first attention. A destination may need a credible place; a tool may need a real operation; a service may need a clear promise and proof. The answer comes from the brief and current evidence.

Make an intentional first-screen budget. Do not assume every hero must fill 100vh, nor that a larger photograph makes it more convincing. If the user requests a one-screen mobile scene, include navigation and action in that measurement.

## 3. Build hierarchy through relationships

Choose a clear dominant element per section. Secondary text and controls support it.

Use size, contrast, position, grouping and whitespace together. If everything is large, hierarchy disappears. If every label is tiny, uppercase and widely tracked, the page becomes an interface specimen instead of readable content.

Check the reading path without color or motion. The page should still explain itself.

Do not add a badge above every heading. Eyebrows are useful when they locate content; serial numbers are useful for real sequences or identifiers. Neither should become a required decorative prefix.

## 4. Design information density

Choose density from the visitor's task:

- Editorial reading needs comfortable measure and paragraph rhythm.
- Comparison needs aligned attributes and comparable evidence.
- Product detail needs clear specifications, variation and availability where real.
- Operational UI needs useful density and stable control locations.
- A place-oriented page needs enough atmosphere without burying practical details.

Avoid both inflated whitespace and indiscriminate compression. Remove repeated ideas before reducing body text. Group information before adding cards.

## 5. Art-direct typography

Use [typography](../../references/typography.md) as a dedicated design pass, not a final font swap.

Test real headings, Indonesian and other required text, names, units, prices, punctuation and longer strings. Choose family roles based on the actual letterforms and reading job.

Establish hierarchy in type before decorating surfaces. A distinctive type treatment can carry identity, but every line does not need a flourish. Do not force a serif/sans pairing, huge italic word or monospace label into every domain.

Judge scale against the available width and height. A 72px H1 may be too large for a dense service page and too small for a deliberate poster. Explain the relationship, not a universal size rule.

## 6. Define color by role

Use a restrained set of roles: canvas, ink, action, supporting surfaces and required semantic states. Preserve supplied brand rules. Atlas commonly starts with three main roles, but does not impose three literal colors on every project.

Treat 60/30/10 as emphasis guidance where applicable, not a screenshot pixel quota. Natural photography is not automatically another decorative UI color. Never alter a client's actual palette to match a reference.

Centralize values as tokens. Derive muted text, borders and surfaces deliberately. Check exact pairs rather than assuming “muted” or “brand” colors are accessible.

Normal text and button labels need at least 4.5:1; large text needs 3:1 under applicable WCAG definitions. Relevant UI boundaries and meaningful state graphics need their own assessment. Pair state with words or form, not color alone.

Do not use contrast compliance as the only hierarchy decision: a fully compliant page can still have weak emphasis.

## 7. Use surfaces and geometry with purpose

A surface may organize content, support interaction or separate layers. It should not be added to every block.

Choose among open typography, dividers, image edges, filled bands and containers according to the content. Comparable items may use cards; a photograph need not become one.

A physical material does not prescribe software geometry. Soft furniture can be presented as flat catalogue photography; a precise tool can have rounded controls where usability benefits. Do not mechanically map industries to radii.

Use a small related geometry system when needed. Circles, product shapes and status marks can have semantic exceptions. Consistency is a family of choices, not one identical radius everywhere.

Avoid changing all corners merely to answer a deeper complaint about generic composition.

## 8. Make media perform a clear job

Classify each asset:

| Role | Design responsibility |
|---|---|
| Atmosphere | Establish a credible place or mood without pretending it is factual proof |
| Evidence | Show actual work, product behavior, people or results |
| Object detail | Clarify shape, material, scale, variation or construction |
| Instruction | Explain a task or sequence accurately |
| Decoration | Stay subordinate and avoid carrying essential information |

Inspect the asset itself. A pretty image with the wrong object, setting, brand or crop is a failure.

Record source/context in an asset ledger. Do not imply stock imagery depicts the client's workshop or products. Do not reuse one image as several supposedly different pieces of work.

## 9. Compose the crop

Set focal points for important viewport shapes. A landscape that works at 1440x900 may hide the product or person on 390x844.

Reserve geometry through dimensions or aspect ratio. Choose width and height from the role of the media, not simply because the column has room.

Check heads, hands, furniture legs, labels, essential controls and negative space. Deliberate cropping should clarify the composition, not amputate the only meaningful evidence.

Do not create full-screen media that forces unrelated text below the fold by accident. Conversely, do not squeeze an atmospheric scene into a tiny card when the concept relies on entering the place.

## 10. Protect text over images

Check the brightest and busiest plausible areas at every important crop and relevant video frame.

Use a well-placed subject, suitable image, restrained scrim, solid text region or a different composition. A text shadow alone is not proof of contrast.

Calculate a conservative contrast bound when using a uniform scrim; inspect actual pixels as well. Gradients, blur, transparency, moving media and sibling overlays may exceed automated contrast tools' understanding.

If readability requires destroying the photograph, change the layout. Do not call unreadable text an art-direction choice.

## 11. Compose sections as a sequence

Each section should answer a distinct visitor question. Vary form when the content changes, not merely to make a layout montage.

A catalogue, story, comparison and contact action need not share the same cards. They also need not alternate left/right mechanically.

Keep shared edges and spacing logic consistent. Use optical exceptions deliberately: a broad scene, hanging quote or full-width table should have a content reason.

Check total page length. A desktop page that looks concise can become many empty phone screens after stacking.

## 12. Make interactions visually legible

Use [interaction-design](../../references/interaction-design.md). Controls should suggest their function before activation.

Distinguish links, selections, disclosures and submissions. Express hover, focus, pressed/selected, pending, disabled and error states where applicable.

The result of an action should be near enough to perceive. On mobile, do not put a large unrelated essay between a selector and its result.

Do not hide critical explanation behind hover. Provide a visible or operable touch/keyboard equivalent.

## 13. Recompose for mobile and tablet

Treat mobile as an intentional arrangement:

- Preserve the user's job and primary action.
- Decide which information appears before media.
- Reconsider crops, labels, navigation and selector placement.
- Use natural wrapping and useful touch targets.
- Keep important state changes perceptible.
- Test short heights, enlarged text and on-screen keyboard behavior where relevant.

Tablet deserves its own density decision. Avoid an unnecessarily tall phone stack or cramped desktop columns. Use content thresholds, not only device category labels.

Respect safe areas where content approaches screen edges. A one-screen design must grow rather than clip when accessibility needs require it.

## 14. Resolve the footer

Choose useful closure: orientation, meaningful internal navigation, real contact information where supplied, a next action and necessary factual notes.

A giant logo, newsletter form or repeated CTA is optional. Do not invent contact details or an absent mailing service.

Make the footer feel part of the same visual grammar. It should not be a new design system tacked onto the end.

## 15. Challenge the direction

Before implementation and after rendering, ask:

- Could another industry keep this structure by changing only the copy?
- Are the reference's most recognizable elements still visible in the result?
- Is one effective idea diluted by extra decoration?
- Does the visual hierarchy survive without motion?
- Are type and media proportionate to the task and viewport?
- Is the mobile version actually composed?
- Can a simpler arrangement improve both clarity and distinctiveness?

Write the strongest critique, revise the real cause, and compare. Do not accept the result just because the tokens are consistent.

## Handoff

Document the chosen system, asset behavior, type roles, interaction states and responsive decisions. Make room for refinement after screenshots; do not treat the initial design specification as untouchable.
