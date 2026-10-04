import { expect, test } from "@playwright/test";
import {
  addImage,
  bottomRightResizeHandle,
  boundingBoxOf,
  centerOf,
  dragBy,
  expectBoxOnScreen,
  expectMode,
  imageItems,
  leaveEditMode,
  openApp,
  parkCursor,
  saveAsImage,
} from "./helpers";

test("resizes the image by dragging the handle, keeping the aspect ratio and the top-left corner fixed", async ({
  page,
}) => {
  await openApp(page);
  await addImage(page, "320x240.png");

  const item = imageItems(page).first();
  await item.click();
  await item.click();
  await expectMode(page, "edit");

  const before = await boundingBoxOf(item);
  const handle = bottomRightResizeHandle(page);

  // proportional to the item's current on-screen aspect ratio, so the handle ends up exactly under
  // the cursor regardless of the canvas zoom level. this also exercises the multi-step drag
  // (`dragBy` moves the pointer in several steps) without drifting away from that target.
  const delta = { x: 80, y: (80 * before.height) / before.width };

  await dragBy(page, centerOf(await boundingBoxOf(handle)), delta);

  await expectBoxOnScreen(item, {
    x: before.x,
    y: before.y,
    width: before.width + delta.x,
    height: before.height + delta.y,
  });
});

test("does not collapse the image below the minimum size", async ({ page }) => {
  await openApp(page);
  await addImage(page, "320x240.png");

  const item = imageItems(page).first();
  await item.click();
  await item.click();
  await expectMode(page, "edit");

  const before = await boundingBoxOf(item);
  const handle = bottomRightResizeHandle(page);

  await dragBy(page, centerOf(await boundingBoxOf(handle)), {
    x: -before.width,
    y: -before.height,
  });

  const after = await boundingBoxOf(item);
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.y).toBeCloseTo(before.y, 0);
  expect(after.width).toBeGreaterThan(0);
  expect(after.width).toBeLessThan(before.width);
});

test("keeps the resized image in the exported picture", async ({ page }) => {
  await openApp(page);
  await addImage(page, "320x240.png");

  const item = imageItems(page).first();
  await item.click();
  await item.click();
  await expectMode(page, "edit");

  const before = await boundingBoxOf(item);
  const handle = bottomRightResizeHandle(page);
  const delta = { x: 80, y: (80 * before.height) / before.width };
  await dragBy(page, centerOf(await boundingBoxOf(handle)), delta);

  await leaveEditMode(page);

  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-resized.png");
  expect.soft(await saveAsImage(page)).toMatchSnapshot("export-resized.png");
});
