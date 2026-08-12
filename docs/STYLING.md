# Styling

Policy for how styling is organized across the repo.
For detailed conventions, follow the links in each section.

## Build Pipeline

Styles go through Vite's built-in CSS pipeline (CSS Modules transform, etc.), which is PostCSS-based.
There's no standalone `postcss.config.*` in this repo.

## CSS Modules

- **Default choice** for component-scoped styles.
- **Where**: colocated as `<name>.module.css` next to the component, imported as
  `styles`.

## Inline styles

- **Scope**: only when CSS Modules can't express it — a value computed at runtime from
  state, not a fixed set of variants a class can switch between.
- **Example**: `EditMode`/`SelectMode` in `app/ss-edit` compute canvas offset/scale
  dynamically to align transparent DOM overlays with the canvas underneath; those
  numeric values can't be pre-declared as module classes.

## Global styles

- Workspace is allowed to have its own global styles.
- Shared styles live in [`@~/ui`](../lib/ui/README.md).
