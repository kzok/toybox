import { expect, test } from "@playwright/test";
import {
  addArrowByDrag,
  addImage,
  addLabelledImage,
  addMosaicByDrag,
  addRectByDrag,
  addTextByDrag,
  arrowColorSwatch,
  blockSizeInput,
  boundingBoxOf,
  editArrow,
  expectMode,
  fontSizeInput,
  fontSizeLabel,
  fontSizeSlider,
  imageItems,
  itemStyle,
  leaveEditMode,
  lineColorSwatch,
  lineWidthInput,
  MOSAIC_PIXELS,
  openApp,
  type Point,
  parkCursor,
  rectItems,
  textColorSwatch,
  textEditor,
} from "./helpers";

/**
 * a range dragged on an arbitrary spot of the pane. a text item in it starts at the default 32px,
 * and its width is the wrapping width as it is.
 */
const TEXT_RANGE = { x: 200, y: 160, width: 400, height: 40 };
/** a second range, clear of `TEXT_RANGE`. */
const SECOND_RANGE = { x: 200, y: 300, width: 400, height: 40 };
/** a third range, clear of the two above. */
const THIRD_RANGE = { x: 200, y: 400, width: 400, height: 40 };
/** the two ends of an arrow, clear of the three ranges above. */
const ARROW_TAIL: Point = { x: 200, y: 250 };
const ARROW_TIP: Point = { x: 600, y: 250 };

test("shows the item style only while an item is under edit", async ({ page }) => {
  await openApp(page);
  await expect(itemStyle(page)).toBeHidden();

  await addTextByDrag(page, TEXT_RANGE, "Hello");
  await expect(itemStyle(page).getByRole("heading", { name: "Text" })).toBeVisible();

  await leaveEditMode(page);
  await expect(itemStyle(page)).toBeHidden();

  const rect = await addRectByDrag(page, SECOND_RANGE);
  await expect(itemStyle(page)).toBeHidden();
  await rect.click();
  await expectMode(page, "edit");
  await expect(itemStyle(page).getByRole("heading", { name: "Rectangle" })).toBeVisible();

  await page.keyboard.press("Escape");
  const mosaic = await addMosaicByDrag(page, THIRD_RANGE);
  await mosaic.click();
  await expectMode(page, "edit");
  await expect(itemStyle(page).getByRole("heading", { name: "Mosaic" })).toBeVisible();

  await page.keyboard.press("Escape");
  await addArrowByDrag(page, ARROW_TAIL, ARROW_TIP);
  await editArrow(page);
  await expect(itemStyle(page).getByRole("heading", { name: "Arrow" })).toBeVisible();

  await page.keyboard.press("Escape");
  await addImage(page, "320x240.png");
  const image = imageItems(page).last();
  await image.click();
  await image.click();
  await expectMode(page, "edit");
  await expect(itemStyle(page).getByRole("heading", { name: "Image" })).toBeVisible();
  await expect(itemStyle(page).getByText("No styles")).toBeVisible();
});

test("recolors an arrow item from the item style", async ({ page }) => {
  await openApp(page);
  await addArrowByDrag(page, ARROW_TAIL, ARROW_TIP);
  await editArrow(page);

  await arrowColorSwatch(page, "Blue").click();

  await expect(arrowColorSwatch(page, "Blue")).toBeChecked();
  await expectMode(page, "edit");

  await page.keyboard.press("Escape");
  await expectMode(page, "select");
  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-arrow-recolored.png");
});

test("pixelates a mosaic item by the block size typed into the item style", async ({ page }) => {
  await openApp(page);
  const mosaic = await addMosaicByDrag(page, await addLabelledImage(page));
  await mosaic.click();
  await expectMode(page, "edit");
  await expect(blockSizeInput(page)).toHaveValue("8");
  const before = await boundingBoxOf(mosaic);

  await blockSizeInput(page).fill("16");
  await blockSizeInput(page).press("Enter");

  await expect(blockSizeInput(page)).toHaveValue("16");
  await expectMode(page, "edit");
  expect(await boundingBoxOf(mosaic)).toStrictEqual(before);

  await page.keyboard.press("Escape");
  await expectMode(page, "select");
  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-mosaic-coarsened.png", MOSAIC_PIXELS);
});

