import { expect, test } from "@playwright/test";
import {
  addImage,
  addItemLayer,
  arrowItems,
  arrowTailHandle,
  arrowTipHandle,
  boundingBoxOf,
  dragFromTo,
  editArrow,
  enterAddArrow,
  expectBoxOnScreen,
  expectCenteredAt,
  expectMode,
  imageItems,
  openApp,
  type Point,
  panePointToViewport,
  parkCursor,
  pictureSize,
  rangePreview,
  saveAsPng,
} from "./helpers";

/** an arrow dragged left to right on an arbitrary spot of the pane, 400px long. */
const MAIN_TAIL: Point = { x: 200, y: 220 };
const MAIN_TIP: Point = { x: 600, y: 220 };

/**
 * how far the drawing spreads either side of the line from the tail to the tip: half the width of
 * the arrowhead plus the white band around it. the overlay takes the pointer over exactly that
 * much, so it is both the height of the band and what the picture is grown by on every side.
 */
const ARROW_SPREAD = 19.5;

/** the band a horizontal arrow occupies on screen, in viewport coordinates. */
const bandOf = (tail: Point, tip: Point) => ({
  x: tail.x,
  y: tail.y - ARROW_SPREAD,
  width: tip.x - tail.x,
  height: ARROW_SPREAD * 2,
});

test("adds an arrow item by dragging from its tail to its tip", async ({ page }) => {
  await openApp(page);

  const tail = await panePointToViewport(page, MAIN_TAIL);
  const tip = await panePointToViewport(page, MAIN_TIP);

  await test.step("enter add-item mode from the Edit menu", async () => {
    await enterAddArrow(page);
    // the affordance of the mode: the whole pane offers to draw a new item.
    await expect(addItemLayer(page)).toHaveCSS("cursor", "copy");
    await expect(rangePreview(page)).toBeHidden();
  });

  await test.step("preview the arrow while it is being dragged", async () => {
    await page.mouse.move(tail.x, tail.y);
    await page.mouse.down();
    await page.mouse.move(tip.x, tip.y, { steps: 8 });

    await expect(rangePreview(page)).toBeVisible();
    // the preview is the band the finished arrow will answer the pointer over, not the box the
    // drag spans: it is centred on the line rather than hanging off one side of it.
    await expectBoxOnScreen(rangePreview(page), bandOf(tail, tip));
  });

  await test.step("leave the arrow selected once released", async () => {
    await page.mouse.up();
    // a text item arrives blank and opens its editor; an arrow is finished the moment it is drawn,
    // so the drag leaves it selected instead.
    await expectMode(page, "select");
    await expect(arrowItems(page)).toHaveCount(1);
    await expect(arrowItems(page).first()).toHaveAttribute("data-selected", "true");
    // the same band the preview showed, which is the point of drawing the preview that way.
    await expectBoxOnScreen(arrowItems(page).first(), bandOf(tail, tip));
  });

  await test.step("paint the arrow onto the canvas", async () => {
    // drop the selection first, so the baseline holds what the canvas paints rather than the
    // selection tint laid over it.
    await page.keyboard.press("Escape");
    await parkCursor(page);
    await expect.soft(page).toHaveScreenshot("screenshot-arrow-added.png");
    // the picture spans the tail-to-tip line grown by the spread on every side.
    await expect(pictureSize(page)).toHaveText("439 x 39");
    expect.soft(await saveAsPng(page)).toMatchSnapshot("export-arrow.png");
  });
});

test("falls back to the minimum length when clicked without dragging", async ({ page }) => {
  await openApp(page);
  await enterAddArrow(page);

  const point = await panePointToViewport(page, MAIN_TAIL);
  await page.mouse.click(point.x, point.y);

  await expectMode(page, "select");
  await expect(arrowItems(page)).toHaveCount(1);
  // an empty drag falls back to the minimum length of 120px, which the spread grows to 159px. it
  // points right, `Math.atan2(0, 0)` being +0, so the height stays the band's own.
  await expect(pictureSize(page)).toHaveText("159 x 39");
});

test("points from the end of the drag back to where it began", async ({ page }) => {
  await openApp(page);

  const tail = await panePointToViewport(page, MAIN_TIP);
  const tip = await panePointToViewport(page, MAIN_TAIL);
  await enterAddArrow(page);
  await dragFromTo(page, tail, tip);

  // NOTE: the case a normalised box loses. the arrow is the same band either way round, so the
  //   handles are what tell the two apart: the tail belongs where the drag went down, however far
  //   left of the tip that leaves it.
  await editArrow(page);
  await expectCenteredAt(arrowTailHandle(page), tail);
  await expectCenteredAt(arrowTipHandle(page), tip);
});

test("takes the pointer along the arrow rather than over the box it spans", async ({ page }) => {
  await openApp(page);
  await addImage(page, "320x240.png");

  const image = imageItems(page).first();
  const imageBox = await boundingBoxOf(image);
  const from = { x: imageBox.x + 40, y: imageBox.y + 40 };
  const to = { x: imageBox.x + imageBox.width - 40, y: imageBox.y + imageBox.height - 40 };

  await test.step("draw an arrow diagonally across the image", async () => {
    await enterAddArrow(page);
    await dragFromTo(page, from, to);
    await expectMode(page, "select");
  });

  const arrow = arrowItems(page).first();
  await page.keyboard.press("Escape");
  await expect(arrow).toHaveAttribute("data-selected", "false");

  await test.step("click a corner of the box the arrow spans, well off the arrow itself", async () => {
    await page.mouse.click(to.x, from.y);
    // deliberately unlike a rect, which takes the pointer over its whole box. the box of a
    // diagonal arrow is mostly empty, and taking all of it would put the image out of reach.
    await expect(arrow).toHaveAttribute("data-selected", "false");
    await expect(image).toHaveAttribute("data-selected", "true");
  });

  await test.step("click the middle of the arrow, where the image sits underneath", async () => {
    await page.mouse.click((from.x + to.x) / 2, (from.y + to.y) / 2);
    await expect(arrow).toHaveAttribute("data-selected", "true");
    await expect(image).toHaveAttribute("data-selected", "false");
  });
});
