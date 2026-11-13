---
name: atlas-research
description: "Research current live design references for the project's actual subject, inspect desktop/mobile evidence, compare approaches, and turn observations into original actionable design decisions without cloning trends."
---

# Atlas Research - investigate before adopting

Current design research is part of a fresh visual concept or substantial redesign. The objective is better judgment, not a moodboard full of fashionable screenshots.

## Inputs and output

Read the brief and content inventory. Identify what is being designed, for whom, their primary action, the available evidence and the project's constraints.

Produce a research ledger using [research-template](../../references/research-template.md). Use the findings to revise the brief. If the findings change nothing, explain why; do not conduct decorative research just to satisfy a gate.

## 1. Define research questions

Choose questions that can change a decision:

- What evidence makes a visitor trust this type of business?
- Should the first screen establish a place, show a product, answer a practical question or demonstrate a workflow?
- How much information does a visitor need before acting?
- What navigation and filtering model fits the content volume?
- How does the page recompose on a short phone rather than merely shrink?
- What typography serves the real language and length of the copy?
- Which interaction genuinely reduces uncertainty or effort?
- Where do current references feel excessive, slow or generic?

Do not begin with “find trendy websites” as the only question.

## 2. Search current sources

For a substantial new direction, seek roughly three to five usable references:

- At least two close to the domain, audience or business task.
- A useful comparator with a different approach to the same problem.
- An adjacent discipline when it contributes a reasoned idea, such as a museum programme for event navigation or a material catalogue for furniture specifications.

These are research coverage goals, not a requirement to add more features or copy a three-source layout. A small change may need only the relevant current reference. A complex multi-route brief may need more.

Use the actual language, region and audience where relevant. A local cafe's needs are not automatically those of an international resort. Check accessible real business sites, smaller credible examples and practical competitors, not only award galleries.

## 3. Use discovery sites appropriately

Awards, directories and agency portfolios can identify leads. They do not prove that a website is usable, fast, accessible, current, or suitable for this business.

Follow leads to the actual site. Verify the URL and what it currently shows. A gallery thumbnail is not a mobile inspection. A screenshot concept may not represent a working product. A winning effect may depend on a team, budget or asset pipeline this project does not have.

Reject SEO trend lists that merely repeat aesthetics without evidence. Avoid treating a sponsor placement or award score as a design requirement.

## 4. Establish evidence quality

For every retained source record:

- Exact URL and page, not only a brand name.
- Date actually inspected and any page publication/update date that is available.
- Domain and visitor task.
- Evidence: browser screenshot, direct interaction observation, extracted content, supplied image, or secondary description.
- Desktop/mobile states actually inspected.
- Concrete observation and its relevance.
- Principle to adapt, behavior to avoid, and implementation cost.
- Missing evidence, barriers, regional variants or unresolved uncertainty.

“Visited on 2026-11-13” does not mean “a 2026 redesign”. Do not invent launch dates, awards, measured performance or unseen motion.

## 5. Inspect live pages

When browser capture is available:

- Use a fresh anonymous context; avoid private accounts and personal data.
- Inspect the first screen, at least one meaningful content section, and navigation/interaction states relevant to the question.
- Compare desktop and mobile on at least two useful references for a new direction.
- Open the resulting screenshots yourself before making visual observations.
- Record cookie banners, consent gates, geolocation, bot challenges, loading failures, empty states or broken media.
- Do not hide these barriers and then claim the untouched site was successfully inspected.
- Do not submit forms, purchases, bookings, newsletter requests or external messages as research.
- Do not download an entire site or scrape an unbounded archive.

The optional [capture tool](scripts/capture-references.mjs) saves public desktop/mobile snapshots and a report. It does not certify a reference's design or capture every state. Runtime notes and blank/gated screenshots remain limitations, not passes.

## 6. Analyse mechanisms, not surface adjectives

For each source examine:

| Dimension | Useful question |
|---|---|
| Content hierarchy | What becomes clear first, and what waits? |
| Composition | Why does this arrangement belong to the subject? |
| Typography | How do type roles, measure and wrapping guide reading? |
| Media | Is it atmosphere, evidence, object detail or instruction? |
| Interaction | What uncertainty or work does the behavior remove? |
| Mobile | What is reordered, omitted, recropped or simplified? |
| Trust | What concrete evidence supports claims? |
| Restraint | What has deliberately been left out? |
| Trade-off | What would not transfer to this project? |

Avoid notes such as “premium”, “clean”, “bold” or “beautiful animation” without a mechanism.

## 7. Synthesize an original direction

Use [composition-selection](../../references/composition-selection.md):

1. Generate multiple genuinely different arrangements from the brief and research.
2. Combine principles at the level of information, sequence or behavior; do not stitch together recognizable copied sections.
3. Choose one coherent direction and explain why it fits.
4. Reject relevant alternatives with reasons.
5. State which reference ideas will not be used.
6. Identify one useful interaction opportunity and whether it is worth implementing.
7. Identify a cheaper implementation with the same user benefit.

The result should sound like this project's concept, not “Linear hero + Aman image + Pentagram footer”.

## 8. Keep ideas fresh without chasing novelty

Use [idea-development](../../references/idea-development.md) to turn observations into different problem-solving options. Begin with a visitor tension, not an effect to decorate the page with.

Maintain a small idea backlog: observation, user value, adaptation, cost and reason to accept/defer/reject. Revisit it during critique.

Freshness comes from new combinations of relevant evidence and problems, not compulsory 3D, shaders, custom cursors, motion, unconventional navigation or a new font each time.

Check current browser support and framework documentation before selecting a new feature. Use progressive enhancement and a credible fallback. Do not add an experimental API because it is new.

## 9. Refresh and stop responsibly

Refresh research at the start of each new design task and when the domain, content, direction or evidence changes. Old studies remain useful historical examples, not proof of today's state.

If a source cannot be inspected, find a comparable alternative. If browsing as a whole is unavailable, record the gap and use supplied evidence without claiming fresh research. Continue independent work where authorized.

Stop collecting when the important decisions have enough diverse evidence. More screenshots without better decisions are not progress.

## Handoff

The brief must now identify the chosen visual thesis, source-backed principles, rejected transfers, asset needs, type direction, useful interaction and remaining uncertainty. The design module owns translating this into a coherent system.
