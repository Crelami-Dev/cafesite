# Accessibility and behavior field guide

Use this during planning and the finish gate. It is a practical review guide, not a claim of certification.

## Navigation and focus

- The skip link must reveal on keyboard focus and land at the main content.
- DOM order must follow reading order. Do not use CSS ordering to create a contradictory keyboard path.
- Every interactive item needs an accessible name and visible focus. Outline colors must work on both light and dark bands.
- A simple expanding navigation can remain non-modal in normal document flow. It needs a named trigger, aria-expanded, aria-controls, Escape handling and focus return.
- A modal drawer needs focus entry, a contained Tab cycle, Escape, background inertness, scroll restoration and trigger focus return. Do not claim a disclosure is a modal merely because it overlays content.
- Hidden panels must not retain keyboard-focusable descendants in the accessibility tree. Use hidden or inert appropriately, not opacity alone.

## Content and semantics

- Use headings to express a meaningful outline, not to choose font sizes.
- Give meaningful images concrete alt text without duplicating adjacent captions. Empty alt marks decoration.
- Tables need headers and a caption or accessible name. Narrow layouts can scroll inside a clearly indicated table region.
- Icon-only actions need names. Decorative arrows, stars and line art should not interrupt speech.
- Do not put nested links/buttons inside clickable cards.
- Dates, time zones, prices and units must be unambiguous for the audience.

## Forms and state

- Label every control; placeholders are examples, not labels.
- Associate help and errors with aria-describedby where native validation is insufficient.
- Announce meaningful completion/error messages politely; do not put the entire dynamic page inside aria-live.
- Preserve input on errors. Async submission should prevent duplicates, expose pending state and allow retry.
- Demo forms must explain what happens before submission. “Saved” or “Sent” must reflect a real operation.
- Selection state must be expressed programmatically and visually beyond color alone.

## Reflow and targets

- Check 320 CSS pixels and 200% zoom. Avoid fixed-width inputs, nonwrapping headings and wide paired CTAs.
- Aim for 44×44px primary touch controls, with adequate spacing for secondary targets.
- Do not disable browser zoom. Avoid a fixed bottom element that obscures focused controls or the last content.
- Long names, translations and error messages must expand naturally.

## Motion and resilience

- Respect prefers-reduced-motion in CSS and JS. A reduced-motion user sees all content immediately.
- No essential information depends on hover, animation timing or drag alone.
- Disable JS and verify static reading/navigation still works. Explicitly explain interactive features requiring JS.
- Check fast scroll, resized viewport and back navigation; animations should not leave stale hidden/transformed state.

## Evidence wording

Say “keyboard navigation and Escape checked in Chromium” when that is what was done. Do not replace it with “fully accessible”. Screen-reader verification, Safari, real phone testing and contrast on photographs are separate evidence items.
