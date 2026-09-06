# UX design

This document holds this app's UX design decisions.
Only the core decisions and descriptions belong here.
How any of it is built is in [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md).

## Target user

This app is for decorating the user's screenshots.
The user can upload a screenshot and edit it here, then download the result as an image file.

## Basic user experience

The expected UX is very close to that of a WYSIWYG image editor.

- Every operation must be accessible by mouse action.
- Not everything can be done by keyboard action.
- Hotkeys are supported for better UX in certain actions.

Unlike an image editor in general, this app focuses on screenshot decoration.

### The picture and view

Items are placed on an unbounded transparent plane.
The picture *is* whatever area those items happen to cover,
and saving crops the exported PNG to exactly that area.

Hence there is nothing to set up before dropping the first screenshot in,
and no document size to keep the items inside of.

The view shows that plane.
Dragging pans the view and the wheel zooms it, which is how the user reaches any part of it.
Neither ever changes the picture or what gets exported.

Saving always writes a PNG and never asks for a file name.
A screenshot annotation is made to be pasted somewhere,
so a format to choose and a name to type are both steps for nothing.

Only the items decide whether there is unsaved work.
Nothing the user does to the view counts as a change.
Unsaved work is confirmed before it is discarded, and again before the tab closes.

## Mode

The app is always in one of several modes, and the user's actions switch between them.
What the user can do differs among the modes.

Select mode is where the app starts, and `Escape` returns to it from anywhere.

### Add item mode

Dragging out adds a new item in this mode.
Nothing is added until the pointer is released.
`Escape` leaves the mode with nothing added at all.

A drag shows the item itself, painted as it will be added.

Releasing leaves the new item as the user's next concern.
A text item is edited, since it arrives blank and has to be typed into.
Any other kind is merely selected, being finished the moment it is drawn.

### Select mode

- A click selects an item, ctrl+click adds to or removes from the selection.
- A plain click on an item that is *already* selected enters edit mode.
- Dragging moves the whole selection at once.
  - Dragging an unselected item selects it first.
- Clicking the empty pane drops the selection.

### Edit mode

Only the item being edited carries resize handles, and what a handle does differs by kind,
since what is worth keeping about an item does.

Text is the only kind with content to type.
Edit mode shows a real caret and text selection over the text painted on the canvas,
and takes IME composition, so composing Japanese previews on the picture before it is confirmed.
Every other kind carries nothing but the handles, and resizing is what the extra click buys.

Every size is bounded, so that an item can always be grabbed again.

## Item

Every item is drawn on the canvas and editable by the user.

### Image

An image item renders an image file the user uploaded.

It is added via a header menu item, or by dropping a file anywhere in the window.
While files are dragged over the window an overlay says so,
because the drop target is the whole window rather than the pane
and there would otherwise be nothing to aim at.

Resizing scales it and keeps its aspect ratio.

### Text

A text item holds text content.
It is dropped when its content is left blank, whichever way the edit ends.

The dragged height sets the font size, the height being one line box,
and the dragged width sets the wrapping width.
The content then wraps to that width, which is what decides the item's height.

A text item has two handles in Edit mode.
The bottom right one scales the font size and the wrapping width together,
which keeps the same words on the same lines.
The right edge one changes the wrapping width alone, at the same font size.

### Rect

A rect item is drawn as an outline and never filled.
Resizing changes its width and height independently.

### Arrow

An arrow item is dragged from its tail to its tip.

The head is a triangle with its back hollowed towards the point,
and the shaft tapers into it rather than running at a constant width.
It is simply friendlier to look at than a plain wedge.

Each end carries a handle, and dragging one moves that end alone,
which changes the arrow's length and its direction at once.

## Hotkeys

| Key | What it does |
| --- | --- |
| `Mod+S` | Save as PNG |
| `Escape` | Back to select mode with nothing selected |
| `Delete` / `Backspace` | Delete the selected items |

`Mod` is Cmd on macOS and Ctrl elsewhere,
so the shortcut follows the convention of whatever the user is on.
`Backspace` deletes as well as `Delete`
because a Mac keyboard without a Forward Delete key has no other key to press.

Some deliberate edges:

- **They work while text is being edited, or not, depending on the key.** `Mod+S` and `Escape`
  fire from inside the text editor — saving and getting out are exactly what is wanted there.
  `Delete` and `Backspace` are left to the editor, where they mean "delete a character".
- **They are held back while a dialog is open.**
  A dialog is a question, and answering it comes first.
