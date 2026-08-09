import { expect, test } from "@playwright/test";
import {
  addImage,
  expectAppFitsWindow,
  expectCanvasFitsPane,
  expectCenteredInPane,
  imageItems,
  openApp,
  parkCursor,
} from "./helpers";

test("fits the canvas to the window and keeps the picture on its center", async ({ page }) => {
  await openApp(page);
  await addImage(page, "320x240.png");

  const image320x240 = imageItems(page).first();

  await expectAppFitsWindow(page);
  await expectCanvasFitsPane(page);
  await expectCenteredInPane(page, image320x240);

  // the canvas size follows the pane through a ResizeObserver. the window must stay within the
  // minimum size of the app (`min-width: 800px` / `min-height: 600px` on the body), below which
  // the body overflows the window on purpose.
  await page.setViewportSize({ width: 1000, height: 640 });

  await expectAppFitsWindow(page);
  await expectCanvasFitsPane(page);
  await expectCenteredInPane(page, image320x240);
  await parkCursor(page);
  await expect(page).toHaveScreenshot("screenshot-resized.png");
});
