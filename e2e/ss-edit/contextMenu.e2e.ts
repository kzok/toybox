import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  addRectByDrag,
  addTextByDrag,
  boundingBoxOf,
  centerOf,
  contextMenu,
  enterAddRect,
  expectMode,
  openApp,
  panePointToViewport,
  rectItems,
  rightClickAt,
} from "./helpers";

/** a range for a rect, dragged on an arbitrary spot of the pane. */
const FIRST_RANGE = { x: 200, y: 160, width: 300, height: 80 };
/** a second range, clear of `FIRST_RANGE`, for the tests that need two items. */
const SECOND_RANGE = { x: 200, y: 300, width: 300, height: 80 };
/** a range wide enough for the text below. */
const TEXT_RANGE = { x: 200, y: 160, width: 400, height: 40 };
/** a spot of the pane, clear of every range above. */
const EMPTY_POINT = { x: 100, y: 450 };
/** another empty spot, clear of the menu opened at `EMPTY_POINT`. */
const OTHER_EMPTY_POINT = { x: 600, y: 100 };

const menuItem = (page: Page, name: string): Locator =>
  contextMenu(page).getByRole("menuitem", { name });

const rightClickOn = async (page: Page, element: Locator): Promise<void> => {
  await rightClickAt(page, centerOf(await boundingBoxOf(element)));
};

const rightClickOnEmptySpot = async (page: Page): Promise<void> => {
  await rightClickAt(page, await panePointToViewport(page, EMPTY_POINT));
};

/**
 * adds two rects, the second of which ends up the only one selected.
 * @returns the two rects
 * @note not the locators that `addRectByDrag` returns: `last()` follows each item added later.
 */
const addTwoRects = async (page: Page): Promise<[Locator, Locator]> => {
  await addRectByDrag(page, FIRST_RANGE);
  await addRectByDrag(page, SECOND_RANGE);
  const [first, second] = [rectItems(page).first(), rectItems(page).last()];
  await expect(first).toHaveAttribute("data-selected", "false");
  await expect(second).toHaveAttribute("data-selected", "true");
  return [first, second];
};

test("selects an unselected item alone before opening in select mode", async ({ page }) => {
  await openApp(page);
  const [first, second] = await addTwoRects(page);

  await rightClickOn(page, first);

  await expect(contextMenu(page)).toBeVisible();
  await expect(first).toHaveAttribute("data-selected", "true");
  await expect(second).toHaveAttribute("data-selected", "false");
});

test("keeps the whole selection on a selected item", async ({ page }) => {
  await openApp(page);
  const [first, second] = await addTwoRects(page);
  await first.click({ modifiers: ["ControlOrMeta"] });
  await expect(first).toHaveAttribute("data-selected", "true");

  await rightClickOn(page, first);

  await expect(contextMenu(page)).toBeVisible();
  await expect(first).toHaveAttribute("data-selected", "true");
  await expect(second).toHaveAttribute("data-selected", "true");
  await expectMode(page, "select");
});

test("keeps the selection on an empty spot", async ({ page }) => {
  await openApp(page);
  const [first, second] = await addTwoRects(page);

  await rightClickOnEmptySpot(page);

  await expect(contextMenu(page)).toBeVisible();
  await expect(first).toHaveAttribute("data-selected", "false");
  await expect(second).toHaveAttribute("data-selected", "true");
});

test("opens in edit mode", async ({ page }) => {
  await openApp(page);
  const rect = await addRectByDrag(page, FIRST_RANGE);
  await rect.click();
  await expectMode(page, "edit");

  await rightClickOn(page, rect);

  await expect(contextMenu(page)).toBeVisible();
  await expectMode(page, "edit");
});

