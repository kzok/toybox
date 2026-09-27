import { expect, test } from "@playwright/test";
import {
  addText,
  confirmClearDialog,
  items,
  newInstance,
  openApp,
  pictureSize,
  saveAsImage,
} from "./helpers";

/** a range wide enough for the text below, dragged on an arbitrary spot of the pane. */
const TEXT_RANGE = { x: 200, y: 160, width: 400, height: 40 };

test("enables Save as image only when the picture has an item", async ({ page }) => {
  await openApp(page);

  await page.getByRole("button", { name: "File" }).click();
  await expect(page.getByRole("menuitem", { name: "Save as image" })).toBeDisabled();
  // the menu stays open around the disabled item, hence it has to be dismissed explicitly.
  await page.keyboard.press("Escape");

  await addText(page, TEXT_RANGE, "Hello");

  await page.getByRole("button", { name: "File" }).click();
  await expect(page.getByRole("menuitem", { name: "Save as image" })).toBeEnabled();
  await page.keyboard.press("Escape");
});

test("confirms before New instance discards unsaved items", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");

  await test.step("keep the picture when the confirmation is cancelled", async () => {
    await newInstance(page, "Cancel");
    await expect(items(page)).toHaveCount(1);
  });

  await test.step("discard the picture when the confirmation is accepted", async () => {
    await newInstance(page, "Discard Changes");
    await expect(items(page)).toHaveCount(0);
    await expect(pictureSize(page)).toHaveText("0 x 0");
  });
});

test("does not confirm again once the picture was saved", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");
  await saveAsImage(page);

  await newInstance(page);

  await expect(confirmClearDialog(page)).toBeHidden();
  await expect(items(page)).toHaveCount(0);
  await expect(pictureSize(page)).toHaveText("0 x 0");
});
