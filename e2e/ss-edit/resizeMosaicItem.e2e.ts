import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  addLabelledImage,
  addMosaicByDrag,
  bottomRightResizeHandle,
  boundingBoxOf,
  centerOf,
  dragBy,
  editorPane,
  expectBoxOnScreen,
  expectMode,
  MOSAIC_PIXELS,
  mosaicItems,
  openApp,
  type Point,
  parkCursor,
  saveAsImage,
} from "./helpers";

/**
 * adds a mosaic over the label of an image, then enters edit mode on it.
 * @note a mosaic arrives already selected, so a single further click is what enters edit mode.
 */
const addAndEditMosaic = async (page: Page): Promise<Locator> => {
  const item = await addMosaicByDrag(page, await addLabelledImage(page));
  await item.click();
  await expectMode(page, "edit");
  return mosaicItems(page).first();
};

/** drags the handle, which sits centred on the bottom right corner of the item, by `delta`. */
const dragHandleBy = async (page: Page, delta: Point): Promise<void> => {
  await dragBy(page, centerOf(await boundingBoxOf(bottomRightResizeHandle(page))), delta);
};

test("changes the width and the height independently, keeping the top-left corner fixed", async ({
  page,
}) => {
  await openApp(page);
  const item = await addAndEditMosaic(page);

  const before = await boundingBoxOf(item);
  await dragHandleBy(page, { x: 60, y: -30 });

  await expectBoxOnScreen(item, {
    x: before.x,
    y: before.y,
    width: before.width + 60,
    height: before.height - 30,
  });
});

test("does not collapse the mosaic below the minimum side", async ({ page }) => {
  await openApp(page);
  const item = await addAndEditMosaic(page);

  const before = await boundingBoxOf(item);
  await dragHandleBy(page, { x: -before.width, y: -before.height });

  await expectBoxOnScreen(item, { x: before.x, y: before.y, width: 16, height: 16 });
});

test("keeps the resized mosaic in the exported picture", async ({ page }) => {
  await openApp(page);
  await addAndEditMosaic(page);

  // reaches past the right edge of the image, over nothing but the background.
  await dragHandleBy(page, { x: 60, y: 20 });

  const pane = await boundingBoxOf(editorPane(page));
  await page.mouse.click(pane.x + 20, pane.y + 20);
  await expectMode(page, "select");

  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-resized-mosaic.png", MOSAIC_PIXELS);
  expect.soft(await saveAsImage(page)).toMatchSnapshot("export-resized-mosaic.png", MOSAIC_PIXELS);
});
