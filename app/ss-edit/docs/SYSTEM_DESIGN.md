# System design

How the editor is put together and the constraints
that hold it together in terms of the system design.
How the decisions got there is what `git log` is for.
What the editor does from the end-user's perspective is in [`UX_DESIGN.md`](UX_DESIGN.md).

## Rendering pipeline

The `<canvas>` painted by `Painter` (`src/containers/EditorPane/Painter`) is the single source of
truth for what the user sees — on every animation frame it draws each item via `renderer/`.
The canvas itself has `pointer-events: none`.

`EditMode`, `SelectMode` and `AddItemMode`
(`src/containers/EditorPane/{EditMode,SelectMode,AddItemMode}`) are transparent DOM overlays stacked
on top of the canvas, not independent visual layers:

- `EditMode` renders a `<textarea>` per item being edited, with `color: transparent` —
  only the caret/selection are visible; the glyphs themselves are painted on the canvas underneath.
  It also places the handles from `src/containers/EditorPane/ResizeHandle`:
  `ResizeHandle` sits on an edge or a corner of the item's box —
  the bottom right one resizes the item as a whole,
  and a text item gets a second on the middle of the right edge,
  resizing the width alone so that the text re-wraps at the same font size.
  `ResizePointHandle` sits on an arbitrary point instead, for an arrow's two ends,
  which are not corners of anything.
  A handle sizes itself against `--scale`, hence it only belongs inside a `CanvasLayer`.
- `SelectMode` renders a `<span>` per item as a selection/drag hit-target,
  also `color: transparent`, showing only hover/selected chrome.
  The hit-targets are presentational and pointer-only on purpose.
- `AddItemMode` captures the drag that defines a new item and outlines where it will land.
  The item being dragged out is painted by `Painter` like any other, from `addItemPreview` —
  see "Action grouping" for why it stays out of `editorItems`.

Every overlay lines up with the canvas through `CanvasLayer`
(`src/containers/EditorPane/CanvasLayer`), which owns the offset/scale transform and exposes the
scale as a `--scale` CSS variable; its children are laid out in canvas coordinates.
`Painter` applies the equivalent math to the 2D context on its own,
so `CanvasLayer` and `Painter` are the two places that must be kept in sync — if they,
or the style values below, drift apart,
the overlays' hit-boxes and cursor position visually desync from what's drawn.

## Shared style values

Every style and layout value an item is drawn at lives in `features/editorItem`,
and every consumer reads it from there rather than recomputing or restating it.
Rendering, editing, hit-testing and exporting all have to agree on the same numbers.

Nothing type-checks this.
A consumer that recomputes a padding or a line height inline still compiles,
and the damage shows up as silent visual drift — clipped text,
hit-boxes sitting off the pixels they belong to.

## Text layout invariants

A text item's style is a pure function of its layout — `width`, `fontSize` and `content` —
and `textStyleSizeOf` / `textStyleOf` (`features/editorItem`) are where that function lives.

Of those three inputs, `width` and `fontSize` are the ones the geometry follows,
and hence the two `splitLines` keys its line cache on.
Every write to either goes through `clampTextWidth` / `clampFontSize` (`features/editorItem`),
which round as well as clamp: a fractional value would miss the cache on every frame of a resize
drag.

## Arrow geometry

An arrow is the one kind that carries a direction, and it is stored as one:
`offset` plus `length` plus `angle`,
where **`offset` is the tail point and not the top-left of a box**.
Every other kind's `offset` is a corner;
an arrow's lands on whichever corner its `angle` points away from.
`angle` is in radians with 0 pointing right and a positive turn going clockwise on screen,
which is what `Math.atan2`, `Math.cos`/`Math.sin`,
`ctx.rotate()` and CSS `rotate()` all take unconverted.

Two consequences pull in opposite directions, and both are load-bearing:

- `measureItem` builds the tail-to-tip `Rect` **first** and grows it by the padding afterwards.
  Padding the two points where they stand shrinks the box of an arrow pointing left or up,
  the tip being the head of the rect there rather than its tail.
- `editorItemFromRange` reads the drag **end to end**, never through that normalised rect.
  A `Rect` takes the min and the max of its two points and hence throws away
  which end the drag started from, which is the whole of what an arrow is.

`ARROW_STYLE_SIZE` (`features/editorItem`) is a plain constant where text
and rect have a `...StyleSizeOf()` function,
because nothing about an arrow's drawing is derived from its own fields —
there is no line width or font size to scale off.
Every value in it is a true on-screen dimension rather than a ratio of another,
so what is written there is what is drawn; only `outlineWidth` and `padding` are derived.

