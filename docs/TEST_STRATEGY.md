# Test Strategy

Policy for which testing tool to reach for and how far to test with it.
For commands and detailed conventions, follow the links in each section.

Priority order is as follows.

1. vitest
1. storybook + chromatic
1. playwright (e2e)

Cheapest and fastest first.
Reach for a more expensive tool only when a cheaper one can't catch the class of bug.

## vitest

- **Scope**: pure functions and hooks — logic that doesn't depend on rendering or
  visual output. Example: `editorItem`'s `paddingOf` / `lineHeightOf` /
  `letterSpacingOf` layout calculations (see `app/ss-edit/docs/SYSTEM_DESIGN.md`).
- **How far**: cover the logic's edge cases. Don't use it to assert on rendering or
  appearance — jsdom doesn't lay out real pixels.
- **Where**: `__tests__/<name>.test.ts{,x}`.

## storybook + chromatic

- **Scope**: how a component looks and renders in isolation, across its meaningfully
  distinct states.
- **How far**: one story per state worth catching a visual regression on. Don't use it to assert on
  behavior that spans multiple components — that's playwright's job.
- **Where**: `*.stories.tsx` colocated with the component.

## playwright (e2e)

- **Scope**: user flows that cross multiple components or state, and invariants only
  observable end-to-end — e.g. that a sequence of view operations leaves the exported
  image byte-for-byte identical (`happyPath.e2e.ts`).
- **How far**: add a test here only for the class of bug vitest/storybook can't catch:
  pointer/drag interactions, real-browser rendering, or drift between independently
  computed layout math across modules.
- **Where and how**: see [`e2e/README.md`](../e2e/README.md) for the full conventions.
