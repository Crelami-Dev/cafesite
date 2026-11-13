---
name: atlas-lean-code
description: "Implement frontend designs with the simplest robust approach: native semantics and CSS, typed content, existing tools, narrow state boundaries, complete interaction behavior, resilient motion and measured performance."
---

# Atlas Lean Code - simpler means less burden, not less quality

Choose the easiest reliable implementation that achieves the intended visual and behavioral result. Do not trade accessibility, responsiveness or error handling for fewer lines.

## 1. Inspect before introducing structure

Read the existing routes, components, tokens, data models, dependency list, scripts and installed framework documentation.

Determine what already solves the problem. Use local icons, spacing conventions and controls when appropriate. If an existing abstraction is unsuitable, explain the specific gap before replacing it.

Do not add infrastructure for hypothetical future features.

## 2. Use the implementation ladder

Prefer the earliest option that fully meets the need:

1. Semantic HTML and browser behavior.
2. CSS layout, responsive rules and transitions.
3. Small local state or an existing project utility.
4. A focused shared component/helper where repetition or ownership justifies it.
5. An existing library already in the project.
6. A new dependency or service only with a clear capability, lifecycle and cost reason.

A one-off native disclosure can outperform a custom accordion engine. A native range input can outperform a new slider package. A small dataset can be filtered without a global store.

## 3. Keep data and rendering separate

Represent content in the project's typed data modules. Keep prices, labels, item definitions and business configuration out of large rendering expressions.

Use stable identifiers. Do not use array positions as state identity when items can change order. Make types describe actual states rather than a collection of loosely related booleans.

Keep pages as composition. Extract meaningful responsibilities; do not create one-file-per-wrapper abstractions merely to look modular.

## 4. Let CSS own geometry

Prefer grid, flexbox, gap, minmax, clamp, aspect-ratio and appropriate queries.

Use min-width:0 on shrinkable children and wrapping for genuinely long content. Handle wide tables/code in a clearly indicated local scroll region.

Avoid resize listeners, viewport state and repeated DOM measurement for layouts CSS can express. Do not hide document overflow to disguise a broken component.

Use a height strategy appropriate to the content. A requested screen-sized scene can use a small-viewport minimum height; it still needs to grow for large text or open navigation.

## 5. Preserve semantic behavior

- Links navigate; buttons change state or submit.
- Controls have labels and meaningful accessible names.
- Use headings for document structure, not type size.
- Use one meaningful main and H1 with appropriately named sections.
- Reserve image geometry and use correct alt semantics.
- Avoid nested interactive elements and clickable divs where a native control works.
- Preserve browser back, link opening and text selection.

Native semantics are part of robustness, not optional polish.

## 6. Implement complete state, locally

Use [interaction-design](../../references/interaction-design.md) for state contracts.

Keep state at the lowest owner that needs it. Derive values rather than storing duplicates. Shared state is appropriate when several components truly coordinate, not because every project needs a provider.

Handle initial, active, empty, pending, error and completion states where they can occur. Do not implement impossible states just to fill a checklist.

Selection must update all dependent content. Forms must not pretend a backend exists. Real async actions need duplicate prevention, error recovery and honest completion.

## 7. Define event and async ownership

Clean up listeners, observers, timers and animation handles.

Guard against stale asynchronous results when input or component ownership changes. Use an abort signal or request identity where needed; do not apply old results to a new selection.

Do not perform side effects during render. Keep effects for synchronization that actually needs them.

For reversible local interactions, prefer straightforward handlers over a new state-machine library. A complex workflow may justify a state model; document why.

## 8. Respect framework boundaries

In Next.js, keep static content in Server Components by default and isolate client state/effects in interactive leaves. Read installed documentation for the actual version.

Use the project's image/font tools and metadata APIs. Static export changes image/runtime capabilities; choose a supported loader or preoptimized local assets deliberately.

Do not expose server secrets or move protected data into client props. Do not create an API route for content that can render statically.

In other frameworks, apply the same ownership principle rather than translating Next.js conventions blindly.

## 9. Use tokens without building a framework

Centralize meaningful colors, typography roles, spacing, geometry and surfaces using the project's existing system.

Avoid arbitrary values scattered through unrelated files. A composition-specific value can be appropriate; name or document it when it has recurring meaning.

Do not generate a design-system package for one page. A handful of tokens and clear components often provides the needed consistency.

## 10. Make motion resilient

CSS transitions suit small state feedback. Use an existing animation tool for justified choreography; anime.js is not compulsory.

Scope selectors, keep handles, cancel/revert on cleanup, and respect reduced motion. Restore only animation-owned properties. Never erase an authored transform as generic “cleanup”.

Content starts visible. Loading failure, fast scrolling, interrupted navigation or disabled JS must not leave essential content hidden.

See [motion](../../references/motion.md) for a complete lifecycle review.

## 11. Optimize what users encounter

Use [engineering-and-performance](../../references/engineering-and-performance.md):

- Appropriate source dimensions and modern image formats.
- Correct responsive sizes and reserved geometry.
- Eager/preloaded likely LCP media, lazy secondary media.
- Necessary font subsets/weights and stable fallbacks.
- Minimal unnecessary hydration and third-party scripts.
- No expensive loop, layout thrash or large dependency for a small effect.

Measure where performance claims matter. Do not assert zero CLS or a Lighthouse score without collecting it.

## 12. Choose meaningful verification

Run relevant type, lint, build and behavior checks. Use tests for actual logic, risky transitions, edge cases or tool reliability.

Do not create dozens of assertions that merely repeat the JSX or tests for trivial copy changes. Do not make a narrow test support a broad claim.

For browser changes, inspect actual states and screenshots. Unit tests cannot prove media crops, type wraps or a useful mobile composition.

## 13. Make a simplification pass

After the behavior works, ask:

- Can native behavior replace this custom code?
- Is any state duplicated or derived?
- Is this wrapper/helper actually useful?
- Is a dependency doing less than a small local function?
- Is the abstraction harder to read than the concrete code?
- Does client JavaScript exist only for a cosmetic detail?
- Can the same result use fewer moving parts without losing behavior?

Compare capability and maintenance, not only line count. Keep a more complex approach when it provides a necessary, demonstrated benefit.

Record important simplifications in the decision log.

## 14. Finish cleanly

Remove unused imports, dead styles, debug output, abandoned code and accidental files. Preserve existing user work and keep unrelated scope untouched.

Document commands, content ownership, asset sources, required configuration and known limits. Do not include environment files, secrets, local databases, build caches or dependencies in a portable skill package.

A polished result includes code that another person can change without reverse-engineering a decorative architecture.
