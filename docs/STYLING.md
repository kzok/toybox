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

### Variants

When classes share their chrome and differ only in placement or state, keep one base class and
nest each variant under it as an `.isSomething` modifier, applied together through `clsx`. A
standalone `.rightResizeHandle` reads as complete on its own when it only places an element some
other class already styled; nesting also keeps the modifier from applying without its base.

- **Example**: `.resizeHandle` with `&.isRight` / `&.isBottomRight` in `app/ss-edit`'s
  `EditMode`.
- **Note**: `composes:` says the same thing, but biome rejects it as non-standard CSS unless
  `css.parser.cssModules` is enabled in `biome.jsonc` — which it is not.

## Inline styles

- **Scope**: only when CSS Modules can't express it — a value computed at runtime from
  state, not a fixed set of variants a class can switch between.
- **Example**: `EditMode`/`SelectMode` in `app/ss-edit` compute canvas offset/scale
  dynamically to align transparent DOM overlays with the canvas underneath; those
  numeric values can't be pre-declared as module classes.

## Global styles

- Workspace is allowed to have its own global styles.
- Shared styles live in [`@~/ui`](../lib/ui/README.md).
