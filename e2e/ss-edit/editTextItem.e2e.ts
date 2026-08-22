import { expect, test } from "@playwright/test";
import {
  addImage,
  addText,
  boundingBoxOf,
  centerOf,
  commitText,
  dragBy,
  dragFromTo,
  eraseText,
  expectMode,
  expectMovedBy,
  imageItems,
  openApp,
  parkCursor,
  pictureSize,
  saveAsPng,
  textEditor,
  textItems,
  typeText,
} from "./helpers";

/** kept on the top left corner of the pane, clear of the images added on its center. */
const TEXT_RANGE = { x: 40, y: 40, width: 400, height: 48 };

test("enters edit mode on the second click with the caret at the end", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");

  const item = textItems(page).first();

  await test.step("select the item on the first click", async () => {
    await item.click();
    await expectMode(page, "select");
    await expect(item).toHaveAttribute("data-selected", "true");
  });

  await test.step("edit the item on the second click", async () => {
    await item.click();
    await expectMode(page, "edit");
    await expect(textEditor(page)).toBeFocused();
    await expect(textEditor(page)).toHaveValue("Hello");
    await parkCursor(page);
    await expect.soft(page).toHaveScreenshot("screenshot-editing.png");
  });

  await test.step("append to the existing content", async () => {
    // the caret is placed at the end on entering, so the typed text is appended rather than
    // inserted at the front.
    await typeText(page, " world");
    await expect(textEditor(page)).toHaveValue("Hello world");
  });
});

test("does not enter edit mode on ctrl+click", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");

  const item = textItems(page).first();
  await item.click();
  await expect(item).toHaveAttribute("data-selected", "true");

  await item.click({ modifiers: ["ControlOrMeta"] });

  // ctrl+click means "toggle the selection", hence it deselects instead of opening the editor.
  await expectMode(page, "select");
  await expect(textEditor(page)).toHaveCount(0);
  await expect(item).toHaveAttribute("data-selected", "false");
});

test("selects the text by dragging inside the editor", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello world");

  const item = textItems(page).first();
  await item.click();
  await item.click();
  await expectMode(page, "edit");

  const editor = textEditor(page);
  const box = await boundingBoxOf(editor);
  const y = box.y + box.height / 2;
  await dragFromTo(page, { x: box.x + 2, y }, { x: box.x + box.width - 2, y });

  // NOTE: the `<textarea/>` is the one place the browser's own pointer behaviour is wanted, and
  // its handlers stop propagation and capture the pointer, either of which could break it.
  const selection = await editor.evaluate((element: HTMLTextAreaElement) => ({
    start: element.selectionStart,
    end: element.selectionEnd,
  }));
  expect(selection.end).toBeGreaterThan(selection.start);
});

test("moves the text item by dragging instead of editing it", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");

  const item = textItems(page).first();
  await item.click();

  const before = await boundingBoxOf(item);
  const delta = { x: 60, y: 40 };
  await dragBy(page, centerOf(before), delta);

  await expectMovedBy(item, before, delta);
  // the pointer travelled far enough for the click to be swallowed, so the editor stays closed.
  await expectMode(page, "select");
  await expect(textEditor(page)).toHaveCount(0);
});

test("moves every selected item together", async ({ page }) => {
  await openApp(page);
  await addImage(page, "320x240.png");
  await addText(page, TEXT_RANGE, "Hello");

  const image = imageItems(page).first();
  const text = textItems(page).first();

  await text.click();
  await image.click({ modifiers: ["ControlOrMeta"] });
  await expect(text).toHaveAttribute("data-selected", "true");
  await expect(image).toHaveAttribute("data-selected", "true");

  const beforeText = await boundingBoxOf(text);
  const beforeImage = await boundingBoxOf(image);
  const delta = { x: 60, y: 40 };
  await dragBy(page, centerOf(beforeImage), delta);

  // dragging one of them carries the whole selection along.
  await expectMovedBy(image, beforeImage, delta);
  await expectMovedBy(text, beforeText, delta);
});

test("removes the item when its content is erased", async ({ page }) => {
  await openApp(page);
  await addText(page, TEXT_RANGE, "Hello");

  const item = textItems(page).first();
  await item.click();
  await item.click();
  await expectMode(page, "edit");

  await eraseText(page);
  await commitText(page);

  await expect(textItems(page)).toHaveCount(0);
  await expect(pictureSize(page)).toHaveText("0 x 0");
});

test("keeps the text in the exported picture", async ({ page }) => {
  await openApp(page);
  await addImage(page, "320x240.png");
  await addText(page, TEXT_RANGE, "Hello");

  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-text-and-image.png");
  expect.soft(await saveAsPng(page)).toMatchSnapshot("export-text-and-image.png");
});
