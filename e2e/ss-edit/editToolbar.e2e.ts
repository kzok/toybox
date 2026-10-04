import { expect, test } from "@playwright/test";
import {
  addMosaicByDrag,
  addRectByDrag,
  addTextByDrag,
  boundingBoxOf,
  editToolbar,
  expectMode,
  fontSizeIcon,
  fontSizeInput,
  leaveEditMode,
  lineColorButton,
  lineColorSwatch,
  lineWidthDropdown,
  lineWidthOption,
  openApp,
  parkCursor,
  rectItems,
  textColorButton,
  textColorSwatch,
  textEditor,
} from "./helpers";

/**
 * a range dragged on an arbitrary spot of the pane, clear of the toolbar. its height gives a font
 * size of 32px (`round(40 / 1.25)`), and its width is the wrapping width as it is.
 */
const TEXT_RANGE = { x: 200, y: 160, width: 400, height: 40 };
/** a second range, clear of `TEXT_RANGE`. */
const SECOND_RANGE = { x: 200, y: 300, width: 400, height: 40 };
/** a third range, clear of the two above. */
const THIRD_RANGE = { x: 200, y: 400, width: 400, height: 40 };

test("shows the toolbar only while a text or a rect item is under edit", async ({ page }) => {
  await openApp(page);
  await expect(editToolbar(page)).toBeHidden();

  await addTextByDrag(page, TEXT_RANGE, "Hello");
  await expect(editToolbar(page)).toBeVisible();

  await leaveEditMode(page);
  await expect(editToolbar(page)).toBeHidden();

  const rect = await addRectByDrag(page, SECOND_RANGE);
  await expect(editToolbar(page)).toBeHidden();
  await rect.click();
  await expectMode(page, "edit");
  await expect(editToolbar(page)).toBeVisible();

  await page.keyboard.press("Escape");
  const mosaic = await addMosaicByDrag(page, THIRD_RANGE);
  await mosaic.click();
  await expectMode(page, "edit");
  await expect(editToolbar(page)).toBeHidden();
});

test("sets the line width picked on the toolbar, keeping the line where it is", async ({
  page,
}) => {
  await openApp(page);
  const rect = await addRectByDrag(page, SECOND_RANGE);
  await rect.click();
  await expectMode(page, "edit");
  await expect(lineWidthDropdown(page)).toHaveText("4px");
  const before = await boundingBoxOf(rectItems(page));

  await lineWidthDropdown(page).click();
  await lineWidthOption(page, "12px").click();

  await expect(lineWidthDropdown(page)).toHaveText("12px");
  await expectMode(page, "edit");
  // the outline grows from ceil(4 * 1.6) = 7 to ceil(12 * 1.6) = 20 on both sides of the line.
  await expect
    .poll(async () => await boundingBoxOf(rectItems(page)))
    .toStrictEqual({
      x: before.x - 6.5,
      y: before.y - 6.5,
      width: before.width + 13,
      height: before.height + 13,
    });
});

test("restyles the line of a rect item from the toolbar", async ({ page }) => {
  await openApp(page);
  const rect = await addRectByDrag(page, SECOND_RANGE);
  await rect.click();

  await lineWidthDropdown(page).click();
  await lineWidthOption(page, "8px").click();
  await lineColorButton(page).click();
  await lineColorSwatch(page, "Blue").click();

  await expect(lineColorSwatch(page, "Blue")).toBeHidden();
  await expectMode(page, "edit");

  await page.keyboard.press("Escape");
  await expectMode(page, "select");
  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-rect-restyled.png");
});

test("sets the font size typed into the toolbar, scaling the width with it", async ({ page }) => {
  await openApp(page);
  const editor = await addTextByDrag(page, TEXT_RANGE, "Hello");
  await expect(fontSizeInput(page)).toHaveValue("32");

  await fontSizeInput(page).fill("48");
  await fontSizeInput(page).press("Enter");

  await expect(editor).toHaveCSS("font-size", "48px");
  await expect(editor).toHaveCSS("width", "600px");
  await expectMode(page, "edit");
});

test("focuses the font size input on a click on its icon", async ({ page }) => {
  await openApp(page);
  await addTextByDrag(page, TEXT_RANGE, "Hello");

  await fontSizeIcon(page).click();

  await expect(fontSizeInput(page)).toBeFocused();
  await expectMode(page, "edit");
});

test("clamps the font size typed into the toolbar", async ({ page }) => {
  await openApp(page);
  const editor = await addTextByDrag(page, TEXT_RANGE, "Hello");

  await fontSizeInput(page).fill("100");
  await fontSizeInput(page).press("Enter");

  await expect(editor).toHaveCSS("font-size", "72px");
  await expect(fontSizeInput(page)).toHaveValue("72");
});

test("sets the color picked on the toolbar", async ({ page }) => {
  await openApp(page);
  await addTextByDrag(page, TEXT_RANGE, "Hello");

  await textColorButton(page).click();
  await textColorSwatch(page, "Blue").click();

  await expect(textColorSwatch(page, "Blue")).toBeHidden();
  await expectMode(page, "edit");
  await expect(textEditor(page)).toHaveValue("Hello");

  await textColorButton(page).click();
  await expect(textColorSwatch(page, "Blue")).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(textColorSwatch(page, "Blue")).toBeHidden();
  await expectMode(page, "edit");

  // NOTE: the click leaves the pointer on an empty corner, hence no hover highlight either.
  await leaveEditMode(page);
  await expect.soft(page).toHaveScreenshot("screenshot-text-recolored.png");
});

test("hands the focus back to the text editor, caret and all, once a color is picked", async ({
  page,
}) => {
  await openApp(page);
  const editor = await addTextByDrag(page, TEXT_RANGE, "Hello");
  await page.keyboard.press("Home");

  await textColorButton(page).click();
  await textColorSwatch(page, "Blue").click();

  await expect(editor).toBeFocused();
  await page.keyboard.type("X");
  await expect(editor).toHaveValue("XHello");
  await page.keyboard.press("Backspace");
  await expect(editor).toHaveValue("Hello");
  await expectMode(page, "edit");
});

test("hands the focus back to the text editor when Escape closes the colors", async ({ page }) => {
  await openApp(page);
  const editor = await addTextByDrag(page, TEXT_RANGE, "Hello");

  await textColorButton(page).click();
  await expect(textColorSwatch(page, "Blue")).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(textColorSwatch(page, "Blue")).toBeHidden();
  await expect(editor).toBeFocused();
  await page.keyboard.type("!");
  await expect(editor).toHaveValue("Hello!");
});
