---
name: atlas
description: "Research, art-direct, implement, and critically review distinctive frontend experiences. Use for landing pages, company and product websites, responsive UI, redesigns, interaction design, typography, or screenshot-driven polish. Atlas adapts to the project's subject, researches current live references, prefers simple robust code, and requires evidence-based iteration."
---

# Atlas - research, compose, build, challenge, refine

Create a useful website whose structure belongs to its subject. A compiling page, fashionable styling, or a long checklist is not the outcome. The outcome is an appropriate, working experience supported by inspected visual and functional evidence.

## Scope and authority

- The user's instructions and repository rules outrank Atlas defaults.
- Read the actual project, content, assets, framework version, and constraints before choosing a visual direction.
- Use Atlas alone when requested. Do not invoke other design skills, FigCraft, Figma, plugins, agents, or parallel workers merely because examples mention them.
- If asked to improve the skill only, edit the instruction package and its own verification resources; do not change demos, websites, or deployments.
- Never expand a landing page into authentication, booking, payments, a CMS, or a database without authorization.
- Preserve the established brand unless the task authorizes changing it.

## Workflow and module map

| Phase | Read | Produce |
|---|---|---|
| Understand | [atlas-plan](skills/atlas-plan/SKILL.md) | Scope, visitor job, evidence inventory, constraints |
| Investigate | [atlas-research](skills/atlas-research/SKILL.md) | Current references, observations, adaptation/rejection notes |
| Decide | [atlas-design](skills/atlas-design/SKILL.md) | Subject-specific composition, type, media, visual system |
| Challenge | [atlas-anti-slop](skills/atlas-anti-slop/SKILL.md) | Reasons the direction is appropriate and not borrowed decoration |
| Implement | [atlas-lean-code](skills/atlas-lean-code/SKILL.md) | Simple, typed, accessible UI and meaningful interaction |
| Verify and improve | [atlas-checker](skills/atlas-checker/SKILL.md) | Technical results, opened screenshots, critique and revision evidence |

Read the planning, research, design, anti-slop, and lean-code modules before a fresh build. Read the checker before deciding verification scope. For a narrowly scoped fix, read the affected modules and preserve the broader design decisions; do not repeat an entire discovery project for a one-line correction.

## Working artifacts

Use the templates as living records, not approval paperwork:

- [Brief](references/brief-template.md): audience, content, constraints, chosen direction and test plan.
- [Research ledger](references/research-template.md): URLs, current inspection date, evidence level, useful principles and rejected ideas.
- [Review](references/review-template.md): actual observations, prioritized hypotheses, changes and recheck results.
- [Decision log](references/decision-log-template.md): important choices and their reasons, including simplification.

In an existing project, extend equivalent documents instead of creating duplicates. Keep notes concise enough to use, but detailed enough for another developer to reproduce a decision. Do not fill headings with empty adjectives.

## Research contract

For new visual concepts and substantial redesigns, inspect current live references matched to the actual subject. Search during the task; do not treat a remembered favorite or the package's dated study as fresh research.

Investigate multiple relevant approaches, not a single site to clone. Separate directly observed facts from interpretation. Distinguish “viewed today” from “launched this year”. Check technical possibilities against current primary documentation and the project's installed version.

If browsing is unavailable, record the limitation, use supplied evidence, and continue useful authorized work. Never invent reference observations or describe a screenshot you have not opened.

## Design contract

- Explain the offer, establish a credible subject, and make the primary action understandable.
- Choose the composition from how visitors evaluate this business: place, object, tool, programme, work, evidence, or service.
- Do not default to a split hero, full-screen photograph, bento grid, terminal, numbered benefits, serif editorial style, or rounded card system.
- Do not mistake a new font or radius for a new concept.
- Use visual references as principles to adapt; do not copy a brand's copy, assets, signature arrangement, or identity.
- Set typography from real text, reading distance, x-height, available space and viewport height.
- Choose geometry from the visual system, not simplistic associations such as “soft furniture means rounded UI”.
- Preserve content clarity and accessibility while pursuing originality.
- A deliberate static page can be stronger than irrelevant interactivity.

Use [composition selection](references/composition-selection.md), [typography](references/typography.md), [domain reasoning](references/domain-reasoning.md), and [interaction design](references/interaction-design.md) as needed.

## Implementation contract

Use the easiest robust implementation that achieves the intended result. Native semantics, CSS layout, existing framework tools and narrow state usually beat extra libraries or infrastructure. Simplicity is not unfinished behavior: keyboard support, errors, responsiveness and lifecycle cleanup are part of the job.

Prefer the project's animation tool when choreography helps. Anime.js is an option, not a compulsory dependency. Use [motion](references/motion.md), [accessibility](references/accessibility-and-behavior.md), and [engineering/performance](references/engineering-and-performance.md) for implementation details.

## Critical review stance

Use [idea development](references/idea-development.md) to generate useful options from evidence, content relationships, visitor decisions and constraints. Maintain an accept/defer/reject backlog; do not implement novelty without value.

Treat the first result, and every claim of completion, as unproven.

After each candidate, ask what still looks borrowed, oversized, weak, confusing, unnecessarily complex or poorly suited to the subject. Identify the highest-value improvement that could make it better; do not accept “already good” or a green audit as an answer.

For substantial work, make both a first critique and a fresh adversarial review after revisions. Continue when a concrete improvement is likely to improve the result. Compare before and after; retain or revert based on evidence.

This demanding attitude must not become performative endless tweaking. If no evidence-backed improvement remains, state the remaining trade-offs and why further change is speculative or harmful. Never invent a defect just to record another round.

## Finish contract

Completion requires evidence for the actual scope:

1. Current reference research or an explicit research limitation.
2. A coherent, subject-specific design with tested type and media.
3. Working primary and secondary actions and required states.
4. Relevant build/type/lint checks with truthful exits.
5. Actual desktop, tablet and narrow-phone browser inspection, including height-sensitive cases.
6. Opened screenshots and documented critique/revision/recheck.
7. A simplification pass over the implementation.
8. A fresh completion audit against the user's original requirements.
9. Explicit limitations for untested devices, browsers, assistive technologies, field performance or unavailable assets.

Keep final proof. Do not delete the only screenshots. Deliver the URL or run command, key changes, verification results and useful evidence links. Deploy only within existing authorization and only when website changes are in scope.

## Supporting package material

[Current research study](research/2026-11-13/README.md) demonstrates the research process; it is dated, not a permanent trend list. [Scenario evaluations](evals/scenarios.md) test whether these instructions generalize across domains. Run [package validation](scripts/validate-package.mjs) after modifying Atlas, then perform a substantive review rather than assuming structural validation proves quality.
