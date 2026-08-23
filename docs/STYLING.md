# Styling

Policy for how styling is organized across the repo.

## Build Pipeline

Styles go through Vite's built-in CSS pipeline (CSS Modules transform, etc.), which is PostCSS-based.
There's no standalone `postcss.config.*` in this repo.

## Methods and Situations

### CSS Modules

- **Default choice** for component-scoped styles.
- **Where**: colocated as `<name>.module.css` next to the component, imported as
  `styles`.

### Inline styles

- **Scope**: only when CSS Modules can't express it — a value computed at runtime from
  state, not a fixed set of variants a class can switch between.
- **Example**: `EditMode`/`SelectMode` in `app/ss-edit` compute canvas offset/scale
  dynamically to align transparent DOM overlays with the canvas underneath; those
  numeric values can't be pre-declared as module classes.

### Global styles

- Workspace is allowed to have its own global styles.
- Shared styles live in [`@~/ui`](../lib/ui/README.md).

## Conventions

### Variants

When classes share their chrome and differ only in placement or state, keep one base class and
nest each variant under it, never as a standalone class of its own. A standalone
`.rightResizeHandle` reads as complete when it only places an element some other class already
styled; nesting also keeps a variant from applying without its base.

What the nested selector matches on depends on what the element already carries.

- **An attribute the element has anyway** — a `data-*` the application exposes on purpose — is
  what to select on: `&[data-resize-handle="right"]`. The variant then cannot drift from the
  attribute, because there is only the attribute.
- **Otherwise** add an `.isSomething` modifier class and apply it together with the base through
  `clsx`. Do not invent a `data-*` just to style it; an attribute earns its place by being read
  from outside the stylesheet.
- **Example**: `.resizeHandle` with `&[data-resize-handle="right"]` /
  `&[data-resize-handle="bottom-right"]` in `app/ss-edit`'s `EditorPane/ResizeHandle`.
- **Note**: `composes:` says the same thing, but biome rejects it as non-standard CSS unless
  `css.parser.cssModules` is enabled in `biome.jsonc` — which it is not.

### Comments

Comments follow the same rules in CSS as they do in TypeScript, the form deciding the marker
rather than the language.

- **Block**: anything spanning more than one line is a single `/** */` block attached to the rule
  or the declaration it explains, never a run of `/* */` lines. Constraints inside it are tagged
  `@note`, one per constraint, so that what the rule *is* stays separate from what must not be
  broken.
- **Single line**: a plain `/* */`, with `NOTE:` where it flags a constraint — the counterpart of
  `// NOTE:` in TypeScript.
