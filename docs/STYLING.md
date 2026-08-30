# CSS Styling

Policy for how CSS styling is organized across the repo.

## Build Pipeline

Styles go through Vite's built-in CSS pipeline
(CSS Modules transform, etc.), which is PostCSS-based.
There's no standalone `postcss.config.*` in this repo.

## Methods and Situations

### CSS Modules

Default choice for component-scoped styles.
Colocated as `<name>.module.css` next to the component, imported as `styles`.

### Inline styles

Use inline styles only when CSS Modules can't express it: a value computed at runtime from state,
not a fixed set of variants a class can switch between.

### Global styles

Each workspace is allowed to have its own global styles.
Styles shared among apps live in [`@~/ui`](../lib/ui/README.md).

## Conventions

### Variants

When classes share their chrome and differ only in placement or state,
keep one base class and nest each variant under it, never as a standalone class of its own.

What the nested selector matches on depends on what the element already carries.

1. Use an attribute the element has.
  A `data-*` the application exposes on purpose is what to select on.
  The variant then cannot drift from the attribute, because there is only the attribute.
2. Use an `.isSomething` modifier class if there is no suitable attribute.

### Comments

Comments follow the same rules in CSS as they do in TypeScript,
the form deciding the marker rather than the language.

- **Single line**: a plain `/* */`, with `NOTE:` where it flags a constraint.
- **Block**: `/** */` for anything spanning more than one line, just like JSDoc,
  never a run of `/* */` lines.
  Tag each constraint inside it with `@note`, one per constraint.
