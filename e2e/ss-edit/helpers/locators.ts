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
 * that edit mode's image item is a `<button data-item-kind="image">` too and hence also matches
 * (edit mode's text item is a `<textarea>`, so it alone stays select-mode-only).
 */
export const items = (page: Page): Locator => page.locator("button[data-item-kind]");

/** image items on the editor overlay, in the order they were added. */
export const imageItems = (page: Page): Locator => page.locator("button[data-item-kind='image']");

/** text items on the editor overlay, in the order they were added. */
export const textItems = (page: Page): Locator => page.locator("button[data-item-kind='text']");

/** the transparent `<textarea/>` of edit mode. there is at most one of it. */
export const textEditor = (page: Page): Locator => page.locator("textarea");

/** the full-pane layer of add-item mode, which captures the drag defining the new item. */
export const addItemLayer = (page: Page): Locator =>
  page.locator("[data-editor-mode='add-item'] > div");

/** the outline of the item about to be added, shown while a range is being dragged. */
export const rangePreview = (page: Page): Locator => page.locator("[data-range-preview]");

/** the resize handle on the bottom-right corner of an image item in edit mode. */
export const resizeHandle = (page: Page): Locator => page.locator("[data-resize-handle]");

export const zoomLevel = (page: Page): Locator => page.getByTitle("Zoom level");

export const pictureSize = (page: Page): Locator => page.getByTitle("Size");

export const dropOverlay = (page: Page): Locator => page.getByText("Drop an image here");

/** the dialog asking whether the unsaved picture may be discarded. */
export const confirmClearDialog = (page: Page): Locator => page.getByText("Unsaved Changes");
