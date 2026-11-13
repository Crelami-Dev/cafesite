# Interaction that earns its place

Interactivity should help someone understand, choose, navigate, complete or recover. It should not exist merely to make the page appear alive.

## Decide whether interaction is needed

State the user question and the information affected. Ask whether a direct explanation or visible list would solve it more simply.

Good candidates include relevant product variation, genuine filtering, a useful comparison, progressive disclosure of optional detail, or a calculation based on real rules.

Poor candidates include fake counters, decorative sliders, tabs hiding a short paragraph, and a simulated tool whose output ignores inputs.

The best idea may be to remove a control.

## Write an interaction contract

For each significant interaction record:

| Item | Required answer |
|---|---|
| Intention | What is the visitor trying to achieve? |
| Trigger | Click, keyboard, input, navigation or another real event |
| Input | Actual values and constraints |
| State | Which state changes, and who owns it? |
| Result | What observable content or operation changes? |
| Feedback | How is the result perceived visually and nonvisually? |
| Recovery | Undo, edit, retry, close or reset as appropriate |
| Failure | Empty, invalid, unavailable or async failure |
| Persistence | Local, URL, session or server; only where needed |
| Verification | Exact expected outcome and edge case |

Do not add irrelevant states to simple controls.

## Choose native semantics

- Anchor: navigate to a real route, section, file or external destination.
- Button: change local state or submit a form.
- Details/summary: simple optional disclosure.
- Select/radio: choosing among known options.
- Checkbox: independent choice.
- Range: a bounded numeric value with an accessible value presentation.
- Dialog: a genuinely modal task, with complete lifecycle behavior.

Do not recreate these with divs unless the native form cannot meet an actual requirement.

## Selection and filters

Use stable IDs and derived content. Selected styling, accessible state and downstream data must agree.

Use aria-pressed for appropriate toggle/filter buttons. Tabs need linked panels, selected state, roving tabindex and expected keyboard navigation; use them only when the content is genuinely a tabbed interface.

Keep the result near the control, especially on mobile. Consider scrolling only when it helps and never unexpectedly steals focus.

Show meaningful empty results and a way to change/reset the selection.

## Navigation and disclosure

A mobile disclosure can remain in document flow. It needs an accessible trigger, expanded state, controlled region, Escape and focus return where applicable.

A modal drawer needs focus entry and containment, background inertness, closing mechanisms and scroll/focus restoration. Do not claim modal behavior when only visibility changes.

Close navigation after choosing a destination. Preserve meaningful anchor offsets for sticky headers.

Do not hide desktop links on mobile without an equivalent route to them.

## Forms

Labels identify purpose; placeholders only provide examples. Explain required formats and limits before failure.

Use appropriate input types, autocomplete and keyboard hints. Preserve entered content on errors. Associate custom errors with their fields, focus useful error context and announce meaningful status.

Avoid disabling an action without explaining how to enable it. Native validation can be enough for a small local form.

For real submission: pending state, duplicate prevention, timeout/error recovery and truthful confirmation are part of completion.

For a demonstration: explain that no request is sent before the user submits. Do not display “sent”, “booked” or “paid” for local-only state.

## Async and rapid interaction

Test repeated clicks, changing selection during loading, back navigation and stale responses.

Use cancellation or result identity where a previous request could overwrite new state. Do not leave loading indefinitely if an operation fails.

Feedback should appear promptly; animation must not delay correctness.

## Useful feedback and motion

A small visual change can connect trigger and result. Use motion to explain relationships, not to distract from them.

Do not rely on color, animation, sound or hover alone. Respect reduced motion and avoid shifting a focused target under the pointer.

A live region should announce a concise state change, not repeatedly read the entire page.

## Progressive enhancement

Essential reading and navigation should remain available when reasonable without client animation. Interactive functions that truly require JS should fail honestly and explain the limit.

Do not promise full no-JS functionality for an application whose core operation depends on client execution. State which reading, navigation and fallback flows actually work.

## Interaction idea backlog

Capture ideas as: user need, proposed behavior, benefit, smallest implementation, cost, risks and accept/defer/reject decision.

A new idea is valuable when it fits this project. No fixed quota of sliders, diagrams, counters or moments is required.

## Verification

Exercise the full path, not only aria-selected:

- Correct visible result and dependent data.
- Keyboard operation and focus.
- Empty/invalid/error recovery.
- Repeated actions and interruption.
- Mobile control-to-result proximity.
- Reduced motion.
- Actual external/server effect only when authorized.

An element must be visible and actionable before a geometry assertion can prove it fits a screen. A hidden navigation link with a zero-size box is not the primary CTA.
