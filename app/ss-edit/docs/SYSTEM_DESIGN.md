# System design

This document preserves the design intent and the constraints that span multiple files or modules.
For how the decisions came about, see `git log`.
For what the editor does from the end user's view, see [`UX_DESIGN.md`](UX_DESIGN.md).

## Rendering pipeline

The `<canvas>` painted by [`Painter`](../src/containers/EditorPane/Painter/index.tsx) is the single
source of truth for what the user sees.

[`EditMode`](../src/containers/EditorPane/EditMode/index.tsx),
[`SelectMode`](../src/containers/EditorPane/SelectMode/index.tsx) and
[`AddItemMode`](../src/containers/EditorPane/AddItemMode/index.tsx)
are transparent DOM overlays stacked on top of the canvas.

Every overlay aligns with the canvas through
[`CanvasLayer`](../src/containers/EditorPane/CanvasLayer/index.tsx).
`CanvasLayer` owns the offset/scale transform.
It exposes the scale as the `--scale` CSS variable.
Its children use canvas coordinates.
`Painter` applies the same transform to the 2D context separately.
So `CanvasLayer` and `Painter` are the two places that you must keep in sync.

## Shared style for items

Every style and layout value for drawing an item is in
[`features/editorItem`](../src/features/editorItem/).
Every consumer reads the values from there.
Rendering, editing, hit-testing and exporting must all use the same numbers.

### Text layout invariants

A text item's style is a pure function of its layout.
[`textStyleSizeOf` / `textStyleOf`](../src/features/editorItem/textStyle.ts) implement that
function.

[`splitLines`](../src/features/editorItem/textLayout.ts)
caches its lines and uses that derived style in the cache key.
Every write to `width` or `fontSize` uses
[`clampTextWidth` / `clampFontSize`](../src/features/editorItem/textStyle.ts).
These functions clamp the value.
They also round it because a fractional value would miss the cache on every frame of a resize drag.

## Arrow geometry

An arrow is the only item kind that has a direction.
Its data stores it as a direction: `offset`, `length` and `angle`.
**`offset` is the tail point, not the top-left of a box.**
For every other kind, `offset` is a corner.
An arrow's `offset` is at the corner that its `angle` points away from.
`angle` is in radians.
0 points right, and a positive angle turns clockwise on screen.
`ctx.rotate()` and CSS `rotate()` both take this value without conversion.

This has two consequences.
Both are essential:

- [`measureItem`](../src/features/editorItem/measure.ts) rotates the corners of the outline around
  the tail.
  Then it takes the rect that the corners span.
  So it never assumes that the tail is the top-left.
- [`editorItemFromRange`](../src/features/editorItem/fromRange.ts) reads the drag
  as its **start point and end point**,
  never through the [`Rect`](../src/utils/geometry/rect.ts) that the drag spans.
  A `Rect` keeps only the min and the max of its two points.
  So it loses which end the drag started from, and that is exactly what defines an arrow.

The `padding` of [`arrowStyleSizeOf`](../src/features/editorItem/arrowStyle.ts) is the half-width of
the band where an arrow is hit-tested.
Every hit-box of an arrow takes its size from this value and does not repeat the number.
In edit mode, this band also stops a click on the arrow from ending the edit.

The export measures the picture from the white outline instead.
This keeps the margin of the picture as tight as the drawing.
The measurement ignores the shadow, so the edge of the picture can cut off the shadow.

## Action grouping

[`store/actions/`](../src/store/actions/) groups actions by the user-facing concern
that each action serves.
It does not group them by the slice of [`PageState`](../src/store/types.ts) that they write.
Grouping by slice does not work here, for two reasons:

- The editor mode holds the `itemId` that it acts on.
  So a mode transition and an item mutation are often the same operation.
  For example, the commit in [`addItem`](../src/store/actions/addItem.ts) pushes an item,
  and the move in [`selection`](../src/store/actions/selection.ts) rewrites the selection.
- Every action updates the single [`state`](../src/store/atoms.ts) atom anyway.

One rule makes the place of each action clear:
the action that *enters* a mode belongs in the file of that mode.
Examples: [`edit.enter`](../src/store/actions/edit.ts), `addItem.enter` and `selection.clear`.
An action that operates within a mode also belongs in that file.
So each file matches the containers that call its actions.

An action that rewrites [`editorItems`](../src/store/atoms.ts) returns without writing it
if the result is the same list. [`hasUnsavedChanges`](../src/store/atoms.ts) compares the list with
[`savedItems`](../src/store/atoms.ts) *by reference*.
Without the return, a rebuilt but identical list would mark a saved picture as unsaved.
