# Atlas instruction evaluations

These are review scenarios for the skill package, not a benchmark proving how every future model will behave. Evaluate the actual instructions against each prompt and record evidence, contradictions and revisions.

## Evaluation method

1. Read a scenario without assuming the current package passes.
2. Describe the decisions Atlas should produce.
3. Locate instructions that support them.
4. Look for another rule that could cause the wrong behavior.
5. Mark supported, contradicted, incomplete or unknown.
6. Revise the package when a failure is found.
7. Repeat a fresh review after revisions.

Structural validators and line counts do not replace this review.

## Scenarios

| ID | Prompt/context | Expected behavior | Failure indicators |
|---|---|---|---|
| S01 | Local cafe with actual interior photos but missing menu/prices | Research relevant places; prioritize real atmosphere and practical visit information; mark missing facts honestly | Fake prices, reviews, hours, booking system or SaaS charts |
| S02 | Furniture studio says prior design feels like AI templates | Compare different room/object/material narratives; choose from actual assets; reconsider structure rather than radius alone | Automatically add rounded cards, 01/02/03 lists, a full-screen image or the same split hero |
| S03 | Developer tool with a real input/output operation | Show credible product behavior, useful constraints and an honest demo boundary | Fake metrics, decorative terminal, arbitrary diagram or unrelated output |
| S04 | Museum programme with dates, categories and long artist names | Programme-first hierarchy, readable taxonomy and useful accessible navigation/filtering | Essential dates hidden in experimental motion or tiny labels |
| S05 | Staff dashboard with dense operational work | Appropriate density, stable controls, permissions/error states in authorized scope | Landing-page whitespace, giant H1 and decorative cards applied to a work interface |
| S06 | Clinic service page with supplied credentials | Clear factual visit/service info; no invented medical claims or patient stories | Guarantees, fabricated credentials or visual mood replacing evidence |
| S07 | User requests faithful implementation of a supplied reference | Respect fidelity and existing authorization; document actual limitations | Forcing originality, palette replacement or unnecessary research detour against the brief |
| S08 | One clipped button in an established site | Targeted inspection/fix/check; preserve the design system | Entire discovery project, new dependency, new hero or unrelated redesign |
| S09 | Browsing unavailable | Record limitation and source evidence level; continue independent authorized work | Fabricated “latest” references, screenshots or launch dates |
| S10 | User asks to improve Atlas only | Change package resources and test fixtures; preserve demos and deployments | New demo or production deployment used as a substitute for improving instructions |
| S11 | Long Indonesian headings and multilingual content | Test actual language, glyphs, natural wrapping, fallbacks and reflow | Font-fashion pairing, clipped type or forced breaks from an English specimen |
| S12 | Reviewer wants better work despite passing build | First critique, evidence-backed revision and fresh adversarial review | “Build passes so done”, empty aesthetic score or endless arbitrary changes |
| S13 | Mobile hero explicitly must fit 100vh | Measure whole scene and actual visible action on short phones, allowing accessibility growth | Hidden link's zero bounds accepted, clipped copy or measuring only a desktop screenshot |
| S14 | Reference page returns HTTP 200 but shows a gate/blank content | Record partial/incomplete evidence and seek another source where needed | Calling it a successful visual inspection |
| S15 | Small disclosure proposed with a component library | Compare native semantics and existing tools first | Dependency/engine added without a required capability |
| S16 | Interactive selector changes ARIA but not content | Verify visible panel and dependent result, not only attributes | Attribute change counted as a complete interaction pass |
| S17 | No applicable controls in automated smoke test | Report SKIPPED with zero checks | A vacuous PASS treated as evidence of functioning controls |
| S18 | New visual trend uses an experimental browser API | Check current primary docs/support and provide fallback; adopt only if useful | Add it just because it is new or claim support from memory |

## Evidence expectations

For a package-maintenance review, the written result should cite modules and supporting guides and explicitly label the assessment as a human/agent instruction review. Do not claim these are independent-model execution results.

For future website evaluations, the same scenarios can be turned into concrete briefs with actual content, browser observations and user outcomes. That is a separate exercise, not required for a skill-only update.

## Tool regressions

The checker self-test uses controlled mechanical fixtures to prove a narrower set of behaviors: good/bad audit outcomes, modern CSS contrast, overflow, broken resources, visible action geometry, visible menu/tab state and usage errors.

Package validation verifies syntax/frontmatter/links/portability. Export verification checks the allowlisted files, not semantic quality.
