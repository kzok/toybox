import { type Locator, type Page, test } from "@playwright/test";
import {
  addArrowByDrag,
  addImage,
  addLabelledImage,
  addMosaicByDrag,
  addRectByDrag,
  arrowItems,
  boundingBoxOf,
  centerOf,
  dragBy,
  editArrow,
  expectMode,
  expectMovedBy,
  imageItems,
  mosaicItems,
  openApp,
  type Point,
  rectItems,
} from "./helpers";

/** how far every item is dragged. */
const DELTA: Point = { x: 60, y: 40 };

/**
 * drags `item` by its centre in edit mode and asserts that it followed the pointer.
 * @param anchor an item the drag leaves alone. a pan of the view would carry it along as well,
 *   which is what tells a move of `item` from a drag that missed it.
 * @param enterEdit opens edit mode on `item`
 */
const expectMovedInEditMode = async (
  page: Page,
  item: Locator,
  anchor: Locator,
  enterEdit: () => Promise<void>,
): Promise<void> => {
  // NOTE: measured before entering edit mode, whose overlay lays out the edited item alone.
  const anchorBefore = await boundingBoxOf(anchor);
  await enterEdit();
  await expectMode(page, "edit");

  const before = await boundingBoxOf(item);
  await dragBy(page, centerOf(before), DELTA);

  await expectMovedBy(item, before, DELTA);
  await expectMode(page, "edit");

  await page.keyboard.press("Escape");
  await expectMode(page, "select");
  await expectMovedBy(anchor, anchorBefore, { x: 0, y: 0 });
};

test("moves an image item by dragging it in edit mode", async ({ page }) => {
  await openApp(page);
  await addImage(page, "320x240.png");
  // kept on the top left corner of the pane, clear of the image added on its center.
  await addRectByDrag(page, { x: 40, y: 40, width: 160, height: 60 });

  const item = imageItems(page).first();
  await expectMovedInEditMode(page, item, rectItems(page).first(), async () => {
    await item.click();
    await item.click();
  });
});

test("moves a rect item by dragging it in edit mode", async ({ page }) => {
  await openApp(page);
  await addRectByDrag(page, await addLabelledImage(page));

  // a rect arrives already selected, so a single further click is what enters edit mode.
  const item = rectItems(page).first();
  await expectMovedInEditMode(page, item, imageItems(page).first(), () => item.click());
});

test("moves a mosaic item by dragging it in edit mode", async ({ page }) => {
  await openApp(page);
  await addMosaicByDrag(page, await addLabelledImage(page));

  // a mosaic arrives already selected, so a single further click is what enters edit mode.
  const item = mosaicItems(page).first();
  await expectMovedInEditMode(page, item, imageItems(page).first(), () => item.click());
});

test("moves an arrow item by dragging it in edit mode", async ({ page }) => {
  await openApp(page);
  const label = await addLabelledImage(page);
  const y = label.y + label.height / 2;
  await addArrowByDrag(page, { x: label.x, y }, { x: label.x + label.width, y });

  await expectMovedInEditMode(
    page,
    arrowItems(page).first(),
    imageItems(page).first(),
    async () => {
      await editArrow(page);
    },
  );
});
