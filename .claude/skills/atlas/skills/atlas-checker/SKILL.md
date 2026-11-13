---
name: atlas-checker
description: "Verify frontend quality through task-scoped technical and interaction checks, actual multi-viewport browser screenshots, demanding repeated critique, implementation simplification and a requirement-by-requirement completion audit."
---

# Atlas Checker - prove it, then try to improve it

Treat completion as unproven. Compilation, automation, visual judgment and functional behavior establish different facts; none substitutes for the others.

## 1. Define the verification scope

Derive checks from the user's request, brief, research decisions, routes and states.

For a website change, include the actual affected browser experience. For a skill-only change, validate the package, exercise its tools against controlled fixtures and review scenarios; do not edit or redeploy demos to manufacture evidence.

Do not claim broad quality from a narrow test. List what the check covers and what it does not.

## 2. Check implementation integrity

Run appropriate existing commands for type checking, linting, tests and a production build.

Record actual exits and warnings. Fix introduced errors. Distinguish pre-existing failures and unavailable commands rather than inventing a clean result.

Inspect affected files for dead code, duplicated state, accidental scope changes, secrets, unused dependencies and difficult abstractions.

A production build should be the final rendering source when available. A development overlay is not the delivered page.

## 3. Run the bundled browser audit

From the project:

```sh
node <atlas>/skills/atlas-checker/scripts/quick-check.mjs <url-or-html> --shots <evidence-directory>
```

The audit is read-only by default. Add --click-test only when the menu/tab smoke actions are appropriate for the target. --no-click-test is retained for explicit compatibility.

Playwright must resolve from the project or ATLAS_PLAYWRIGHT_PACKAGE, an absolute package.json path. ATLAS_BROWSER_PATH can choose an installed Chromium. Missing browser tooling is a gap, not a passing check.

The current default viewport set includes short phones, normal phones, tablet and short/wide desktop. Read the tool's output and report for the actual dimensions; do not claim a device was tested because a nearby width was.

Keep report.json and final images. Exit 1 means failures; exit 2 indicates usage errors where supported. Warnings require interpretation, not automatic dismissal.

## 4. Understand the automated evidence

The bundled tool checks document overflow, unloaded visible images, runtime/resource failures, basic flat-background contrast, reveal visibility and selected layout heuristics.

It cannot certify:

- Art direction, originality or relevance.
- Every action or async path.
- Photographic/gradient contrast or complex stacking.
- Full font/glyph correctness.
- A screen reader, Safari or physical phone.
- Core Web Vitals or Lighthouse scores.
- Complete WCAG conformance.

A radius count, three-column grid or phrase match is a prompt to inspect, not a universal design failure.

## 5. Verify meaningful interactions explicitly

Create a small safe interaction plan using the actual contracts. Exercise primary and secondary actions, dependent results, validation, errors, recovery and interruption where relevant.

Check visible state as well as ARIA. A menu attribute can change while its panel remains hidden. A selected tab can change while the content is wrong.

The smoke report must distinguish checks executed, skipped and failed. Zero applicable controls is SKIPPED, not a verified interaction pass.

Do not automatically click payments, deletes, bookings, newsletter forms or externally visible submissions. Use authorized, controlled tests for those operations.

## 6. Verify selectors before trusting geometry

Confirm the target exists exactly as expected, is visible, has nonzero bounds and is the actual element under test.

A hidden navigation link can share a destination with a visible primary action. Its zero-height rectangle does not prove the CTA fits.

For a requested one-screen hero, measure header/navigation plus scene and the actual primary action on 320x568, 375x667 and 390x844. Validate target height and bottom coordinate. Allow open navigation, enlarged text and no-JS fallback to grow naturally.

The optional --hero / --hero-action audit selectors support this check. See [tool documentation](../../README.md) for the exact invocation and limitations.

## 7. Open the screenshots yourself

Inspect top, meaningful middle, footer/full page and interaction states at useful scale.

Minimum useful coverage for a substantial responsive redesign:

- A narrow short phone, not only a tall 390px capture.
- Normal phone reading and open navigation.
- Tablet composition.
- Short desktop, such as 1366x768.
- Intended wide desktop.
- Expanded content, selection, error or completion states relevant to the task.

Full-page images reveal rhythm and length; viewport crops reveal legibility. Both matter. A screenshot on disk is not proof that it was inspected.

Record exact files opened.

## 8. First critique: identify actual defects

Use [visual-review](../../references/visual-review.md) and [critical-review](../../references/critical-review.md).

Examine:

- Subject and action clarity.
- Reference adaptation rather than cloning.
- Type roles, wrap, measure and perceived scale.
- Media relevance, crop and text contrast.
- Shared edges, spacing and meaningful density.
- Control-to-result relationship.
- Mobile-specific composition.
- Footer purpose.
- Repetition and ornamental scaffolding.

Write concrete observations with screenshot and location. “Looks premium” is not acceptance evidence.

## 9. Revise the highest-value cause

Prioritize impact, confidence and implementation cost. Fix the cause rather than shuffling styles.

Examples:

- Move the result nearer its selector rather than adding a decorative arrow.
- Recompose the hero rather than making every element smaller.
- Rewrite a weak heading instead of adding a badge above it.
- Replace a custom control with native behavior when capability is preserved.

Recapture affected widths and states. Compare the result. Revert a change that makes the experience worse.

## 10. Fresh adversarial review

After revisions, temporarily set aside the implementation rationale and re-read the original brief.

Ask: “If I were not the author, what would I still object to?” and “If this can be materially better, what evidence supports the next change?”

Look for defects introduced by the correction: a readable but dull page, a different template, reduced functionality, an awkward tablet state or a simpler implementation that lost recovery behavior.

Substantial work needs this fresh second review. It is not satisfied by restating the first checklist.

Continue while a concrete high-value improvement remains. If none remains, document the trade-offs and why additional tweaking is speculative. Demanding review is not an endless loop or a fabricated defect log.

## 11. Accessibility and resilience

Check keyboard order, visible focus, labels, Escape/focus return, meaningful announcements and control semantics.

Test reduced motion, appropriate no-JS fallback, enlarged text and reflow. Test text spacing where making corresponding accessibility claims.

Assess exact contrast pairs; manually inspect image overlays and complex surfaces. Comfort targets around 44px are useful design goals, while WCAG minimum target criteria have their own sizes and exceptions. Do not conflate them.

State screen-reader/device/browser limits honestly.

## 12. Simplification review

Ask whether the same result can use fewer dependencies, state owners, wrappers, listeners or abstractions.

Preserve required functionality. Record the most important retained complexity and why it is justified.

A long implementation is not more professional merely because it is long. A short implementation is not complete merely because it compiles.

## 13. Completion audit

Map each original requirement to authoritative evidence:

| Requirement | Evidence needed | Actual evidence | Status |
|---|---|---|---|
| Example: mobile one-screen hero | Visible complete scene and action at target heights | Screenshot + measured bounds | Proven / incomplete / unknown |

Check every named artifact, route, command, state, gate and invariant. Treat missing, indirect or uncertain evidence as incomplete.

For package work, additionally verify links, frontmatter, documented commands, script behavior, examples, contradictory rules and protected scope. See [package evaluation](../../evals/scenarios.md).

## 14. Delivery

Report the concrete result, key changes, actual tests and material limitations. Link useful evidence, not every scratch file.

If deployment is in scope and authorized, deploy the intended application only, exclude private artifacts and verify the live result. If only the skill changed, deliver the skill and its review without a website deployment.

Retain final screenshots and reports. Keep a small improvement backlog for future context-dependent ideas instead of claiming the result can never improve.
