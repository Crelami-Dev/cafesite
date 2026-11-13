# Atlas 4

A research-led frontend skill package for subject-specific design, useful interaction, careful typography, simple robust implementation and demanding evidence-based review.

Start at [SKILL.md](SKILL.md). The user's request and repository rules outrank Atlas defaults. This update focuses on the skill; existing demonstrations are retained as historical work.

## Modules

| Module | Responsibility |
|---|---|
| [atlas-plan](skills/atlas-plan/SKILL.md) | Visitor job, content truth, alternatives, responsive/interaction contracts and proof |
| [atlas-research](skills/atlas-research/SKILL.md) | Current live sources, evidence quality, adaptation, rejection and idea synthesis |
| [atlas-design](skills/atlas-design/SKILL.md) | Composition, hierarchy, typography, media, color, geometry and responsive craft |
| [atlas-anti-slop](skills/atlas-anti-slop/SKILL.md) | Challenge generic structures, borrowed signatures, empty claims and superficial novelty |
| [atlas-lean-code](skills/atlas-lean-code/SKILL.md) | Native-first implementation, state ownership, lifecycle, performance and simplification |
| [atlas-checker](skills/atlas-checker/SKILL.md) | Technical/behavior/visual verification, critique rounds and completion audit |

The orchestrator is deliberately shorter than the supporting material. Detailed references are read when the problem needs them rather than dumped into every task.

## What Atlas requires

- Research during a fresh design task, using multiple relevant current live references.
- Exact source/date/evidence records; no invented “latest” observations.
- Structurally different concept options selected from the subject and assets.
- Typography tested with actual text, language, wrapping, fallback and reflow.
- Useful interaction rather than an animation or widget quota.
- The simplest implementation that preserves complete behavior.
- A first critique, revisions and a fresh adversarial review.
- Actual screenshot inspection and honest technical limitations.
- A completion audit against the original request.

Atlas does not prescribe a default split hero, immersive photograph, rounded card, serif pairing, numbered benefits or mandatory animation library.

## Supporting guides and templates

- [Typography](references/typography.md)
- [Composition selection](references/composition-selection.md)
- [Domain reasoning](references/domain-reasoning.md)
- [Idea development](references/idea-development.md)
- [Interaction design](references/interaction-design.md)
- [Motion](references/motion.md)
- [Accessibility and behavior](references/accessibility-and-behavior.md)
- [Engineering and performance](references/engineering-and-performance.md)
- [Visual review](references/visual-review.md)
- [Critical review](references/critical-review.md)
- [Brief](references/brief-template.md), [research ledger](references/research-template.md), [review](references/review-template.md), [decision log](references/decision-log-template.md)

## Current research example

The [2026-11-13 study](research/2026-11-13/README.md) examines live references across furniture, hardware, software, hospitality/culture and creative work. It preserves blocked, gated and incomplete pages as limitations. It is not a permanent trend list or a guarantee that the sites remain unchanged.

Fresh tasks must research again. Technical guidance is checked against primary MDN, W3C and web.dev sources and actual installed versions where applicable.

## Use and portable export

For direct use, tell the agent to read this package's SKILL.md and follow its modules.

To create a portable skill folder, export to a new destination:

```sh
node Atlas-Skill/scripts/export-skill.mjs --out <new-destination>
node <new-destination>/scripts/validate-package.mjs
```

A target project's .agents/skills/atlas directory can be that destination when you intend local discovery. The export refuses existing destinations; it never deletes or overwrites an installed skill.

The allowlist includes instructions, references, tools, controlled fixtures, evaluations and dated research notes. It excludes demos, deployments, dependencies, caches, environment files, databases, maintenance evidence and third-party screenshot archives.

The legacy plugin.json is metadata only; no plugin installation is required for file-based use.

## Validate package changes

```sh
node Atlas-Skill/scripts/validate-package.mjs --report Atlas-Skill/maintenance/validation.json
```

This checks skill frontmatter, portable links, JSON and script syntax. It reports line counts as descriptive information, not as a quality score. Perform the [scenario review](evals/scenarios.md) and [critical review](references/critical-review.md) as well.

Verify export, file hashes, exclusion rules, overwrite protection and broken-link detection with:

```sh
node Atlas-Skill/scripts/verify-export.mjs --report Atlas-Skill/maintenance/export-verification.json
```

Tools use modern Node.js features including import.meta.dirname; this maintenance run uses Node.js 24.16.0. Browser tools additionally require Playwright and a compatible Chromium installation. No production dependency is added by the package.

The [maintenance review](evals/review-2026-11-13.md) records the actual instruction review and limitations. It is not an independent-model benchmark.

## Browser audit

From a project that can resolve Playwright, or with ATLAS_PLAYWRIGHT_PACKAGE pointing to a package.json that resolves it:

```sh
node Atlas-Skill/skills/atlas-checker/scripts/quick-check.mjs http://127.0.0.1:3000 --shots ./atlas-evidence
```

The audit is read-only by default. For a controlled page where menu/tab actions are appropriate:

```sh
node Atlas-Skill/skills/atlas-checker/scripts/quick-check.mjs http://127.0.0.1:3000 --shots ./atlas-evidence --click-test
```

--no-click-test remains supported. No controls executed means SKIPPED, not an interaction pass.

### Optional one-screen mobile hero check

Use exact unique selectors for the hero and its actual primary action:

```sh
node Atlas-Skill/skills/atlas-checker/scripts/quick-check.mjs http://127.0.0.1:3000 --shots ./atlas-evidence --hero "[data-hero]" --hero-action "[data-primary]" --fit-hero-under 420
```

This checks visible nonzero geometry, a 44px action height and viewport bounds at widths up to the given threshold. It does not force every website to have a one-screen hero. Open navigation, enlarged text and accessibility fallback need separate checks and may legitimately grow.

Default captures: 320x568, 375x667, 320x740, 360x800, 375x812, 390x844, 820x1180, 1366x768 and 1440x900. Short-view filenames use -short. Fold/full captures are included for selected viewports.

Set ATLAS_BROWSER_PATH for a specific installed Chromium. Otherwise the tool looks for common system browsers and then Playwright's managed browser. Missing tools are a verification gap.

## Checker regression tests

```sh
node Atlas-Skill/skills/atlas-checker/scripts/self-test.mjs --out <evidence-directory>
```

Controlled fixtures verify both acceptance and rejection: overflow, CSS Color 4 contrast, missing media/HTTP resources, hidden primary-action geometry, visible menu/tab state, usage errors and honest executed/skipped behavior.

These fixtures are test resources, not new product demos. Intentional failures belong to the bad fixture and must not be reported as a broken real website.

## Read-only reference capture

```sh
node Atlas-Skill/skills/atlas-research/scripts/capture-references.mjs --out <research-directory> --settle-ms 6000 https://example.com/
```

The tool records top desktop/mobile views and a desktop middle view without submitting forms or making consent choices. It cannot judge whether a screenshot is useful. Open images and record gates, incomplete rendering and actual observations yourself.

Use public URLs without credentials. Do not use private accounts or download an unbounded site archive.

## Limits and evidence honesty

DOM heuristics do not certify art direction, complete contrast compositing, accessibility conformance, every action, physical phones, non-Chromium browsers or field performance. A font declaration is not full glyph verification; a screenshot is not a Lighthouse score.

Package validation proves structural properties. Scenario review checks the reasoning in instructions. Controlled regressions check selected tool mechanics. Actual website quality still requires relevant content, browser work and demanding visual judgment.
