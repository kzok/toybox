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
 * every item on the editor overlay, from the back to the front. mainly for select mode, but note
 * that edit mode's item carries the attribute too and hence also matches: its image item is a
 * `<span data-item-kind="image">` and its text item is a `<textarea data-item-kind="text">`.
 */
export const items = (page: Page): Locator => page.locator("[data-item-kind]");

/** image items on the editor overlay, from the back to the front. see `items` on edit mode. */
export const imageItems = (page: Page): Locator => page.locator("[data-item-kind='image']");

/** text items on the editor overlay, from the back to the front. see `items` on edit mode. */
export const textItems = (page: Page): Locator => page.locator("[data-item-kind='text']");

/**
 * rect items on the editor overlay, from the back to the front. see `items` on edit mode.
 * @note the element spans the box the outline is drawn in, which is wider than the item's own
 *   `width` / `height` by the half of the outline lying outside them on every edge.
 */
export const rectItems = (page: Page): Locator => page.locator("[data-item-kind='rect']");

/**
 * arrow items on the editor overlay, from the back to the front. see `items` on edit mode.
 * @note the element is a band along the arrow rather than the box it spans, turned into place by
 *   a `rotate()`. its bounding box is therefore the box of the turned band, which for anything
 *   but a horizontal arrow is wider and taller than the band itself.
 */
export const arrowItems = (page: Page): Locator => page.locator("[data-item-kind='arrow']");

/**
 * mosaic items on the editor overlay, from the back to the front. see `items` on edit mode.
 * @note unlike a rect, nothing is drawn outside the item, so the element spans its own `width` /
 *   `height` exactly.
 */
export const mosaicItems = (page: Page): Locator => page.locator("[data-item-kind='mosaic']");

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

export const dropOverlay = (page: Page): Locator => page.getByText("Drop images here");

/**
 * the context menu of the editor pane.
 * @note it matches any open menu: the header menus share the role. open one menu at a time.
 */
export const contextMenu = (page: Page): Locator => page.getByRole("menu");

/** the toolbar on the side panel. */
export const toolsToolbar = (page: Page): Locator => page.getByRole("toolbar", { name: "Tools" });

/** a mode button of the side panel, by its label. the button of the current mode is pressed. */
export const toolButton = (page: Page, name: string): Locator =>
  toolsToolbar(page).getByRole("button", { name, exact: true });

/** the styles of the item under edit, which the side panel shows in edit mode. */
export const itemStyle = (page: Page): Locator => page.getByRole("region", { name: "Item style" });

export const fontSizeInput = (page: Page): Locator =>
  itemStyle(page).getByRole("spinbutton", { name: "Font size" });

/** the label of the font size input. */
export const fontSizeLabel = (page: Page): Locator =>
  itemStyle(page).getByText("Font size", { exact: true });

export const lineWidthDropdown = (page: Page): Locator =>
  itemStyle(page).getByRole("combobox", { name: "Line width" });

export const blockSizeDropdown = (page: Page): Locator =>
  itemStyle(page).getByRole("combobox", { name: "Block size" });

/**
 * an option of a dropdown, by its text. it is visible only while the list is open.
 * @note it matches an option of any dropdown. open one dropdown at a time.
 */
export const dropdownOption = (page: Page, name: string): Locator =>
  page.getByRole("option", { name });

/** a line color swatch, by the name of its color. */
export const lineColorSwatch = (page: Page, name: string): Locator =>
  itemStyle(page).getByRole("radiogroup", { name: "Line color" }).getByRole("radio", { name });

/** an arrow color swatch, by the name of its color. */
export const arrowColorSwatch = (page: Page, name: string): Locator =>
  itemStyle(page).getByRole("radiogroup", { name: "Arrow color" }).getByRole("radio", { name });

/** a text color swatch, by the name of its color. */
export const textColorSwatch = (page: Page, name: string): Locator =>
  itemStyle(page).getByRole("radiogroup", { name: "Text color" }).getByRole("radio", { name });

/** the dialog asking whether the unsaved picture may be discarded. */
export const confirmClearDialog = (page: Page): Locator => page.getByText("Unsaved Changes");

/** the dialog choosing how the picture is saved. */
export const saveImageDialog = (page: Page): Locator =>
  page.getByRole("dialog", { name: "Save as image" });