`padding` is how far the drawing spreads either side of the tail-to-tip line,
and every hit-box and measurement of an arrow is sized from it rather than restating it.
In edit mode that band is also what keeps a click on the arrow from ending the edit.

## Action grouping

`store/actions/` is split by the user-facing concern each action serves — `view`, `selection`,
`edit`, `addItem`, `picture` — not by the slice of `PageState` it writes.
The slice axis does not hold here: the editor mode carries the `itemId` it acts on,
so a mode transition and an item mutation are often the same operation
(`addItem`'s commit pushes an item; `selection`'s move rewrites the selection),
and every action updates the single `state` atom regardless.

One rule keeps the split decidable: the action that *enters* a mode belongs to that mode's file —
`edit.enter`, `addItem.enter`, and `selection.clear`, which returns to the default empty selection.
Operating within a mode belongs there too, so each file lines up with the containers that drive it:
the three mode overlays under `EditorPane`, the view controls in `EditorPane`/`Footer`,
and the menus in `Header`.

An action that rewrites `editorItems` returns before touching it
when the result would be the same list:
`hasUnsavedChanges` compares the list *by reference* against `savedItems`,
so rebuilding an identical one marks a saved picture as unsaved (see `selection.deleteSelected`).

The same comparison is why the item being dragged out in add-item mode never joins that list.
It is a derived atom (`addItemPreview`) built from the mode's own range and drawn after the items:
pushing it in and taking it out again would mark a saved picture unsaved on every drag,
and `measurePicture` would stretch the exported image to wherever the pointer had wandered.
`editorItemFromRange` (`features/editorItem`) is the only place a dragged range becomes an item,
so the preview and what `addItem.commit` adds cannot say different things —
`commit` keeps only the mode transition, which is the part that is its own concern.

## Wheel input

A trackpad pinch never arrives as a gesture of its own:
Chrome synthesises it into a stream of `wheel` events carrying `ctrlKey`,
which is the same shape a ctrl+wheel from a mouse has.
Nothing on the event says which device produced it,
so `useWheelEvent.ts` (`src/containers/EditorPane/hooks`) goes by the one thing
that separates them — the magnitude of `deltaY`,
which is 0.5-3 for a pinch against 100 or so for a wheel notch.
The threshold sits well above the pinch range rather than midway between the two:
reading a pinch as a notch jumps 30% in a single event and wrecks the gesture,
while reading a notch as a pinch only makes it weak,
so anything ambiguous falls to the pinch branch.

A zoom step that crosses 100% stops there, that being the ratio a screenshot is read at.
The snap is keyed on the crossing rather than on landing near it.
A window around 100% only works while every step is larger than the window —
a pinch step is two orders of magnitude smaller than one,
so a window makes 100% a scale the trackpad can never leave again.
`src/containers/EditorPane/hooks/__tests__/useWheelEvent.test.ts` is what holds that down.

Snapping belongs to the wheel and not to `view.zoom`,
hence it lives here rather than in `store/actions/view.ts`:
the footer's zoom levels go through the same action and must land on exactly what was picked.

## Hotkeys

Every hotkey is registered in `AppHotkeyRegistry` (`src/app/index.tsx`),
so that which keys are taken can be read off a single component.
They go through `@tanstack/react-hotkeys`, whose manager listens on `document`.

Its defaults decide how a hotkey behaves,
and `ignoreInputs` is the one easy to break from the outside:

- `ignoreInputs` is resolved per hotkey:
  a bare key or a Shift/Alt combination is suppressed while an input-like element holds the focus,
  while a Ctrl/Meta combination and `Escape` fire regardless.
  That is what leaves `Delete` to the `<textarea>` of edit mode instead of deleting the item,
  and what lets `Mod+S` save from inside it.
  **Nothing may stop `keydown` on its way to `document`**:
  a `stopPropagation()` in a React handler ends the native propagation at the root container,
  the manager never sees the key,
  and every hotkey goes silently dead for as long as that element holds the focus —
  `preventDefault` along with them, so the browser takes the key back.
- `preventDefault` and `stopPropagation` are both on, which is what keeps `Mod+S` from opening
  the browser's own save dialog.
- `event.repeat` is not looked at,
  so an action that must not run once per auto-repeat asks for `requireReset: true` (`Mod+S` does).
  It is armed again as soon as any of its keys goes up — unless it is disabled at that moment,
  in which case that release is dropped and the next press is swallowed.

A dialog is modal, hence every hotkey carries `enabled: !isDialogOpen` and stays out
while one is open.
A new hotkey shares that flag.

The repo-level `e2e/ss-edit/hotkeys.e2e.ts` is what holds all of this down:
none of it fails to type-check when broken,
and most of it is invisible until a key is actually pressed in a real browser.
