import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  addTextByDrag,
  boundingBoxOf,
  centerOf,
  commitText,
  dragBy,
  openApp,
  type Point,
  parkCursor,
  resizeHandle,
  saveAsPng,
} from "./helpers";

/**
 * a range whose height drives the font size (`round(48 / 1.5)` = 32px) and whose width stays above
 * `fontSize * 10`, so that the item starts out exactly 400px wide at 32px. drawn, that is a
 * 408 x 56 box: `paddingOf(32)` is 4px, added on every side of a single 48px line.
 */
const MAIN_RANGE = { x: 200, y: 160, width: 400, height: 48 };

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
  await dragBy(page, centerOf(await boundingBoxOf(resizeHandle(page))), delta);
};

test("scales the font size and the width together, keeping the top-left corner fixed", async ({
  page,
}) => {
  await openApp(page);
  const editor = await addTextByDrag(page, MAIN_RANGE, "Hello");

  const before = await boundingBoxOf(editor);
  const beforeLayout = await layoutOf(editor);

  // a quarter of the 408 x 56 box it is drawn as, hence a 1.25x target on the diagonal.
  await dragHandleBy(page, { x: 102, y: 14 });

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
  /** narrow enough that the text below cannot fit on a single line. */
  const narrowRange = { x: 200, y: 160, width: 240, height: 30 };
  const editor = await addTextByDrag(page, narrowRange, "あいうえおかきくけこさしすせそたちつてと");

  // the `rows` of the `<textarea/>` is the line count the text was laid out into.
  await expect(editor).toHaveAttribute("rows", "2");

  // half of the 244 x 64 box it is drawn as, hence a 1.5x target on the diagonal.
  await dragHandleBy(page, { x: 122, y: 32 });

  await expect(editor).toHaveCSS("font-size", "30px");
  // the point of scaling the width along with the font size: the text re-wraps the same way.
  await expect(editor).toHaveAttribute("rows", "2");
});

test("clamps the font size at both ends of the drag", async ({ page }) => {
  await openApp(page);
  const editor = await addTextByDrag(page, MAIN_RANGE, "Hello");

  await test.step("stop growing at the maximum font size", async () => {
    await dragHandleBy(page, { x: 2000, y: 2000 * (56 / 408) });
    await expect(editor).toHaveCSS("font-size", "72px");
    const layout = await layoutOf(editor);
    // the width stopped along with the font size instead of running away from it.
    expect(layout.width / layout.fontSize).toBeCloseTo(400 / 32, 0);
  });

  await test.step("stop shrinking at the minimum font size", async () => {
    await dragHandleBy(page, { x: -2000, y: -2000 * (56 / 408) });
    await expect(editor).toHaveCSS("font-size", "12px");
    const layout = await layoutOf(editor);
    expect(layout.width / layout.fontSize).toBeCloseTo(400 / 32, 0);
  });
});

test("keeps the resized text in the exported picture", async ({ page }) => {
  await openApp(page);
  await addTextByDrag(page, MAIN_RANGE, "Hello");

  await dragHandleBy(page, { x: 102, y: 14 });
  await commitText(page);

  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-resized-text.png");
  expect.soft(await saveAsPng(page)).toMatchSnapshot("export-resized-text.png");
});
