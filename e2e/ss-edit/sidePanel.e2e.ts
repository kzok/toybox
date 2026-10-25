import { expect, test } from "@playwright/test";
import { addRectByDrag, expectMode, itemStyle, openApp, toolButton, toolsToolbar } from "./helpers";

/** a range dragged on an arbitrary spot of the pane. */
const RECT_RANGE = { x: 200, y: 160, width: 200, height: 100 };

test("enters add-item mode from a tool button and returns with the Select button", async ({
  page,
}) => {
  await openApp(page);
  await expect(toolButton(page, "Select")).toHaveAttribute("aria-pressed", "true");

  await toolButton(page, "Add rectangle").click();
  await expectMode(page, "add-item");
  await expect(toolButton(page, "Add rectangle")).toHaveAttribute("aria-pressed", "true");
  await expect(toolButton(page, "Select")).toHaveAttribute("aria-pressed", "false");

  await toolButton(page, "Select").click();
  await expectMode(page, "select");
  await expect(toolButton(page, "Select")).toHaveAttribute("aria-pressed", "true");
});

test("keeps the selection on a click on the checked Select button", async ({ page }) => {
  await openApp(page);
  const rect = await addRectByDrag(page, RECT_RANGE);
  await expect(rect).toHaveAttribute("data-selected", "true");

  await toolButton(page, "Select").click();

  await expectMode(page, "select");
  await expect(rect).toHaveAttribute("data-selected", "true");
});

test("swaps the mode buttons for the item style in edit mode", async ({ page }) => {
  await openApp(page);
  const rect = await addRectByDrag(page, RECT_RANGE);

  await rect.click();
  await expectMode(page, "edit");
  await expect(toolsToolbar(page)).toBeHidden();
  await expect(itemStyle(page)).toBeVisible();

  await page.keyboard.press("Escape");
  await expectMode(page, "select");
  await expect(toolsToolbar(page)).toBeVisible();
  await expect(itemStyle(page)).toBeHidden();
});
