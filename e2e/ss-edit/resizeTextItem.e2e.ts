import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  addTextByDrag,
  bottomRightResizeHandle,
  boundingBoxOf,
  centerOf,
  dragBy,
  leaveEditMode,
  openApp,
  type Point,
  parkCursor,
  rightResizeHandle,
  saveAsImage,
  setNextTextFontSize,
} from "./helpers";

/**
 * a range whose width stays above `fontSize * 4` at the default 32px, so that the item starts out
 * exactly 400px wide at 32px. drawn, that is a 400 x 40 box: a single 40px line.
 * @note `x` keeps the item inside the pane when it grows to the maximum font size (900px wide).
 *   the resize handle outside the pane cannot be grabbed.
 */
const MAIN_RANGE = { x: 100, y: 160, width: 400, height: 40 };

/**
 * narrow enough that `WRAPPED_TEXT` cannot fit on a single line at 20px. drawn, a 240 x 50 box:
 * two 25px lines.
 */
const WRAPPED_RANGE = { x: 200, y: 160, width: 240, height: 25 };
/**
 * 22 full-width graphemes, which is what makes a re-wrap observable at all: a line of this range
 * holds 11 of them, so losing a single one per line spills the text onto a third line. at 20
 * graphemes the same drift stays hidden — both 10 and 11 per line come to two lines.
 */
const WRAPPED_TEXT = "あいうえおかきくけこさしすせそたちつてとなに";

/** adds `WRAPPED_TEXT` at 20px in `WRAPPED_RANGE`, leaving the editor open. */
const addWrappedText = async (page: Page): Promise<Locator> => {
  await setNextTextFontSize(page, 20);
  return addTextByDrag(page, WRAPPED_RANGE, WRAPPED_TEXT);
};

/** the item's laid out width and font size, which the resize has to keep proportional. */
const layoutOf = (editor: Locator): Promise<{ width: number; fontSize: number }> =>
  editor.evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: Number.parseFloat(style.width), fontSize: Number.parseFloat(style.fontSize) };
  });

/**
 * drags the handle by `delta`.
 * @note the handle sits centred on the item's bottom right corner, so its centre is where the
 *   resize measures from and a delta proportional to the drawn box lands back on the box's
 *   diagonal — which is the only direction the resize follows.
 */
const dragHandleBy = async (page: Page, delta: Point): Promise<void> => {
  await dragBy(page, centerOf(await boundingBoxOf(bottomRightResizeHandle(page))), delta);
};

/**
 * drags the width handle by `delta`.
 * @note it sits centred on the middle of the item's right edge, so its centre is the right edge
 *   of the drawn box — which is what the resize measures the new width from.
 */
const dragWidthHandleBy = async (page: Page, delta: Point): Promise<void> => {
  await dragBy(page, centerOf(await boundingBoxOf(rightResizeHandle(page))), delta);
};

test("scales the font size and the width together, keeping the top-left corner fixed", async ({
  page,
}) => {
  await openApp(page);
  const editor = await addTextByDrag(page, MAIN_RANGE, "Hello");

  const before = await boundingBoxOf(editor);
  const beforeLayout = await layoutOf(editor);

  // a quarter of the 400 x 40 box it is drawn as, hence a 1.25x target on the diagonal.
  await dragHandleBy(page, { x: 100, y: 10 });

  await expect(editor).toHaveCSS("font-size", "40px");

  const after = await boundingBoxOf(editor);
  const afterLayout = await layoutOf(editor);
  // the offset is the anchor of the resize, as it is for an image item.
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.y).toBeCloseTo(before.y, 0);
  // the width followed the font size: keeping the two proportional is what keeps the wrapping.
  expect(afterLayout.width).toBeGreaterThan(beforeLayout.width);
  expect(afterLayout.width / afterLayout.fontSize).toBeCloseTo(
    beforeLayout.width / beforeLayout.fontSize,
    0,
  );
});

test("keeps a wrapped text on the same number of lines", async ({ page }) => {
  await openApp(page);
  const editor = await addWrappedText(page);

  // the `rows` of the `<textarea/>` is the line count the text was laid out into.
  await expect(editor).toHaveAttribute("rows", "2");

  // half of the 240 x 50 box it is drawn as, hence a 1.5x target on the diagonal.
  await dragHandleBy(page, { x: 120, y: 25 });

  await expect(editor).toHaveCSS("font-size", "30px");
  // the point of scaling the width along with the font size: the text re-wraps the same way.
  await expect(editor).toHaveAttribute("rows", "2");
});

