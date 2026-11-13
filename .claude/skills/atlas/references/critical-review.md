# A demanding review that produces better work

The reviewer is not the author's advocate. Treat every candidate as capable of improvement and require evidence before accepting it.

## Review roles

Use these perspectives yourself; they do not require spawning agents:

- Visitor: Can I understand, decide and act?
- Art director: Does the form belong to this subject?
- Typographer: Is the text carefully composed and readable?
- Interaction designer: Are cause, state, feedback and recovery clear?
- Engineer: Is this the simplest robust implementation?
- Skeptic: What unsupported claim or untested assumption remains?

A review is stronger when these perspectives disagree productively.

## Round one: diagnose

For each significant observation record:

1. Evidence and exact location.
2. What is wrong or uncertain.
3. Why it affects the visitor or the subject.
4. Probable cause.
5. A proposed change.
6. Expected improvement and possible downside.
7. Verification needed.

Prioritize actual usability, clarity and subject fit before tiny optical adjustments.

## Use improvement hypotheses

Write “At 375px the selector and result are separated by 500px of unrelated copy; move the copy below the result so the state change is immediately visible.”

Do not write “make it more polished” or “add creativity”. Those cannot be tested.

When the issue is structural, propose a structural correction. A radius change cannot resolve an interchangeable narrative.

## Round two: reassess without defending the work

After revision, open fresh screenshots and reread the original requirement before reading your previous justification.

Ask:

- What is still too generic?
- What looks good only because I know how it was built?
- Which element steals attention from the actual job?
- What did I shrink, hide or remove merely to pass a check?
- Is the page now a different template rather than a better answer?
- Is typography still weak after the layout correction?
- What simple implementation could produce the same result?
- What is the strongest remaining objection?

Record a genuine finding or a reasoned trade-off. Do not invent a problem just to claim a second round.

## Improvement priority

Consider impact, confidence and effort together.

A high-confidence fix to a clipped action outranks a speculative animation. A moderate structural change can outrank many small visual tweaks if it restores the subject.

Prefer reversible comparisons. Keep before/after proof. If a hypothesis fails, revert it and record what was learned.

## Guard against self-satisfaction

Do not stop because:

- The build passed.
- No console errors appeared.
- The page resembles an award winner.
- A generated score says 9/10.
- Considerable time or code has already been spent.
- The designer personally likes the chosen typeface.

Evidence should show what is working and what limits remain.

## Guard against performative dissatisfaction

Always seek a better option; do not change the page arbitrarily to demonstrate that search.

A proposed change must have a plausible benefit tied to this brief. More unusual, animated, spacious, rounded or minimal is not automatically better.

When remaining ideas are speculative, defer them with a reason. A maintenance backlog is more honest than claiming perfection or endlessly changing a working result.

## Review the code with the same rigor

Inspect whether state, abstractions, dependencies and effects have clear owners and real benefits.

Ask whether native HTML, CSS or existing project code could replace custom machinery. Check cleanup, async interruption and accessibility before calling simplification complete.

Do not confuse fewer lines with better code. Preserve the interaction contract.

## Completion challenge

Before final delivery, try to disprove completion requirement by requirement.

If evidence is missing, collect it. If a test only proves a nearby condition, narrow the claim or broaden verification. If a screenshot was never opened, it was never visually reviewed.

Finish when the scoped requirements are proven and no known material defect remains, while acknowledging that future content, research or user feedback may reveal another improvement.
