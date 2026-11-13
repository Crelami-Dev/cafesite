# Engineering and performance decisions

Use this alongside the host project's conventions and current framework documentation.

## The simplicity comparison

Compare implementation options by capability, failure modes, accessibility, runtime bytes, dependencies, maintenance and verification effort.

Do not choose more code merely because it seems sophisticated. Do not choose less code when it omits required behavior.

A useful decision log entry states: “Native details meets the disclosure need and keyboard behavior; a custom accordion adds state and event ownership without a required capability.”

## Keep the runtime small

- Static content should not require a client bundle without a reason.
- Put interactivity in narrow owners.
- Derive values instead of duplicating state.
- Reuse project primitives and installed tools.
- Avoid global stores for local selection.
- Avoid repeated viewport measurement where CSS suffices.
- Load expensive optional features only when appropriate.
- Do not load analytics or third-party widgets without a product need.

## Images

Choose a source resolution appropriate to rendered size and device pixel ratio; do not upscale weak originals and call them crisp.

Use explicit dimensions/aspect ratio, accurate responsive sizes and modern formats supported by the delivery pipeline.

Prioritize likely LCP media. Lazy-load secondary imagery. Do not mark every image priority or put the hero behind a client-only fetch unnecessarily.

Review actual payloads and crop behavior. A small file is not a success if the subject is illegible.

## Fonts

Load only necessary families, subsets and weights. Use stable fallback metrics and test the loading state.

Do not preload many optional weights and compete with the main visual asset. Avoid client-only font loading that shifts the first screen.

## Motion and rendering work

Prefer transform/opacity for small visual transitions when appropriate. Avoid layout reads interleaved with writes, continuous offscreen work and listeners that fire without cleanup.

A CSS animation is not automatically cheap; a complex filter, large blur or paint-heavy scene still needs measurement.

Pause/cancel optional continuous work when it is not visible and respect reduced motion.

## Performance evidence

Core Web Vitals distinguish loading, responsiveness and visual stability. Current guidance is maintained in [web.dev's Web Vitals documentation](https://web.dev/articles/vitals).

When reporting targets, distinguish them from results. Lab tests are not field measurements. A screenshot or quick DOM audit does not produce LCP, INP, CLS or a Lighthouse score.

If performance is in scope:

1. Test an actual production build.
2. Record device/network/test conditions and route.
3. Inspect media, fonts, JS and failed requests.
4. Measure the relevant loading, interaction and stability behavior.
5. Identify the largest real cost.
6. Make the simplest high-value change and remeasure.
7. Report limitations and variability.

Do not invent a numerical improvement from a code change alone.

## Build and delivery

Run commands that exist in the project. Avoid installing a new test framework for a small reversible edit unless it solves an actual verification need.

Keep environment files, tokens, local databases, node_modules and build caches out of portable artifacts. Never move secrets to public configuration.

Deployment is a separate action governed by the user's existing authorization and actual task scope. Skill-only work does not justify a website deployment.

## Finish questions

- Does this component have more ownership/state than the task needs?
- Can a dependency be removed without losing capability?
- Is the design asset pipeline more expensive than its visible benefit?
- Are errors and fallbacks complete?
- Can another developer find and change the content easily?
- Does verification cover the claimed result?
