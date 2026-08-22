# @~/app-ss-edit

An image editor specialized for editing screenshots.

## Folder structure

- `src/app/`
  - The application root component. Entry point of the application.
- `src/containers/`
  - React components wired to application state managements.
- `src/components/`
  - Presentational React components.
- `src/features/editorItem/`
  - The item data model (`EditorItem` union of `Image`/`Text`), the shared text style
    values, and text layout/measurement. No canvas code lives here.
- `src/features/renderer/`
  - Canvas drawing and image export. Consumes `editorItem`'s data and style values to
    paint pixels; this is where visuals are actually produced.
- `src/hooks/`
  - React hooks shared across the application.
- `src/store/`
  - Jotai-based application state management.
- `src/utils/`
  - Framework-agnostic helpers depending on no other folder.

## System design

### Rendering pipeline

The `<canvas>` painted by `Painter` (`src/containers/EditorPane/Painter`) is the single
source of truth for what the user sees — on every animation frame it draws each item
via `renderer/`. The canvas itself has `pointer-events: none`.

`EditMode` and `SelectMode` (`src/containers/EditorPane/{EditMode,SelectMode}`) are
transparent DOM overlays stacked on top of the canvas, not independent visual layers:

- `EditMode` renders a `<textarea>` per item being edited, with `color: transparent` —
  only the caret/selection are visible; the glyphs themselves are painted on the canvas
  underneath. It also carries the resize handles: one on the bottom right corner, resizing the
  item as a whole, and — on a text item — one on the middle of the right edge, resizing the
  width alone so that the text re-wraps at the same font size.
- `SelectMode` renders a `<span>` per item as a selection/drag hit-target, also
  `color: transparent`, showing only hover/selected chrome. The hit-targets are
  presentational and pointer-only on purpose.

Every overlay lines up with the canvas through `CanvasLayer`
(`src/containers/EditorPane/CanvasLayer`), which owns the offset/scale transform and
exposes the scale as a `--scale` CSS variable; its children are laid out in canvas
coordinates. `Painter` applies the equivalent math to the 2D context on its own, so
`CanvasLayer` and `Painter` are the two places that must be kept in sync — if they, or
the style values below, drift apart, the overlays' hit-boxes and cursor position
visually desync from what's drawn.

### Text layout invariants

`features/editorItem` exports `textStyleSizeOf` (padding/lineHeight/letterSpacing as
numbers) and `textStyleOf` (the same values as a CSS style object), both pure functions
of a text item's layout (`width`, `fontSize`, `content`). Four independent consumers
must call these same functions (not recompute inline) for text to render, edit, and
hit-test consistently:

1. the canvas draw in `renderer/`.
1. `EditMode`'s edit-mode textarea styling.
1. `SelectMode`'s select-mode hit-target styling for text items.
1. `editorItem`'s own text layout/line-breaking measurement.

Losing track of this (e.g. a consumer recomputing padding/lineHeight/letterSpacing
inline instead of calling `textStyleSizeOf`/`textStyleOf`) is exactly the kind of change
that causes silent visual drift — clipped text, misaligned hit/hover boxes — without any
type error to catch it.

`width` and `fontSize` are the two inputs those functions are derived from, and hence the two
`splitLines` keys its line cache on. Every write to either goes through `clampTextWidth` /
`clampFontSize` (`features/editorItem`), which round as well as clamp: a fractional value would
miss the cache on every frame of a resize drag.

### Action grouping

`store/actions/` is split by the user-facing concern each action serves — `view`,
`selection`, `edit`, `addItem`, `picture` — not by the slice of `PageState` it writes.
The slice axis does not hold here: the editor mode carries the `itemId` it acts on, so a
mode transition and an item mutation are often the same operation (`addItem`'s commit
pushes an item; `selection`'s move rewrites the selection), and every action updates the
single `state` atom regardless.

One rule keeps the split decidable: the action that *enters* a mode belongs to that
mode's file — `edit.enter`, `addItem.enter`, and `selection.clear`, which returns to the
default empty selection. Operating within a mode belongs there too, so each file lines up
with the containers that drive it: the three mode overlays under `EditorPane`, the view
controls in `EditorPane`/`Footer`, and the menus in `Header`.
