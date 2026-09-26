import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  addRectByDrag,
  bottomRightResizeHandle,
  boundingBoxOf,
  centerOf,
  dragBy,
  editorPane,
  expectBoxOnScreen,
  expectMode,
  openApp,
  type Point,
  parkCursor,
  rectItems,
  saveAsImage,
} from "./helpers";

/**
 * the range a rect is dragged out of. drawn, that is a 407 x 107 box: a new rect is given a 4px
 * line, whose outline is `ceil(4 * 1.6)` = 7px wide and straddles the line's own box.
 */
const MAIN_RANGE = { x: 200, y: 160, width: 400, height: 100 };

/**
 * enters edit mode on the rect that was just added.
 * @note a rect arrives already selected, so a single further click is what enters edit mode —
 *   unlike an image item, which has to be selected first.
 */
const editRect = async (page: Page): Promise<Locator> => {
  const item = rectItems(page).first();
  await item.click();
  await expectMode(page, "edit");
  return item;
};

/**
 * drags the handle by `delta`.
 * @note the handle sits centred on the bottom right corner of the drawn box, which is the corner
 *   the resize measures the new size from.
 */
const dragHandleBy = async (page: Page, delta: Point): Promise<void> => {
  await dragBy(page, centerOf(await boundingBoxOf(bottomRightResizeHandle(page))), delta);
};

test("changes the width and the height independently, keeping the top-left corner fixed", async ({
  page,
}) => {
  await openApp(page);
  await addRectByDrag(page, MAIN_RANGE);
  const item = await editRect(page);

  const before = await boundingBoxOf(item);
  await dragHandleBy(page, { x: 60, y: -30 });

  // an image's handle keeps its aspect ratio; a box drawn around part of a screenshot has none
  // worth keeping, so each side follows the pointer on its own.
  await expectBoxOnScreen(item, {
    x: before.x,
    y: before.y,
    width: before.width + 60,
    height: before.height - 30,
  });
});

test("does not collapse the rect below the minimum side", async ({ page }) => {
  await openApp(page);
  await addRectByDrag(page, MAIN_RANGE);
  const item = await editRect(page);

  const before = await boundingBoxOf(item);
  await dragHandleBy(page, { x: -before.width, y: -before.height });

  // the minimum side is 36px, which the outline grows to 43px on screen. the offset is the anchor
  // of the resize, so a rect collapsed against the floor can always be grabbed again.
  await expectBoxOnScreen(item, { x: before.x, y: before.y, width: 43, height: 43 });
});

test("keeps the resized rect in the exported picture", async ({ page }) => {
  await openApp(page);
  await addRectByDrag(page, MAIN_RANGE);
  await editRect(page);

  await dragHandleBy(page, { x: 60, y: -30 });

  // leave edit mode by clicking an empty corner of the pane, as a user would.
  const pane = await boundingBoxOf(editorPane(page));
  await page.mouse.click(pane.x + 20, pane.y + 20);
  await expectMode(page, "select");

  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-resized-rect.png");
  expect.soft(await saveAsImage(page)).toMatchSnapshot("export-resized-rect.png");
});