/**
 * the regression this guards: the letter spacing used to be rounded up to whole pixels, which put
 * the grapheme advance out of proportion with the font size and re-wrapped the text every few
 * pixels of a drag. a single before/after assertion misses that — the flicker is in between.
 */
test("does not re-wrap the text on the way through a drag", async ({ page }) => {
  await openApp(page);
  const editor = await addWrappedText(page);
  await expect(editor).toHaveAttribute("rows", "2");

  const handle = centerOf(await boundingBoxOf(bottomRightResizeHandle(page)));
  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();

  // out to the maximum font size, sampling the line count the whole way rather than at the ends.
  const steps = 40;
  const seen = new Set<string | null>();
  for (let step = 1; step <= steps; step++) {
    const ratio = step / steps;
    await page.mouse.move(handle.x + 624 * ratio, handle.y + 130 * ratio);
    seen.add(await editor.getAttribute("rows"));
  }
  await page.mouse.up();

  expect(await editor.evaluate((element) => getComputedStyle(element).fontSize)).toBe("72px");
  // every sample laid the text out into the same two lines.
  expect([...seen]).toEqual(["2"]);
});

test("clamps the font size at both ends of the drag", async ({ page }) => {
  await openApp(page);
  const editor = await addTextByDrag(page, MAIN_RANGE, "Hello");

  await test.step("stop growing at the maximum font size", async () => {
    await dragHandleBy(page, { x: 2000, y: 2000 * (40 / 400) });
    await expect(editor).toHaveCSS("font-size", "72px");
    const layout = await layoutOf(editor);
    // the width stopped along with the font size instead of running away from it.
    expect(layout.width / layout.fontSize).toBeCloseTo(400 / 32, 0);
  });

  await test.step("stop shrinking at the minimum font size", async () => {
    await dragHandleBy(page, { x: -2000, y: -2000 * (40 / 400) });
    await expect(editor).toHaveCSS("font-size", "12px");
    const layout = await layoutOf(editor);
    expect(layout.width / layout.fontSize).toBeCloseTo(400 / 32, 0);
  });
});

test("keeps the resized text in the exported picture", async ({ page }) => {
  await openApp(page);
  await addTextByDrag(page, MAIN_RANGE, "Hello");

  await dragHandleBy(page, { x: 100, y: 10 });
  await leaveEditMode(page);

  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-resized-text.png");
  expect.soft(await saveAsImage(page)).toMatchSnapshot("export-resized-text.png");
});

test("narrows the width alone, re-wrapping the text at the same font size", async ({ page }) => {
  await openApp(page);
  const editor = await addWrappedText(page);
  await expect(editor).toHaveAttribute("rows", "2");

  const before = await boundingBoxOf(editor);

  // the handle sits on the right edge of the 240px box, so -20 asks for a 220px width.
  await dragWidthHandleBy(page, { x: -20, y: 0 });

  // re-wrapping is the point of this handle, unlike the one on the corner.
  await expect(editor).toHaveAttribute("rows", "3");
  await expect(editor).toHaveCSS("font-size", "20px");
  await expect(editor).toHaveCSS("width", "220px");

  // the offset is the anchor of the resize, as it is for the handle on the corner.
  const after = await boundingBoxOf(editor);
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.y).toBeCloseTo(before.y, 0);
});

test("widens the width alone, leaving the font size where it was", async ({ page }) => {
  await openApp(page);
  const editor = await addWrappedText(page);

  await dragWidthHandleBy(page, { x: 100, y: 0 });

  await expect(editor).toHaveCSS("width", "340px");
  await expect(editor).toHaveCSS("font-size", "20px");
  // wide enough to hold more graphemes per line, but not all 22 of them.
  await expect(editor).toHaveAttribute("rows", "2");
});

test("stops narrowing at the minimum width", async ({ page }) => {
  await openApp(page);
  const editor = await addWrappedText(page);

  await dragWidthHandleBy(page, { x: -2000, y: 0 });

  // four graphemes' worth of the font size, the same floor a new text item is given.
  await expect(editor).toHaveCSS("width", "80px");
  await expect(editor).toHaveCSS("font-size", "20px");
});

test("keeps the narrowed text in the exported picture", async ({ page }) => {
  await openApp(page);
  await addWrappedText(page);

  await dragWidthHandleBy(page, { x: -20, y: 0 });
  await leaveEditMode(page);

  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-narrowed-text.png");
  expect.soft(await saveAsImage(page)).toMatchSnapshot("export-narrowed-text.png");
});
