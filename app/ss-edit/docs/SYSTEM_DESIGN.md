# System design

This document preserves the design intent and constraints across multiple files or modules.
How the decisions got there is what `git log` is for.
What the editor does from the end-user's perspective is in [`UX_DESIGN.md`](UX_DESIGN.md).

## Rendering pipeline

The `<canvas>` painted by [`Painter`](../src/containers/EditorPane/Painter/index.tsx) is the single
source of truth for what the user sees.

[`EditMode`](../src/containers/EditorPane/EditMode/index.tsx),
[`SelectMode`](../src/containers/EditorPane/SelectMode/index.tsx) and
[`AddItemMode`](../src/containers/EditorPane/AddItemMode/index.tsx)
are transparent DOM overlays stacked on top of the canvas.

Every overlay lines up with the canvas through
[`CanvasLayer`](../src/containers/EditorPane/CanvasLayer/index.tsx),
which owns the offset/scale transform and exposes the scale as a `--scale` CSS variable.
Its children are laid out in canvas coordinates.
`Painter` applies the equivalent math to the 2D context on its own,
so `CanvasLayer` and `Painter` are the two places that must be kept in sync.

## Shared style for items

Every style and layout value an item is drawn at lives in
[`features/editorItem`](../src/features/editorItem/),
and every consumer reads it from there.
Rendering, editing, hit-testing and exporting all have to agree on the same numbers.

### Text layout invariants

A text item's style is a pure function of its layout,
and [`textStyleSizeOf` / `textStyleOf`](../src/features/editorItem/textStyle.ts) are where
that function lives.

[`splitLines`](../src/features/editorItem/textLayout.ts)
caches the lines it lays out under that derived style.
Every write to `width` or `fontSize` goes through
[`clampTextWidth` / `clampFontSize`](../src/features/editorItem/textStyle.ts),
which round as well as clamp because a fractional value would miss the cache on every frame of a
resize drag.

## Arrow geometry

An arrow is the one kind that carries a direction, and it is stored as one:
`offset` plus `length` plus `angle`,
where **`offset` is the tail point and not the top-left of a box**.
Every other kind's `offset` is a corner;
an arrow's lands on whichever corner its `angle` points away from.
`angle` is in radians with 0 pointing right and a positive turn going clockwise on screen,
which is what `ctx.rotate()` and CSS `rotate()` both take unconverted.

Two consequences pull in opposite directions, and both are load-bearing:

- [`measureItem`](../src/features/editorItem/measure.ts) builds the tail-to-tip
  [`Rect`](../src/utils/geometry/rect.ts) **first** and grows it by the padding afterwards.
  Padding the two points where they stand shrinks the box of an arrow pointing left or up,
  the tip being the head of the rect there rather than its tail.
- [`editorItemFromRange`](../src/features/editorItem/fromRange.ts) reads the drag **end to end**,
  never through that normalised rect.
  A `Rect` takes the min and the max of its two points and hence throws away
  which end the drag started from, which is the whole of what an arrow is.

[`ARROW_STYLE_SIZE`](../src/features/editorItem/arrowStyle.ts) is a plain constant where text
and rect have a `...StyleSizeOf()` function,
because nothing about an arrow's drawing is derived from its own fields —
there is no line width or font size to scale off.
Every value in it is a true on-screen dimension rather than a ratio of another,
so what is written there is what is drawn.

`padding` is how far the drawing spreads to either side of the tail-to-tip line,
and every hit-box and measurement of an arrow is sized from it rather than restating it.
In edit mode that band is also what keeps a click on the arrow from ending the edit.

## Action grouping

[`store/actions/`](../src/store/actions/) is split by the user-facing concern each action serves,
not by the slice of [`PageState`](../src/store/types.ts) it writes.
The slice axis does not hold here: the editor mode carries the `itemId` it acts on,
so a mode transition and an item mutation are often the same operation
([`addItem`](../src/store/actions/addItem.ts)'s commit pushes an item;
[`selection`](../src/store/actions/selection.ts)'s move rewrites the selection),
and every action updates the single [`state`](../src/store/atoms.ts) atom regardless.

One rule keeps the split decidable: the action that *enters* a mode belongs to that mode's file —
[`edit.enter`](../src/store/actions/edit.ts), `addItem.enter`, and `selection.clear`.
Operating within a mode belongs there too, so each file lines up with the containers that drive it.

An action that rewrites [`editorItems`](../src/store/atoms.ts) returns before touching it
when the result would be the same list:
[`hasUnsavedChanges`](../src/store/atoms.ts) compares the list *by reference* against
[`savedItems`](../src/store/atoms.ts), so rebuilding an identical one marks a saved picture as
unsaved.