test("sets the line width typed into the item style, keeping the line where it is", async ({
  page,
}) => {
  await openApp(page);
  const rect = await addRectByDrag(page, SECOND_RANGE);
  await rect.click();
  await expectMode(page, "edit");
  await expect(lineWidthInput(page)).toHaveValue("4");
  const before = await boundingBoxOf(rectItems(page));

  await lineWidthInput(page).fill("12");
  await lineWidthInput(page).press("Enter");

  await expect(lineWidthInput(page)).toHaveValue("12");
  await expectMode(page, "edit");
  // the outline grows from ceil(4 * 1.7) = 7 to ceil(12 * 1.7) = 21 on both sides of the line.
  await expect
    .poll(async () => await boundingBoxOf(rectItems(page)))
    .toStrictEqual({
      x: before.x - 7,
      y: before.y - 7,
      width: before.width + 14,
      height: before.height + 14,
    });
});

test("restyles the line of a rect item from the item style", async ({ page }) => {
  await openApp(page);
  const rect = await addRectByDrag(page, SECOND_RANGE);
  await rect.click();

  await lineWidthInput(page).fill("8");
  await lineWidthInput(page).press("Enter");
  await lineColorSwatch(page, "Blue").click();

  await expect(lineColorSwatch(page, "Blue")).toBeChecked();
  await expectMode(page, "edit");

  await page.keyboard.press("Escape");
  await expectMode(page, "select");
  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-rect-restyled.png");
});

test("sets the font size typed into the item style, scaling the width with it", async ({
  page,
}) => {
  await openApp(page);
  const editor = await addTextByDrag(page, TEXT_RANGE, "Hello");
  await expect(fontSizeInput(page)).toHaveValue("32");

  await fontSizeInput(page).fill("48");
  await fontSizeInput(page).press("Enter");

  await expect(editor).toHaveCSS("font-size", "48px");
  await expect(editor).toHaveCSS("width", "600px");
  await expectMode(page, "edit");
});

test("sets the font size moved on the slider, keeping the input in step", async ({ page }) => {
  await openApp(page);
  const editor = await addTextByDrag(page, TEXT_RANGE, "Hello");

  await fontSizeSlider(page).focus();
  await page.keyboard.press("ArrowRight");

  await expect(editor).toHaveCSS("font-size", "33px");
  await expect(fontSizeInput(page)).toHaveValue("33");

  await page.keyboard.press("End");

  await expect(editor).toHaveCSS("font-size", "72px");
  await expect(fontSizeInput(page)).toHaveValue("72");
  await expectMode(page, "edit");
});

test("focuses the font size input on a click on its label", async ({ page }) => {
  await openApp(page);
  await addTextByDrag(page, TEXT_RANGE, "Hello");

  await fontSizeLabel(page).click();

  await expect(fontSizeInput(page)).toBeFocused();
  await expectMode(page, "edit");
});

test("clamps the font size typed into the item style", async ({ page }) => {
  await openApp(page);
  const editor = await addTextByDrag(page, TEXT_RANGE, "Hello");

  await fontSizeInput(page).fill("100");
  await fontSizeInput(page).press("Enter");

  await expect(editor).toHaveCSS("font-size", "72px");
  await expect(fontSizeInput(page)).toHaveValue("72");
});

test("sets the color picked on the item style", async ({ page }) => {
  await openApp(page);
  await addTextByDrag(page, TEXT_RANGE, "Hello");

  await textColorSwatch(page, "Blue").click();

  await expect(textColorSwatch(page, "Blue")).toBeChecked();
  await expectMode(page, "edit");
  await expect(textEditor(page)).toHaveValue("Hello");

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

  await textColorSwatch(page, "Blue").click();

  await expect(editor).toBeFocused();
  await page.keyboard.type("X");
  await expect(editor).toHaveValue("XHello");
  await page.keyboard.press("Backspace");
  await expect(editor).toHaveValue("Hello");
  await expectMode(page, "edit");
});
