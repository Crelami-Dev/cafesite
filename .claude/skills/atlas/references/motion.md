# Motion that clarifies and survives interruption

Motion is a means of explaining change, hierarchy or continuity. It is not a mandatory count of effects.

## Establish the purpose

For every effect, name the trigger, affected content, user benefit, duration, easing, final state, reduced-motion behavior and cleanup owner.

If the purpose is only “make it feel alive”, try a static or simpler alternative first.

## Choose the smallest appropriate tool

- CSS transition for simple hover/focus or state feedback.
- Native browser behavior for disclosure and scrolling where sufficient.
- The project's existing animation tool for coordinated sequences.
- A new library only when a required capability justifies it.

Anime.js can be useful where installed; Atlas does not require it on every page. Check the actual version's API before using remembered examples.

## Visibility contract

Essential content is visible before enhancement. Do not hide the whole page in server-rendered CSS while waiting for a library, font, fetch or observer.

An entrance can start from a small offset and partial opacity. The final static layout must remain meaningful without the effect.

Do not move a focused control away from the pointer or delay an action until its animation ends.

## Lifecycle ownership

Keep handles for animations, observers, listeners and timers. Cancel or revert them when the owning component is removed or replaced.

When a user rapidly changes selection, end or replace the previous effect predictably. Do not accumulate timelines or restore stale content.

Restore only properties owned by the animation. Generic removal of all transforms or opacity can erase legitimate authored styles.

## Reduced motion and continuous effects

Skip unnecessary choreography when reduced motion is requested, and render a complete final state.

Persistent effects should respond to preference changes, visibility and lifecycle as appropriate. Avoid continual offscreen work or animation that competes with reading.

Do not use a reduced-motion setting as a reason to remove essential state feedback. Provide a clear static change.

## Scroll effects

Scroll reveals are optional. If justified:

- Arm only after enhancement is ready.
- Avoid hiding content already in view.
- Reveal once where appropriate.
- Handle direct anchors, fast scrolling and missed observer thresholds.
- Fail open when support or loading fails.
- Never require a secret scroll ritual before a screenshot or a visitor can see content.

Avoid scroll traps and pinned sequences unless the task genuinely benefits and accessible alternatives exist.

## Example lifecycle principle

In a React client leaf using an already installed compatible anime.js version:

```tsx
useEffect(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!root.current) return;
  const animation = animate(root.current.querySelectorAll('[data-enter]'), {
    opacity: [0.8, 1],
    y: [10, 0],
    duration: 480,
    delay: stagger(50),
    ease: 'outQuart',
  });
  return () => animation.revert();
}, []);
```

The snippet assumes valid imports, a component-owned ref and supported installed APIs. It illustrates ownership, not a required Atlas entrance.

## Verification

Check default motion, reduced motion, disabled JS where relevant, rapid repeated actions, interrupted navigation and viewport changes.

Watch for stale hidden content, layout shifts, moved focus, duplicated animation work and delayed correctness. Do not claim zero CLS or smooth performance without measuring the relevant behavior.
