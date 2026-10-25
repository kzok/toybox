import { expect, test } from "@playwright/test";
import { addRectByDrag, expectMode, openApp, toolButton } from "./helpers";

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