test("deletes the selected item, keeping the rest", async ({ page }) => {
  await openApp(page);
  await addRectByDrag(page, FIRST_RANGE);
  await addRectByDrag(page, SECOND_RANGE);
  // the rect added last is the only one selected.
  const kept = await boundingBoxOf(rectItems(page).first());

  await rightClickOnEmptySpot(page);
  await menuItem(page, "Delete").click();

  await expect(contextMenu(page)).toBeHidden();
  await expect(rectItems(page)).toHaveCount(1);
  expect(await boundingBoxOf(rectItems(page).first())).toStrictEqual(kept);
});

test("deletes the item under edit", async ({ page }) => {
  await openApp(page);
  await addRectByDrag(page, FIRST_RANGE);
  const rect = await addRectByDrag(page, SECOND_RANGE);
  await rect.click();
  await expectMode(page, "edit");

  await rightClickOn(page, rect);
  await menuItem(page, "Delete").click();

  // edit mode shows only the item under edit, hence the count means nothing until it ends.
  await expectMode(page, "select");
  await expect(rectItems(page)).toHaveCount(1);
});

test("brings the selected item to the front", async ({ page }) => {
  await openApp(page);
  await addRectByDrag(page, FIRST_RANGE);
  await addRectByDrag(page, SECOND_RANGE);
  const moved = await boundingBoxOf(rectItems(page).first());
  await rectItems(page).first().click();

  await rightClickOnEmptySpot(page);
  await menuItem(page, "Bring to front").click();

  await expect(contextMenu(page)).toBeHidden();
  expect(await boundingBoxOf(rectItems(page).last())).toStrictEqual(moved);
  await expect(rectItems(page).last()).toHaveAttribute("data-selected", "true");
});

test("sends the selected item to the back", async ({ page }) => {
  await openApp(page);
  await addRectByDrag(page, FIRST_RANGE);
  await addRectByDrag(page, SECOND_RANGE);
  // the rect added last is the only one selected.
  const moved = await boundingBoxOf(rectItems(page).last());

  await rightClickOnEmptySpot(page);
  await menuItem(page, "Send to back").click();

  await expect(contextMenu(page)).toBeHidden();
  expect(await boundingBoxOf(rectItems(page).first())).toStrictEqual(moved);
  await expect(rectItems(page).first()).toHaveAttribute("data-selected", "true");
});

test("deletes nothing while nothing is selected", async ({ page }) => {
  await openApp(page);
  await addRectByDrag(page, FIRST_RANGE);
  const empty = await panePointToViewport(page, EMPTY_POINT);
  await page.mouse.click(empty.x, empty.y);
  await expect(rectItems(page).first()).toHaveAttribute("data-selected", "false");

  await rightClickAt(page, empty);
  await menuItem(page, "Delete").click();

  await expect(contextMenu(page)).toBeHidden();
  await expect(rectItems(page)).toHaveCount(1);
});

test("leaves the text editor to the browser's own menu", async ({ page }) => {
  await openApp(page);
  const editor = await addTextByDrag(page, TEXT_RANGE, "Hello");

  await rightClickOn(page, editor);

  // NOTE: there is nothing to wait for when the menu is meant not to open, hence the pause before
  // concluding that it never did.
  await page.waitForTimeout(500);
  await expect(contextMenu(page)).toBeHidden();
  await expectMode(page, "edit");
});

test("opens no menu in add-item mode", async ({ page }) => {
  await openApp(page);
  await enterAddRect(page);

  await rightClickOnEmptySpot(page);

  // NOTE: see the pause above.
  await page.waitForTimeout(500);
  await expect(contextMenu(page)).toBeHidden();
  await expectMode(page, "add-item");
});

test("closes when the wheel pans the view", async ({ page }) => {
  await openApp(page);
  await addRectByDrag(page, FIRST_RANGE);
  await rightClickOnEmptySpot(page);
  await expect(contextMenu(page)).toBeVisible();

  // NOTE: the wheel has to hit the pane, not the menu that opened under the pointer.
  const other = await panePointToViewport(page, OTHER_EMPTY_POINT);
  await page.mouse.move(other.x, other.y);
  await page.mouse.wheel(0, 100);

  await expect(contextMenu(page)).toBeHidden();
});
