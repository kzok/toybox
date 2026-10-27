import { expect, type Page, test } from "@playwright/test";
import {
  addTextByDrag,
  expectMode,
  fontSizeInput,
  leaveEditMode,
  openApp,
  textColorSwatch,
  textEditor,
  textItems,
} from "./helpers";

/** a range dragged on an arbitrary spot of the pane, wide enough for any font size. */
const TEXT_RANGE = { x: 200, y: 160, width: 400, height: 40 };

/**
 * sets the font size and the color on a blank text item, which the end of the edit then drops.
 * @note the picture stays empty, so that nothing unsaved holds a reload back.
 */
const setStylesOnBlankText = async (page: Page): Promise<void> => {
  await addTextByDrag(page, TEXT_RANGE);
  await fontSizeInput(page).fill("48");
  await fontSizeInput(page).press("Enter");
  await textColorSwatch(page, "Blue").click();
  await leaveEditMode(page);
  await expect(textItems(page)).toHaveCount(0);
};

test("starts a new text item in the styles last set in edit mode", async ({ page }) => {
  await openApp(page);
  await setStylesOnBlankText(page);

  const editor = await addTextByDrag(page, TEXT_RANGE);

  await expect(editor).toHaveCSS("font-size", "48px");
  await expect(fontSizeInput(page)).toHaveValue("48");
  await expect(textColorSwatch(page, "Blue")).toBeChecked();
});

test("keeps the styles across a reload", async ({ page }) => {
  await openApp(page);
  await setStylesOnBlankText(page);

  await page.reload();
  await expectMode(page, "select");

  await addTextByDrag(page, TEXT_RANGE);

  await expect(textEditor(page)).toHaveCSS("font-size", "48px");
  await expect(textColorSwatch(page, "Blue")).toBeChecked();
});
