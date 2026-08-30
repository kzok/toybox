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

- **Scope**
  - Logic that doesn't depend on rendering or visual output: pure functions and hooks.
- **How far**
  - Cover the logic's edge cases that can actually happen.
  - Don't use it to assert on rendering or appearance because jsdom doesn't lay out real pixels.
- **Where**
  - Colocate as `__tests__/<name>.test.ts{,x}` with the target production code.

## storybook + chromatic

- **Scope**
  - How a component looks and renders in isolation, across its meaningfully distinct states.
- **How far**
  - One story per state worth catching a visual regression on.
  - Don't assert on behavior spanning multiple components — that's playwright's job.
- **Where**
  - Colocate as `*.stories.tsx` with the component.

## playwright (e2e)

- **Scope**
  - User flows that cross component or state boundaries,
    and invariants only observable end-to-end.
- **How far**
  - Add a test here only for the class of bug vitest/storybook can't catch.
    For example, pointer/drag interactions, real-browser rendering,
    or drift between independently computed layout math across modules.
- **Where and how**
  - See [`e2e/README.md`](../e2e/README.md) for the full conventions.
