# CSS styling

This document defines how the repo organizes CSS styling.

## Build pipeline

Styles use the built-in CSS pipeline of Vite, which is based on PostCSS.
This pipeline includes transforms such as CSS Modules.
This repo has no standalone `postcss.config.*`.

## Methods and situations

### CSS Modules

Use CSS Modules by default for component-scoped styles.
Put the file next to the component as `<name>.module.css`, and import it as `styles`.

### Inline styles

Use inline styles only for a value computed at runtime from state.
CSS Modules cannot express such a value.
For a fixed set of variants, switch classes instead.

### Global styles

Each workspace can have its own global styles.
Put styles that apps share in [`@~/ui`](../lib/ui/README.md).

## Conventions

### Variants

Sometimes classes share their visual style and differ only in placement or state.
Then keep one base class, and nest each variant under it.
Never write a variant as a standalone class.

The nested selector depends on what the element already has:

1. Use an attribute that the element has.
  Select on a `data-*` attribute that the application exposes on purpose.
  Then the variant always matches the attribute, because the attribute is the only state.
2. If there is no suitable attribute, use an `.isSomething` modifier class.
