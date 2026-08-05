import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type JSHandle, type Locator, type Page, test } from "@playwright/test";

type Box = { x: number; y: number; width: number; height: number };

const fixture = (fileName: string): string => path.join(import.meta.dirname, "fixtures", fileName);

/** image items on the editor overlay, in the order they were added. */
const imageItems = (page: Page): Locator => page.locator("button[data-item-kind='image']");

/** the editor pane, which fills the space between the header and the footer. */
const editorPane = (page: Page): Locator => page.locator("canvas").locator("..");

const dropOverlay = (page: Page): Locator => page.getByText("Drop an image here");

const boundingBoxOf = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (box == null) {
    throw new Error("the element has no bounding box.");
  }
  return box;
};

/**
 * builds a drop payload out of the given fixtures.
 * @note playwright drives the native file picker but cannot drop a file from outside the page, so
 *   the payload is assembled in the page and handed to synthetic drag events.
 */
const dataTransferOf = async (
  page: Page,
  fileNames: readonly string[],
): Promise<JSHandle<DataTransfer>> => {
  const files = await Promise.all(
    fileNames.map(async (name) => ({
      name,
      base64: (await readFile(fixture(name))).toString("base64"),
    })),
  );
  return page.evaluateHandle(async (files) => {
    const dataTransfer = new DataTransfer();
    for (const file of files) {
      const blob = await (await fetch(`data:image/png;base64,${file.base64}`)).blob();
      dataTransfer.items.add(new File([blob], file.name, { type: "image/png" }));
    }
    return dataTransfer;
  }, files);
};

const dispatchDrag = (
  dataTransfer: JSHandle<DataTransfer>,
  name: "dragenter" | "dragover" | "dragleave" | "drop",
): Promise<void> =>
  dataTransfer.evaluate((dataTransfer, name) => {
    window.dispatchEvent(new DragEvent(name, { dataTransfer, bubbles: true, cancelable: true }));
  }, name);

const expectCenteredInPane = async (page: Page, item: Locator): Promise<void> => {
  const pane = await boundingBoxOf(editorPane(page));
  const box = await boundingBoxOf(item);
  expect(box.x + box.width / 2).toBeCloseTo(pane.x + pane.width / 2, 0);
  expect(box.y + box.height / 2).toBeCloseTo(pane.y + pane.height / 2, 0);
};

test("adds an image dropped anywhere in the window", async ({ page }) => {
  await page.goto("/ss-edit/");

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
    await expect(page.getByTitle("Size")).toHaveText("320 x 240");
    await expectCenteredInPane(page, items.first());
  });
});

test("takes only the first image of a multi-file drop", async ({ page }) => {
  await page.goto("/ss-edit/");

  const dataTransfer = await dataTransferOf(page, ["320x240.png", "200x200.png"]);
  await dispatchDrag(dataTransfer, "dragenter");
  await dispatchDrag(dataTransfer, "drop");

  await expect(imageItems(page)).toHaveCount(1);
  // the size of the whole picture tells which of the two fixtures was taken.
  await expect(page.getByTitle("Size")).toHaveText("320 x 240");
});

test("hides the overlay when the drag leaves the window without dropping", async ({ page }) => {
  await page.goto("/ss-edit/");

  const dataTransfer = await dataTransferOf(page, ["320x240.png"]);
  await dispatchDrag(dataTransfer, "dragenter");
  await expect(dropOverlay(page)).toBeVisible();

  await dispatchDrag(dataTransfer, "dragleave");
  await expect(dropOverlay(page)).toBeHidden();
  await expect(imageItems(page)).toHaveCount(0);
});
