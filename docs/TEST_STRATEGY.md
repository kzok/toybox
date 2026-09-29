# Test strategy

This document defines which testing tool to use and how far to test with it.
For commands and detailed conventions, follow the links in each section.

Use the tools in this order of priority:

1. Vitest
1. Storybook + Chromatic
1. Playwright (e2e)

Use the cheapest and fastest tool first.
Use a more expensive tool only when a cheaper tool cannot catch that class of bug.

## Vitest

- **Scope**
  - Logic that doesn't depend on rendering or visual output: pure functions and hooks.
- **How far**
  - Cover the edge cases that can actually happen in the logic.
  - Don't use it to assert on rendering or appearance, because jsdom doesn't lay out real pixels.
- **Where**
  - Put the test next to the production code as `__tests__/<name>.test.ts{,x}`.

## Storybook + Chromatic

- **Scope**
  - How a component looks and renders in isolation, across its meaningfully distinct states.
- **How far**
  - Write one story for each state where a visual regression matters.
  - Don't assert on behavior that spans multiple components.
    Use Playwright for that.
- **Where**
  - Put the story next to the component as `*.stories.tsx`.

## Playwright (e2e)

- **Scope**
  - User flows that cross component or state boundaries,
    and invariants that only an end-to-end test can observe.
- **How far**
  - Add a test here only for a class of bug that Vitest and Storybook cannot catch.
    Examples: pointer and drag interactions, rendering in a real browser,
    or a mismatch between layout calculations that different modules compute separately.
- **Where and how**
  - See [`e2e/README.md`](../e2e/README.md) for the full conventions.
