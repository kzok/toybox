# UX design

This document holds this app's UX design decisions and their reasons.
How the decisions got there is what `git log` is for.
How any of it is built is in [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md).

## The picture

The picture has no canvas of its own to fill: items are placed on an unbounded transparent plane,
which the pane shows as a checkerboard. There is nothing to set up before dropping the first
screenshot in, and no document size to keep the items inside of.

The exported PNG is cropped to the bounding box of the items, so the picture *is* whatever the
items happen to cover. Panning and zooming never change it.

## Adding an image

Either "Edit" → "Add image", or dropping a file anywhere in the window. While files are dragged
over the window an overlay says so, because the drop target is the whole window rather than the
pane and there would otherwise be nothing to aim at.

A dropped payload contributes its **first image file** and nothing else. Dropping a folder or a
mixed selection is not an error worth a dialog — the user gets the one image and can tell that
the rest did not arrive.

The image lands at its natural size, centred on the pane. It is placed relative to the view
rather than to the picture, so it arrives where the user is looking rather than somewhere off
screen.

## Adding text

"Edit" → "Add text" arms the editor, and the text is then given the box it should fill by
dragging it out. The dragged height sets the font size (the height is one line box), the dragged
width sets the wrapping width. Sizing the text by drawing it is the point: a screenshot annotation
is placed against what is underneath it, not against a font size in a toolbar.

New text is drawn in bold pink (`#EF3171`) with a white outline and a black shadow. Screenshots
are arbitrary — light UI, dark terminals, photos — and a plain fill would disappear into some of
them. The outline is what makes one colour work everywhere.

A text item is dropped when its content is left blank, on whichever way the edit ends. An item
nobody can see is not something to leave behind for the user to hunt down later.

## Adding a rectangle

"Edit" → "Add rectangle" arms the editor as "Add text" does, and the box is then dragged out. The
drag leaves the rectangle selected rather than being edited: a rectangle is finished the moment it
is drawn, there being nothing to type into it.

It is drawn as an outline and never filled. An annotation of this kind points at part of a
screenshot, and a filled box would cover the very thing it points at. Blacking something out is a
different job, and not one this does.

The outline is drawn in the same bold pink (`#EF3171`), with the same white outline and black
shadow, that text is, and for the same reason: one colour has to hold up against a light UI, a dark
terminal and a photo alike.

A range dragged too small is widened to the same minimum a resize is held to, so a click leaves a
small square behind rather than a rectangle nobody could grab.

## Adding an arrow

"Edit" → "Add arrow" arms the editor as the two above do, and the arrow is then dragged from its
tail to its tip. The drag is read end to end rather than as the box it spans: the same box comes of
dragging north east and south west, and which end it started from is the whole of what an arrow is.
As with a rectangle, the drag leaves the arrow selected rather than being edited.

It is drawn in the same bold pink, white outline and black shadow the other two are, so that it
holds up against a light UI, a dark terminal and a photo alike.

The head is a triangle with its back hollowed towards the point, and the shaft tapers into it
rather than running at a constant width. Neither is load-bearing — it is simply friendlier to look
at than a plain wedge, and an annotation someone is going to paste into a chat may as well be.

An arrow has no line width to set. A rectangle carries one because a thin box and a thick box say
different things about what they surround; an arrow says the same thing at any weight, and one
fewer thing to choose is worth more than the control.

A drag too short is lengthened to a minimum of three times the head, below which the head swallows
the shaft and there is no arrow left to see. A click that never became a drag leaves a
minimum-length arrow pointing right, which is a starting point to turn rather than an error.

## Drawing an item out

The three kinds above are all placed the same way: the Edit menu arms the editor, and the item is
then dragged out on the pane. Nothing is added until the pointer is released, and `Escape` leaves
the mode with nothing added at all.

What the drag shows is **the item itself, painted as it will be added** — its colour, its outline,
its shadow, an arrow's head — under a blue outline saying what will take the pointer once it is
there. Judging an annotation against the screenshot underneath it is the whole job, and holding
that back until release would make every placement a guess followed by a correction.

The blue outline follows the item rather than the pointer, so a drag held below a minimum shows
where it will actually end up instead of jumping there on release. Text is the exception: its drag
names a font size and a wrapping width rather than a box, so the outline stays the drag.

## Selecting, moving, editing

- A click selects an item, ctrl+click adds to or removes from the selection.
- A click on an item that is *already* selected enters edit mode. Editing is one step further in
  than selecting, so it costs one more click rather than a different gesture.
- Dragging moves the whole selection at once, whether the drag started on a selected item or not.
  Dragging an unselected item selects it first, so a drag never silently moves something else.
- Clicking the empty pane, or `Escape`, drops the selection and ends any edit.

