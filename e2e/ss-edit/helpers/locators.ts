import type { Locator, Page } from "@playwright/test";

/** the root element the application is mounted on. */
export const appRoot = (page: Page): Locator => page.locator("#root");

/** the editor pane, which fills the space between the header and the footer. */
export const editorPane = (page: Page): Locator => page.locator("canvas").locator("..");

export const canvas = (page: Page): Locator => page.locator("canvas");

/**
 * the overlay laid over the canvas. its `data-editor-mode` attribute is the stable handle on the
 * current editor mode: each mode swaps the whole content of this element.
 */
export const editorOverlay = (page: Page): Locator => page.locator("[data-editor-mode]");

/**
 * every item on the editor overlay, in the order they were added. mainly for select mode, but note
 * that edit mode's item carries the attribute too and hence also matches: its image item is a
 * `<span data-item-kind="image">` and its text item is a `<textarea data-item-kind="text">`.
 */
export const items = (page: Page): Locator => page.locator("[data-item-kind]");

/** image items on the editor overlay, in the order they were added. see `items` on edit mode. */
export const imageItems = (page: Page): Locator => page.locator("[data-item-kind='image']");

/** text items on the editor overlay, in the order they were added. see `items` on edit mode. */
export const textItems = (page: Page): Locator => page.locator("[data-item-kind='text']");

/**
 * rect items on the editor overlay, in the order they were added. see `items` on edit mode.
 * @note the element spans the box the outline is drawn in, which is wider than the item's own
 *   `width` / `height` by the half of the outline lying outside them on every edge.
 */
export const rectItems = (page: Page): Locator => page.locator("[data-item-kind='rect']");

/**
 * arrow items on the editor overlay, in the order they were added. see `items` on edit mode.
 * @note the element is a band along the arrow rather than the box it spans, turned into place by
 *   a `rotate()`. its bounding box is therefore the box of the turned band, which for anything
 *   but a horizontal arrow is wider and taller than the band itself.
 */
export const arrowItems = (page: Page): Locator => page.locator("[data-item-kind='arrow']");

/** the transparent `<textarea/>` of edit mode. there is at most one of it. */
export const textEditor = (page: Page): Locator => page.locator("textarea");

/** the full-pane layer of add-item mode, which captures the drag defining the new item. */
export const addItemLayer = (page: Page): Locator =>
  page.locator("[data-editor-mode='add-item'] > div");

/** the outline of the item about to be added, shown while a range is being dragged. */
export const rangePreview = (page: Page): Locator => page.locator("[data-range-preview]");

/** the resize handle on the bottom-right corner of the item being edited. */
export const bottomRightResizeHandle = (page: Page): Locator =>
  page.locator("[data-resize-handle='bottom-right']");

/** the resize handle on the middle of the right edge of a text item being edited. */
export const rightResizeHandle = (page: Page): Locator =>
  page.locator("[data-resize-handle='right']");

/**
 * the resize handle on the tail of an arrow item being edited.
 * @note an arrow is the one kind whose handles grip an end of the item rather than a corner of a
 *   box, hence a pair named after the ends instead of the `bottom-right` above.
 */
export const arrowTailHandle = (page: Page): Locator => page.locator("[data-resize-handle='tail']");

/** the resize handle on the tip of an arrow item being edited. */
export const arrowTipHandle = (page: Page): Locator => page.locator("[data-resize-handle='tip']");

export const zoomLevel = (page: Page): Locator => page.getByTitle("Zoom level");

export const pictureSize = (page: Page): Locator => page.getByTitle("Size");

export const dropOverlay = (page: Page): Locator => page.getByText("Drop an image here");

/** the dialog asking whether the unsaved picture may be discarded. */
export const confirmClearDialog = (page: Page): Locator => page.getByText("Unsaved Changes");
