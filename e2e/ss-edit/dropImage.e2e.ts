import { expect, test } from "@playwright/test";
import {
  dataTransferOf,
  dispatchDrag,
  dropOverlay,
  expectCenteredInPane,
  imageItems,
  openApp,
  pictureSize,
} from "./helpers";

test("adds an image dropped anywhere in the window", async ({ page }) => {
  await openApp(page);

  const items = imageItems(page);
  const dataTransfer = await dataTransferOf(page, ["320x240.png"]);

  await test.step("show the overlay while the file is dragged over the window", async () => {
    await expect(dropOverlay(page)).toBeHidden();
    await dispatchDrag(dataTransfer, "dragenter");
    await expect(dropOverlay(page)).toBeVisible();
  });

  await test.step("add the image on the center of the pane once dropped", async () => {
    await dispatchDrag(dataTransfer, "drop");
    await expect(items).toHaveCount(1);
    await expect(dropOverlay(page)).toBeHidden();
    await expect(pictureSize(page)).toHaveText("320 x 240");
    await expectCenteredInPane(page, items.first());
  });
});

test("adds every image of a multi-file drop", async ({ page }) => {
  await openApp(page);

  const dataTransfer = await dataTransferOf(page, ["320x240.png", "200x200.png"]);
  await dispatchDrag(dataTransfer, "dragenter");
  await dispatchDrag(dataTransfer, "drop");

  await expect(imageItems(page)).toHaveCount(2);
  // the 200x200 one is centered 32 below the 320x240 one, hence 120 + 100 + 32 tall.
  await expect(pictureSize(page)).toHaveText("320 x 252");
});

test("hides the overlay when the drag leaves the window without dropping", async ({ page }) => {
  await openApp(page);

  const dataTransfer = await dataTransferOf(page, ["320x240.png"]);
  await dispatchDrag(dataTransfer, "dragenter");
  await expect(dropOverlay(page)).toBeVisible();

  await dispatchDrag(dataTransfer, "dragleave");
  await expect(dropOverlay(page)).toBeHidden();
  await expect(imageItems(page)).toHaveCount(0);
});
