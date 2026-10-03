import { expect, test } from "@playwright/test";
import {
  addRectByDrag,
  addText,
  addTextByDrag,
  boundingBoxOf,
  centerOf,
  confirmClearDialog,
  dragBy,
  enterAddText,
  expectMode,
  items,
  newInstance,
  openApp,
  rightResizeHandle,
  saveImageDialog,
  textItems,
} from "./helpers";

/** a range wide enough for the text below, dragged on an arbitrary spot of the pane. */
const TEXT_RANGE = { x: 200, y: 160, width: 400, height: 40 };
/** a second range, clear of `TEXT_RANGE`, for the tests that need two items. */
const SECOND_RANGE = { x: 200, y: 300, width: 400, height: 40 };

test("opens the save dialog while the text editor holds the focus", async ({ page }) => {
  await openApp(page);
  await addTextByDrag(page, TEXT_RANGE, "Hello");
  await expectMode(page, "edit");

  // NOTE: the hotkey listens on `document`, so the `<textarea/>` has to let the key bubble past
  // it. stopping `keydown` there swallows the save and hands Ctrl+S back to the browser.
  await page.keyboard.press("ControlOrMeta+s");

  await expect(saveImageDialog(page)).toBeVisible();
});

test("opens a single dialog while the keys are held down", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");

  // NOTE: records `event.repeat` of every "s" keydown. without it a run where the browser sent
  // no auto-repeat at all would pass this test without having exercised anything.
  const repeats: boolean[] = [];
  await page.exposeFunction("recordSaveKeydown", (repeat: boolean) => void repeats.push(repeat));
  await page.evaluate(() => {
    const record = Reflect.get(window, "recordSaveKeydown") as (repeat: boolean) => void;
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key.toLowerCase() === "s") record(e.repeat);
      },
      true,
    );
  });

  await page.keyboard.down("Control");
  await page.keyboard.down("s");
  await page.keyboard.down("s");
  await page.keyboard.down("s");

  await expect.poll(() => repeats).toEqual([false, true, true]);
  await page.keyboard.up("s");
  await page.keyboard.up("Control");
  await expect(saveImageDialog(page)).toBeVisible();

  // NOTE: only the top of the dialog stack is rendered, hence a second dialog stacked by a repeat
  // shows up only once the first one is closed.
  await saveImageDialog(page).getByRole("button", { name: "Cancel" }).click();
  await expect(saveImageDialog(page)).toBeHidden();
});

test("stays out while a dialog is open", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");

  await newInstance(page);
  await expect(confirmClearDialog(page)).toBeVisible();
  await page.keyboard.press("ControlOrMeta+s");
  // NOTE: there is nothing to wait for when the hotkey is meant not to fire, hence the pause
  // before concluding that it never did.
  await page.waitForTimeout(500);
  await expect(saveImageDialog(page)).toBeHidden();
  await expect(confirmClearDialog(page)).toBeVisible();

  await test.step("and works again once the dialog is gone", async () => {
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(confirmClearDialog(page)).toBeHidden();

    await page.keyboard.press("ControlOrMeta+s");
    await expect(saveImageDialog(page)).toBeVisible();
  });
});

test("drops the selection on Escape", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");
  await textItems(page).first().click();
  await expect(textItems(page).first()).toHaveAttribute("data-selected", "true");

  await page.keyboard.press("Escape");

  await expectMode(page, "select");
  await expect(textItems(page).first()).toHaveAttribute("data-selected", "false");
});

test("ends the edit on Escape, keeping the item", async ({ page }) => {
  await openApp(page);
  await addTextByDrag(page, TEXT_RANGE, "Hello");
  await expectMode(page, "edit");

  await page.keyboard.press("Escape");

  await expectMode(page, "select");
  await expect(items(page)).toHaveCount(1);
});

test("discards an item left blank when Escape ends the edit", async ({ page }) => {
  await openApp(page);
  await addTextByDrag(page, TEXT_RANGE);
  await expectMode(page, "edit");

  await page.keyboard.press("Escape");

  await expectMode(page, "select");
  await expect(items(page)).toHaveCount(0);
});

test("leaves add-item mode on Escape", async ({ page }) => {
  await openApp(page);
  await enterAddText(page);

  await page.keyboard.press("Escape");

  await expectMode(page, "select");
});

test("still closes the File menu on Escape", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "File" }).click();
  await expect(page.getByRole("menuitem", { name: "New instance" })).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("menuitem", { name: "New instance" })).toBeHidden();
});

for (const key of ["Delete", "Backspace"] as const) {
  test(`deletes the selected item on ${key}`, async ({ page }) => {
    await openApp(page);
    await addText(page, TEXT_RANGE, "Hello");
    await addText(page, SECOND_RANGE, "World");
    await textItems(page).first().click();

    await page.keyboard.press(key);

    await expect(items(page)).toHaveCount(1);
    await expectMode(page, "select");
  });

  test(`deletes the item under edit on ${key}`, async ({ page }) => {
    await openApp(page);
    await addText(page, TEXT_RANGE, "Hello");
    const rect = await addRectByDrag(page, SECOND_RANGE);
    await rect.click();
    await expectMode(page, "edit");

    await page.keyboard.press(key);

    // edit mode shows only the item under edit, hence the count means nothing until it ends.
    await expectMode(page, "select");
    await expect(items(page)).toHaveCount(1);
  });
}

test("deletes nothing while nothing is selected", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");
  await expect(textItems(page).first()).toHaveAttribute("data-selected", "false");

  await page.keyboard.press("Delete");
  await page.keyboard.press("Backspace");

  await expect(items(page)).toHaveCount(1);
});

test("leaves Delete and Backspace to the text editor in edit mode", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");
  const editor = await addTextByDrag(page, SECOND_RANGE, "World");

  // the caret sits at the end of the content, hence Backspace eats the last character of it and
  // Delete has nothing ahead to eat. neither reaches the item deletion.
  await page.keyboard.press("Backspace");
  await expect(editor).toHaveValue("Worl");
  await page.keyboard.press("Delete");
  await expect(editor).toHaveValue("Worl");
  await expectMode(page, "edit");

  await page.keyboard.press("Escape");
  await expect(items(page)).toHaveCount(2);
});

test("keeps the text item under edit on Delete and Backspace outside its editor", async ({
  page,
}) => {
  await openApp(page);
  const editor = await addTextByDrag(page, TEXT_RANGE, "Hello");
  await editor.blur();
  await expect(editor).not.toBeFocused();

  await page.keyboard.press("Delete");
  await page.keyboard.press("Backspace");

  await expect(editor).toHaveValue("Hello");
  await expectMode(page, "edit");
});

test("leaves Backspace to the text editor after a drag on its handle", async ({ page }) => {
  await openApp(page);
  const editor = await addTextByDrag(page, TEXT_RANGE, "Hello");
  await dragBy(page, centerOf(await boundingBoxOf(rightResizeHandle(page))), { x: 40, y: 0 });

  await page.keyboard.press("Backspace");

  await expect(editor).toHaveValue("Hell");
  await expectMode(page, "edit");
});
