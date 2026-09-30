# UX design

This document holds this app's UX design decisions.
Only the core decisions and descriptions belong here.
For how the app implements them, see [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md).

## Target user

This app is for decorating the user's screenshots.
The user can upload a screenshot and edit it here, then download the result as an image file.

## Basic user experience

The expected UX is very close to that of a WYSIWYG image editor.

- The user must be able to do every operation with the mouse.
- The keyboard does not need to support every operation.
- Some actions have hotkeys for better UX.

Unlike general image editors, this app focuses on screenshot decoration.

### The picture and view

The user places items on an unbounded transparent plane.
The picture *is* whatever area the items cover.
Saving crops the exported image to exactly that area.

So the user sets up nothing before dropping the first screenshot.
There is also no document size that the items must stay inside.

The view shows that plane.
Dragging pans the view, and the wheel zooms it.
With these, the user can reach any part of the plane.
Neither changes the picture or the exported image.

Only the items decide whether there is unsaved work.
A change to the view never counts as unsaved work.
The app asks for confirmation before it discards unsaved work.
It also asks before the tab closes.

## Mode

The app is always in one of several modes.
The user's actions switch between them.
Each mode allows different actions.

The app starts in Select mode.
`Escape` returns to Select mode from any mode.

### Add item mode

In this mode, a drag adds a new item.
The app adds nothing until the user releases the pointer.
`Escape` leaves the mode and adds nothing.

During a drag, the app paints the item exactly as it will add it.

After the release, the new item becomes the target of the next action:

- A text item enters Edit mode, because it starts blank and the user must type into it.
- Any other kind becomes selected, because it is complete when the user draws it.

### Select mode

- A click selects an item.
  Ctrl+click adds an item to the selection or removes it from the selection.
- A plain click on an item that is *already* selected enters Edit mode.
- Dragging moves the whole selection at once.
  - Dragging an unselected item selects it first.
- A click on the empty pane clears the selection.

### Edit mode

Only the item in Edit mode has resize handles.
What a handle does depends on the item kind,
because each kind has different properties worth keeping during a resize.

Text is the only kind with content to type.
Edit mode shows a real caret and text selection over the text on the canvas.
It also accepts IME composition.
So Japanese text under composition appears on the picture before the user confirms it.

For every other kind, Edit mode shows only the handles.
So the extra click that enters Edit mode only adds resizing.
A drag on the item away from the handles still moves the item, as in Select mode.
This does not leave Edit mode.

Every size has limits, so the user can always grab the item again.

### Context menu

In Select mode and Edit mode, a right-click on the pane opens the app's context menu.

- The menu has the same items in every case.
- A right-click on an unselected item selects it first, as a drag does.
  A right-click elsewhere does not change the selection.
- The text editor of Edit mode keeps the browser's own menu.
- Add item mode shows the browser's own menu.
- The menu closes when the view pans or zooms.

## Item

The app draws every item on the canvas, and the user can edit every item.

Items stack in the order that the user added them, and a newer item is in front.
The user can move the selected items to the front or to the back.

### Image

An image item renders an image file that the user uploaded.

The user adds it from a header menu item, or by dropping a file anywhere in the window.
While the user drags files over the window, an overlay says so.
The overlay is necessary because the drop target is the whole window, not the pane.
Without the overlay, the user would have nothing to aim at.

Resizing scales it and keeps its aspect ratio.

### Text

A text item holds text content.
The app deletes the item if its content is blank when the edit ends.
This applies however the edit ends.

The height of the drag sets the font size.
That height is one line box.
The width of the drag sets the wrapping width.
The content then wraps to that width, and this decides the height of the item.

A text item has two handles in Edit mode.
The bottom-right handle scales the font size and the wrapping width together.
This keeps the same words on the same lines.
The right-edge handle changes only the wrapping width and keeps the font size.

### Rect

The app draws a rect item as an outline and never fills it.
Resizing changes its width and height independently.

### Arrow

The user drags an arrow item from its tail to its tip.

The head is a triangle with its back hollowed toward the point.
The shaft widens from the tail to the head, and does not keep a constant width.
This shape looks friendlier than a plain wedge.

Each end has a handle.
A drag on a handle moves only that end.
This changes the length and the direction of the arrow at the same time.

### Mosaic

A mosaic item masks information by pixelating whatever is painted behind it.
An item in front of the mosaic stays sharp.

It draws only the pixelated blocks, and nothing else, not even an outline.
Resizing changes its width and height independently.

## Hotkeys

- **`Delete` and `Backspace` delete items in Select mode and Edit mode.**
- **Some hotkeys work during text editing, and some do not.** `Mod+S`
  and `Escape` work inside the text editor, because the user wants to save or leave there.
  The text editor handles `Delete` and `Backspace`, where they mean "delete a character".
- **Hotkeys do not work while a dialog is open.**
  A dialog asks a question, and the user must answer it first.
