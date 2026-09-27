import { expect, test } from "@playwright/test";
import {
  addItemLayer,
  type Box,
  boundingBoxOf,
  commitText,
  dragBy,
  dragFromTo,
  editorPane,
  enterAddText,
  expectBoxOnScreen,
  expectMode,
  openApp,
  paneRectToViewport,
  parkCursor,
  pictureSize,
  rangePreview,
  saveAsImage,
  textEditor,
  textItems,
  typeText,
  zoomTo,
} from "./helpers";

/**
 * a range dragged on an arbitrary spot of the pane. the height drives the font size
 * (`round(40 / 1.25)` = 32px) and the width is kept above `fontSize * 10`, so that the item's
 * layout (its wrap width and the dragged font size) keeps exactly the dragged size.
 */
const MAIN_RANGE = { x: 200, y: 160, width: 400, height: 40 };

test("adds a text item by dragging a range", async ({ page }) => {
  await openApp(page);

  const range = await paneRectToViewport(page, MAIN_RANGE);

  await test.step("enter add-item mode from the Edit menu", async () => {
    await enterAddText(page);
    // the affordance of the mode: the whole pane offers to draw a new item.
    await expect(addItemLayer(page)).toHaveCSS("cursor", "copy");
    await expect(rangePreview(page)).toBeHidden();
  });

  await test.step("preview the range while it is being dragged", async () => {
    await page.mouse.move(range.x, range.y);
    await page.mouse.down();
    await page.mouse.move(range.x + range.width, range.y + range.height, { steps: 8 });

    await expect(rangePreview(page)).toBeVisible();
    await expectBoxOnScreen(rangePreview(page), range);
    await expect.soft(page).toHaveScreenshot("screenshot-range-dragged.png");
  });

  await test.step("open an empty editor sized after the range once released", async () => {
    await page.mouse.up();
    await expectMode(page, "edit");

    const editor = textEditor(page);
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue("");
    await expect(editor).toHaveCSS("font-size", "32px");
    await expect(editor).toHaveCSS("width", "400px");
    await expectBoxOnScreen(editor, range);
  });

  await test.step("paint the typed text onto the canvas", async () => {
    await typeText(page, "Hello");
    await parkCursor(page);
    await expect.soft(page).toHaveScreenshot("screenshot-text-typed.png");
  });

  await test.step("keep the text as an item once the edit ends", async () => {
    await commitText(page);
    await expect(textItems(page)).toHaveCount(1);
    await expect(textItems(page).first()).toHaveText("Hello");
    // the picture spans the width of the item and a single line of its line height.
    await expect(pictureSize(page)).toHaveText("400 x 40");
    expect.soft(await saveAsImage(page)).toMatchSnapshot("export-text.png");
  });
});

test("falls back to the minimum size when clicked without dragging", async ({ page }) => {
  await openApp(page);
  await enterAddText(page);

  const point = await paneRectToViewport(page, { ...MAIN_RANGE, width: 0, height: 0 });
  await page.mouse.click(point.x, point.y);

  await expectMode(page, "edit");
  // an empty range falls back to the minimum font size, and the width to `fontSize * 10`.
  await expect(textEditor(page)).toHaveCSS("font-size", "12px");
  await expect(textEditor(page)).toHaveCSS("width", "120px");
});

test("sorts the corners of a range dragged up and left", async ({ page }) => {
  await openApp(page);

  const range = await paneRectToViewport(page, MAIN_RANGE);
  await enterAddText(page);
  await dragFromTo(
    page,
    { x: range.x + range.width, y: range.y + range.height },
    { x: range.x, y: range.y },
  );

  // the item is anchored on the top left corner no matter which way the range was drawn.
  await expectBoxOnScreen(textEditor(page), range);
  await typeText(page, "Hello");
  await commitText(page);
  await expectBoxOnScreen(textItems(page).first(), range);
});

test("clamps the font size of a tall range", async ({ page }) => {
  await openApp(page);

  const range = await paneRectToViewport(page, { ...MAIN_RANGE, height: 300 });
  await enterAddText(page);
  await dragFromTo(page, range, { x: range.x + range.width, y: range.y + range.height });

  // `round(300 / 1.25)` would be 240px, which is clamped down to the maximum.
  await expect(textEditor(page)).toHaveCSS("font-size", "72px");
  // the minimum width of `fontSize * 10` now exceeds the dragged width.
  await expect(textEditor(page)).toHaveCSS("width", "720px");
});

test("discards a text item left blank", async ({ page }) => {
  await openApp(page);

  const range = await paneRectToViewport(page, MAIN_RANGE);
  await enterAddText(page);
  await dragFromTo(page, range, { x: range.x + range.width, y: range.y + range.height });
  await expectMode(page, "edit");

  await commitText(page);

  // nothing was typed, hence the item never made it into the picture.
  await expect(textItems(page)).toHaveCount(0);
  await expect(pictureSize(page)).toHaveText("0 x 0");
});

test("wraps a long text into multiple lines", async ({ page }) => {
  await openApp(page);

  /** narrow enough that the text below cannot fit on a single line. */
  const narrowRange = { x: 200, y: 160, width: 240, height: 25 };
  const range = await paneRectToViewport(page, narrowRange);
  await enterAddText(page);
  await dragFromTo(page, range, { x: range.x + range.width, y: range.y + range.height });
  await typeText(page, "あいうえおかきくけこさしすせそたちつてと");

  // `textStyleSizeOf()` gives a 25px `lineHeight` at 20px, so more than one line means the
  //   editor grew past that.
  const editorBox = await boundingBoxOf(textEditor(page));
  expect(editorBox.height).toBeGreaterThanOrEqual(50);

  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-text-wrapped.png");

  await commitText(page);
  expect.soft(await saveAsImage(page)).toMatchSnapshot("export-text-wrapped.png");
});

test("adds the text where it was dragged after zooming and panning", async ({ page }) => {
  await openApp(page);
  await zoomTo(page, 150);

  await test.step("pan the view so that the canvas origin is off center", async () => {
    const pane = await boundingBoxOf(editorPane(page));
    await dragBy(page, { x: pane.x + 40, y: pane.y + pane.height - 60 }, { x: 50, y: 30 });
  });

  /**
   * 600 x 60 on screen is 400 x 40 on the canvas at 150%, which keeps the width above
   * `fontSize * 10` and hence makes the item's layout match the dragged range again.
   */
  const range: Box = await paneRectToViewport(page, { x: 200, y: 160, width: 600, height: 60 });
  await enterAddText(page);
  await dragFromTo(page, range, { x: range.x + range.width, y: range.y + range.height });
  await typeText(page, "Hello");
  await commitText(page);

  // the range is mapped through the current offset and scale, so it lands where it was drawn.
  await expectBoxOnScreen(textItems(page).first(), range);
  // ...while the item itself is stored in canvas coordinates, free of the view and its zoom.
  await expect(pictureSize(page)).toHaveText("400 x 40");
});
