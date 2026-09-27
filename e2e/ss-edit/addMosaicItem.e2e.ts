import { expect, test } from "@playwright/test";
import {
  addItemLayer,
  addLabelledImage,
  addMosaicByDrag,
  addRectByDrag,
  dragFromTo,
  enterAddMosaic,
  expectBoxOnScreen,
  expectMode,
  imageItems,
  MOSAIC_PIXELS,
  mosaicItems,
  openApp,
  paneRectToViewport,
  parkCursor,
  pictureSize,
  saveAsImage,
} from "./helpers";

test("adds a mosaic item by dragging a range", async ({ page }) => {
  await openApp(page);
  const label = await addLabelledImage(page);
  const range = await paneRectToViewport(page, label);

  await test.step("enter add-item mode from the Edit menu", async () => {
    await enterAddMosaic(page);
    await expect(addItemLayer(page)).toHaveCSS("cursor", "copy");
  });

  await test.step("leave the mosaic selected once released", async () => {
    await dragFromTo(
      page,
      { x: range.x, y: range.y },
      { x: range.x + range.width, y: range.y + range.height },
    );
    await expectMode(page, "select");
    await expect(mosaicItems(page)).toHaveCount(1);
    await expect(mosaicItems(page).first()).toHaveAttribute("data-selected", "true");
    // nothing is drawn outside the item, so the box is the dragged range as it is.
    await expectBoxOnScreen(mosaicItems(page).first(), range);
  });

  await test.step("pixelate the label on the canvas and in the export", async () => {
    await page.keyboard.press("Escape");
    await parkCursor(page);
    await expect.soft(page).toHaveScreenshot("screenshot-mosaic-added.png", MOSAIC_PIXELS);
    // the mosaic lies within the image, hence the picture stays the image.
    await expect(pictureSize(page)).toHaveText("320 x 240");
    expect.soft(await saveAsImage(page)).toMatchSnapshot("export-mosaic.png", MOSAIC_PIXELS);
  });
});

test("falls back to the minimum size when clicked without dragging", async ({ page }) => {
  await openApp(page);
  await enterAddMosaic(page);

  const point = await paneRectToViewport(page, { x: 200, y: 160, width: 0, height: 0 });
  await page.mouse.click(point.x, point.y);

  await expectMode(page, "select");
  await expect(mosaicItems(page)).toHaveCount(1);
  await expect(pictureSize(page)).toHaveText("16 x 16");
});

test("selects the mosaic over the image and deletes it on Delete", async ({ page }) => {
  await openApp(page);
  const label = await addLabelledImage(page);
  const mosaic = await addMosaicByDrag(page, label);

  await page.keyboard.press("Escape");
  await expect(mosaic).toHaveAttribute("data-selected", "false");

  await test.step("click the middle, where the image sits underneath", async () => {
    await mosaic.click();
    await expect(mosaic).toHaveAttribute("data-selected", "true");
    await expect(imageItems(page).first()).toHaveAttribute("data-selected", "false");
  });

  await test.step("delete the mosaic alone", async () => {
    await page.keyboard.press("Delete");
    await expect(mosaicItems(page)).toHaveCount(0);
    await expect(imageItems(page)).toHaveCount(1);
  });
});

test("pixelates only what lies behind it", async ({ page }) => {
  await openApp(page);
  const label = await addLabelledImage(page);
  await addMosaicByDrag(page, label);
  // added after the mosaic, hence in front of it and left sharp.
  await addRectByDrag(page, {
    x: label.x + 60,
    y: label.y + 10,
    width: label.width - 120,
    height: label.height - 20,
  });

  await page.keyboard.press("Escape");
  expect
    .soft(await saveAsImage(page))
    .toMatchSnapshot("export-mosaic-behind-rect.png", MOSAIC_PIXELS);
});
