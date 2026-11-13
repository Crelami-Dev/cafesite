# Visual review at the scale visitors see

Review actual pixels at usable scale. Full-page captures show rhythm and length; viewport images show legibility and first-screen composition. Neither replaces interaction checks.

## First screen

Ask what becomes clear in three seconds: subject, offer, evidence and next action.

Identify the dominant element and whether it deserves that role. A decorative badge, giant logo or empty visual should not outrank the visitor's job.

Inspect navigation plus hero at short heights, not only a tall desktop. If content continues beyond a screen, decide whether that continuation serves reading rather than accidental oversizing.

For a requested one-screen mobile hero, inspect 320x568 and 375x667 as well as a larger phone. Confirm the actual action is visible and nonzero. Never use clipping or a hidden link's bounds as proof.

## Typography

Inspect real phrases, not just font attractiveness:

- Heading hierarchy and perceived size.
- Natural line breaks and isolated words.
- Body measure, leading and contrast.
- Captions and utility labels carrying essential information.
- Button and navigation wrapping.
- Language/glyph coverage and fallback.
- Enlarged text and user spacing resilience where tested.

Do not solve weak text by making it huge, italicizing the final word or adding a numbered eyebrow.

## Composition and edges

Check shared container edges, internal alignment and grouping.

A deliberate full-width scene, hanging punctuation or broad table can break the grid. Unrelated elements drifting by a few pixels usually indicate an implementation defect.

Judge optical balance as well as arithmetic equality. Two columns need not have equal heights, but large unexplained voids or competing anchors deserve a reason.

## Media

Identify the role: atmosphere, evidence, object detail, instruction or decoration.

Check subject recognition, crop, resolution, repeated images and truthful context. A stock photograph is not proof of the client's actual factory or product.

Inspect text over media at the real crop. A scrim can help but should not destroy the scene. Automated flat-background contrast does not certify every overlay.

## Page argument and rhythm

- Does each section answer a new question?
- Is important evidence buried beneath decorative introductions?
- Is information repeated without value?
- Does density suit reading, comparison or action?
- Are adjacent sections mechanically identical or needlessly different?
- Does the page become excessively long after stacking on mobile?
- Does the footer offer orientation and useful closure?

Do not add sections because a common template contains them.

## Interactions in context

Open navigation and relevant disclosures. Select another item. Enter invalid and valid data where appropriate.

Check whether the control suggests its job, the result is perceptible, state and content agree, and the layout survives expansion.

Hover is only one state. Inspect focus, pressed/selected, pending/error and touch equivalents as relevant.

## Mobile and tablet

Treat mobile as a composition, not a compressed desktop. Inspect order, action visibility, crops, labels, controls and keyboard-related form behavior.

Tablet often reveals the weakest layout: a needlessly huge phone stack or cramped columns. Check it independently and at intermediate widths where content changes.

No document-level overflow should be hidden to create a clean screenshot. Local scrolling can be correct for tables/code when it is understandable.

## Template-substitution challenge

Imagine changing the subject to an unrelated business. Which elements would have to change beyond text and photos?

If the answer is “almost nothing”, investigate the structure. But do not force eccentric navigation or effects merely to pass this thought exercise; familiar controls can be correct.

Check for copied reference signatures and the anti-template template: full-bleed photos, editorial serif/italic, dark product panels or number strips applied everywhere.

## Defect priority

| Level | Examples | Required response |
|---|---|---|
| Blocking | Broken action, hidden/clipped content, unreadable text, overflow | Fix and verify |
| Material | Weak subject fit, poor crop, awkward wraps, misleading evidence, excessive dead space | Revise and compare |
| Minor | Small optical adjustment without functional effect | Fix when clear; document intentional trade-off |
| Speculative | A fashionable effect without evidence of benefit | Defer, reject or test reversibly |

## Review record

Use specific observations and hypotheses. “The 375px selector result sits below unrelated text; move that text” is actionable. “Make it premium” is not.

After revisions, perform the [fresh critical review](critical-review.md). Continue when another concrete improvement is likely to help; do not declare victory from a green log, and do not add arbitrary changes to simulate dissatisfaction.
