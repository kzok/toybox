# @~/app-ss-edit

An image editor specialized for editing screenshots.

## Folder structure

- `src/app/`
  - The application root component. Entry point of the application.
- `src/containers/`
  - React components wired to application state managements.
- `src/components/`
  - Presentational React components.
- `src/features/`
  - `editorItem/`: the item data model (`EditorItem` union of `Image`/`Text`), the
    shared text style values, and text layout/measurement. No canvas code lives here.
  - `renderer/`: canvas drawing and image export. Consumes `editorItem`'s data and
    style values to paint pixels; this is where visuals are actually produced.
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
  underneath.
- `SelectMode` renders a `<button>` per item as a selection/drag hit-target, also
  `color: transparent`, showing only hover/selected chrome.

Both overlays and `Painter` independently apply the same offset/scale math to line up
with the canvas. If that math or the style values below drift between them, the
overlays' hit-boxes and cursor position visually desync from what's drawn.

### Text layout invariants

`features/editorItem` exports `paddingOf`, `lineHeightOf`, and `letterSpacingOf`, pure
functions of `fontSize`. Four independent consumers must call these same functions (not
recompute inline) for text to render, edit, and hit-test consistently:

1. the canvas draw in `renderer/`.
1. `EditMode`'s edit-mode textarea styling.
1. `SelectMode`'s select-mode hit-target styling for text items.
1. `editorItem`'s own text layout/line-breaking measurement.

One deliberate exception: the text-size measurement used for the edit textarea's
content-box height is *unpadded*, while the bounding rect used for canvas-space layout
adds padding on top. Losing track of this split (e.g. adding padding handling to one but
not the other) is exactly the kind of change that causes silent visual drift — clipped
exports, misaligned hit/hover boxes — without any type error to catch it.