A rectangle is clicked anywhere within it rather than on its outline alone. Asking the user to aim
at a line a few pixels wide is not worth the precision it buys, and the cost is accepted rather
than worked around: whatever a rectangle is drawn around cannot be clicked through it, and has to
be reached from a part of itself the rectangle leaves uncovered.

An arrow deliberately does not do that. It is clicked along its own length — a band as wide as the
drawing is — and the rest of the box it spans is left alone. A diagonal arrow's box is mostly empty
space, and the cost a rectangle is worth paying is not: taking all of it would put whatever sits in
those corners out of reach, for an item that covers almost none of them.

Edit mode shows a real caret and text selection over the text painted on the canvas, and takes
IME composition, so composing Japanese previews on the picture before it is confirmed. On a
rectangle or an arrow it carries nothing but the resize handles: there is no content to edit, and
resizing is what the extra click buys.

## Resizing

Only the item being edited carries handles, and each handle resizes one thing:

- **Bottom right, on an image** — scales it, keeping its aspect ratio. A screenshot with its
  proportions changed is a broken screenshot, so that is not offered.
- **Bottom right, on text** — scales the font size and the wrapping width together, which keeps
  the same words on the same lines. Resizing text this way changes how big it is, not how it is
  broken up.
- **Right edge, on text** — changes the wrapping width alone, at the same font size. Here
  re-wrapping is the point rather than what is avoided.
- **Bottom right, on a rectangle** — changes its width and height independently. A box drawn
  around part of a screenshot has no proportions of its own worth keeping, unlike the screenshot
  it is drawn on.
- **Either end, on an arrow** — moves that end and leaves the other where it is, which changes the
  arrow's length and its direction at once. An arrow has no box worth gripping a corner of, and
  pointing it somewhere else is the edit most often wanted: a handle on each end is what makes that
  a drag rather than a delete and a redraw.

Sizes are bounded so that an item can always be grabbed again: a font size stays within 12–72px,
a text box stays wide enough for ten full-width graphemes, an image never resizes below 36px on
its shorter side, and neither side of a rectangle goes below 36px either. An arrow held at its
minimum length still turns to follow the pointer, and it is the end being dragged that stops short
— the other one is the anchor and never moves to make room.

## Moving around

- The wheel scrolls, ctrl+wheel and a trackpad pinch zoom around the pointer, and dragging the
  pane with the main button pans it.
- Zoom runs from 27% to 200%. The lower bound is chosen so that wheeling back in from it lands
  neatly on 100%, and because the picture stops being legible further out.
- A wheel notch and a pinch are steps of very different size, so they get their own sensitivity:
  one notch is 30%, while a pinch follows the fingers.
- A zoom step that crosses 100% stops there, since that is the ratio a screenshot is actually read
  at and it is otherwise hard to hit. The next step leaves again, so 100% is somewhere to stop
  rather than somewhere to get stuck. Picking a level from the footer sets it exactly and never
  snaps.

## Saving, and not losing work

Saving is "File" → "Save as PNG" or the save hotkey, and always writes `screenshot.png`. There is
no format or quality to choose: PNG is what a screenshot annotation should be, and a naming
dialog for a file that is about to be pasted somewhere is a step for nothing.

"Save as PNG" is disabled on an empty picture, and the hotkey does nothing there either.

Work is protected at two points, both keyed on whether anything changed since the last save:

- "File" → "New instance" asks before discarding a picture with unsaved changes, and does not ask
  once it has been saved.
- Closing the tab with unsaved changes gets the browser's own leave confirmation.

Panning, zooming and selecting never count as changes — only the items do.

Anything that fails on the way (a file that will not decode, an export that will not encode) is
shown in a dialog rather than swallowed.

## Hotkeys

| Key | What it does |
| --- | --- |
| `Mod+S` | Save as PNG |
| `Escape` | Back to select mode with nothing selected |
| `Delete` / `Backspace` | Delete the selected items |

`Mod` is Cmd on macOS and Ctrl elsewhere, so the shortcut follows the convention of whatever the
user is on. `Backspace` deletes as well as `Delete` because a Mac keyboard without a Forward
Delete key has no other key to press.

Some deliberate edges:

- **They work while text is being edited, or not, depending on the key.** `Mod+S` and `Escape`
  fire from inside the text editor — saving and getting out are exactly what is wanted there.
  `Delete` and `Backspace` are left to the editor, where they mean "delete a character".
- **They are held back while a dialog is open.** A dialog is a question, and answering it comes
  first.
- **Holding the save keys down saves once**, not once per key repeat. Tapping the key again with
  the modifier still held saves again.
- **`Escape` closes an open menu and drops the selection at the same time.** Accepted rather than
  worked around: `Escape` means "never mind" in both cases, and telling them apart would mean
  tracking whether a menu is open.
