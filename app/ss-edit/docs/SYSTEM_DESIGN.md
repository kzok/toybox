# System design

How the editor is put together and the constraints that hold it together in terms of the system design.
What the editor does from the end-user's perspective is in [`UX_DESIGN.md`](UX_DESIGN.md).

## Rendering pipeline

The `<canvas>` painted by `Painter` (`src/containers/EditorPane/Painter`) is the single
source of truth for what the user sees — on every animation frame it draws each item
via `renderer/`. The canvas itself has `pointer-events: none`.

`EditMode` and `SelectMode` (`src/containers/EditorPane/{EditMode,SelectMode}`) are
transparent DOM overlays stacked on top of the canvas, not independent visual layers:

- `EditMode` renders a `<textarea>` per item being edited, with `color: transparent` —
  only the caret/selection are visible; the glyphs themselves are painted on the canvas
  underneath. It also places the `ResizeHandle`s (`src/containers/EditorPane/ResizeHandle`): one
  on the bottom right corner, resizing the item as a whole, and — on a text item — one on the
  middle of the right edge, resizing the width alone so that the text re-wraps at the same font
  size. A handle sizes itself against `--scale`, hence it only belongs inside a `CanvasLayer`.
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

## Text layout invariants

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

## Action grouping

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

An action that rewrites `editorItems` returns before touching it when the result would be the
same list: `hasUnsavedChanges` compares the list *by reference* against `savedItems`, so
rebuilding an identical one marks a saved picture as unsaved (see `selection.deleteSelected`).

## Wheel input

A trackpad pinch never arrives as a gesture of its own: Chrome synthesises it into a stream of
`wheel` events carrying `ctrlKey`, which is the same shape a ctrl+wheel from a mouse has. Nothing
on the event says which device produced it, so `useWheelEvent.ts`
(`src/containers/EditorPane/hooks`) goes by the one thing that separates them — the magnitude of
`deltaY`, which is 0.5-3 for a pinch against 100 or so for a wheel notch. The threshold sits in
the empty space between the two and deliberately nearer the notch end: reading a pinch as a notch
jumps 30% in a single event and wrecks the gesture, while reading a notch as a pinch only makes it
weak, so anything ambiguous falls to the pinch branch.

The 100% snap is keyed on a step *crossing* 100% rather than on landing near it. A window around
100% only works while every step is larger than the window — a pinch step is two orders of
magnitude smaller than one, so a window makes 100% a scale the trackpad can never leave again.
`__tests__/useWheelEvent.test.ts` is what holds that down.

Snapping belongs to the wheel and not to `view.zoom`, hence it lives here rather than in
`store/actions/view.ts`: the footer's zoom levels go through the same action and must land on
exactly what was picked.

## Hotkeys

Every hotkey is registered in `AppHotkeyRegistry` (`src/app/index.tsx`), so that which keys are
taken can be read off a single component. They go through `@tanstack/react-hotkeys`, whose
manager listens on `document`.

Three of its defaults decide how a hotkey behaves, and the first of them is easy to break from
the outside:

- `ignoreInputs` is resolved per hotkey: a bare key or a Shift/Alt combination is suppressed
  while an input-like element holds the focus, while a Ctrl/Meta combination and `Escape` fire
  regardless. That is what leaves `Delete` to the `<textarea>` of edit mode instead of deleting
  the item, and what lets `Mod+S` save from inside it. **Nothing may stop `keydown` on its way to
  `document`**: a `stopPropagation()` in a React handler ends the native propagation at the root
  container, the manager never sees the key, and every hotkey goes silently dead for as long as
  that element holds the focus — `preventDefault` along with them, so the browser takes the key
  back.
- `preventDefault` and `stopPropagation` are both on, which is what keeps `Mod+S` from opening
  the browser's own save dialog.
- `event.repeat` is not looked at, so an action that must not run once per auto-repeat asks for
  `requireReset: true` (`Mod+S` does). It is armed again as soon as any of its keys goes up —
  unless it is disabled at that moment, in which case that release is dropped and the next press
  is swallowed.

A dialog is modal, hence every hotkey carries `enabled: !isDialogOpen` and stays out while one is
open. A new hotkey shares that flag.

`e2e/ss-edit/hotkeys.e2e.ts` is what holds all of this down: none of it fails to type-check when
broken, and three of the four constraints above are invisible until a key is actually pressed in
a real browser.
