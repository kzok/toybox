import { expect, test } from "@playwright/test";
import {
  addImage,
  addItemLayer,
  boundingBoxOf,
  dragFromTo,
  enterAddRect,
  expectBoxOnScreen,
  expectMode,
  growBox,
  imageItems,
  openApp,
  paneRectToViewport,
  parkCursor,
  pictureSize,
  rectItems,
  saveAsPng,
} from "./helpers";

/** a range dragged on an arbitrary spot of the pane. */
const MAIN_RANGE = { x: 200, y: 160, width: 400, height: 100 };
/**
 * a new rect is given a 4px line, whose outline is `ceil(4 * 1.6)` = 7px wide. half of that lies
 * outside the line's own box on every edge, hence 7px on both the width and the height.
 */
const MAIN_RANGE_OUTLINE = 7;

test("adds a rect item by dragging a range", async ({ page }) => {
  await openApp(page);

  const range = await paneRectToViewport(page, MAIN_RANGE);

  await test.step("enter add-item mode from the Edit menu", async () => {
    await enterAddRect(page);
    // the affordance of the mode: the whole pane offers to draw a new item.
    await expect(addItemLayer(page)).toHaveCSS("cursor", "copy");
  });

  await test.step("leave the rect selected once released", async () => {
    await dragFromTo(
      page,
      { x: range.x, y: range.y },
      { x: range.x + range.width, y: range.y + range.height },
    );
    // a text item arrives blank and opens its editor; a rect is finished the moment it is drawn,
    // so the drag leaves it selected instead.
    await expectMode(page, "select");
    await expect(rectItems(page)).toHaveCount(1);
    await expect(rectItems(page).first()).toHaveAttribute("data-selected", "true");
    await expectBoxOnScreen(rectItems(page).first(), growBox(range, MAIN_RANGE_OUTLINE));
  });

  await test.step("paint the rect onto the canvas", async () => {
    // drop the selection first, so the baseline holds what the canvas paints rather than the
    // selection tint laid over it.
    await page.keyboard.press("Escape");
    await parkCursor(page);
    await expect.soft(page).toHaveScreenshot("screenshot-rect-added.png");
    // the picture spans the dragged range grown by the outline on every side.
    await expect(pictureSize(page)).toHaveText("407 x 107");
    expect.soft(await saveAsPng(page)).toMatchSnapshot("export-rect.png");
  });
});

test("falls back to the minimum size when clicked without dragging", async ({ page }) => {
  await openApp(page);
  await enterAddRect(page);

  const point = await paneRectToViewport(page, { ...MAIN_RANGE, width: 0, height: 0 });
  await page.mouse.click(point.x, point.y);

  await expectMode(page, "select");
  // an empty range falls back to the minimum side of 36px, which the outline grows to 43px.
  await expect(rectItems(page)).toHaveCount(1);
  await expect(pictureSize(page)).toHaveText("43 x 43");
});

test("sorts the corners of a range dragged up and left", async ({ page }) => {
  await openApp(page);

  const range = await paneRectToViewport(page, MAIN_RANGE);
  await enterAddRect(page);
  await dragFromTo(
    page,
    { x: range.x + range.width, y: range.y + range.height },
    { x: range.x, y: range.y },
  );

  // the item is anchored on the top left corner no matter which way the range was drawn.
  await expectBoxOnScreen(rectItems(page).first(), growBox(range, MAIN_RANGE_OUTLINE));
});

test("takes the pointer anywhere within the rectangle", async ({ page }) => {
  await openApp(page);
  await addImage(page, "320x240.png");

  const image = imageItems(page).first();
  const imageBox = await boundingBoxOf(image);

  await test.step("draw a rect well inside the image", async () => {
    await enterAddRect(page);
    await dragFromTo(
      page,
      { x: imageBox.x + 40, y: imageBox.y + 40 },
      { x: imageBox.x + imageBox.width - 40, y: imageBox.y + imageBox.height - 40 },
    );
    await expectMode(page, "select");
  });

  const rect = rectItems(page).first();
  await expect(rect).toHaveAttribute("data-selected", "true");

  await page.keyboard.press("Escape");
  await expect(rect).toHaveAttribute("data-selected", "false");

  await test.step("click the middle, where the image sits underneath", async () => {
    await rect.click();
    // the whole box takes the pointer, not the outline alone, so the rect comes back rather than
    // the image it is drawn around.
    await expect(rect).toHaveAttribute("data-selected", "true");
    await expect(image).toHaveAttribute("data-selected", "false");
  });
});
