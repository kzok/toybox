import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Locator, type Page, test } from "@playwright/test";

type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };

const fixture = (fileName: string): string => path.join(import.meta.dirname, "fixtures", fileName);

/** image items on the editor overlay, in the order they were added. */
const imageItems = (page: Page): Locator => page.locator("button[data-item-kind='image']");

/** the editor pane, which fills the space between the header and the footer. */
const editorPane = (page: Page): Locator => page.locator("canvas").locator("..");

const boundingBoxOf = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (box == null) {
    throw new Error("the element has no bounding box.");
  }
  return box;
};

const centerOf = (box: Box): Point => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

/** picks the given fixture through "Edit" -> "Add image". */
const addImage = async (page: Page, fileName: string): Promise<void> => {
  const count = await imageItems(page).count();
  await page.getByRole("button", { name: "Edit" }).click();
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("menuitem", { name: "Add image" }).click(),
  ]);
  await chooser.setFiles(fixture(fileName));
  await expect(imageItems(page)).toHaveCount(count + 1);
};

/** exports the picture through "File" -> "Save as PNG". */
const saveAsPng = async (page: Page): Promise<Buffer> => {
  await page.getByRole("button", { name: "File" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Save as PNG" }).click(),
  ]);
  return readFile(await download.path());
};

/** drags the topmost element at `from` by `delta` with the main button held down. */
const dragBy = async (page: Page, from: Point, delta: Point): Promise<void> => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  // dragging is driven by `movementX` / `movementY` of each pointermove, hence the steps.
  await page.mouse.move(from.x + delta.x, from.y + delta.y, { steps: 8 });
  await page.mouse.up();
};

/**
 * guards against a drag that silently missed its target: the pane itself would scroll instead,
 * which leaves the exported picture untouched and makes the snapshot below meaningless.
 */
const expectMovedBy = async (element: Locator, before: Box, delta: Point): Promise<void> => {
  await expect
    .poll(async () => {
      const box = await boundingBoxOf(element);
      return { x: Math.round(box.x - before.x), y: Math.round(box.y - before.y) };
    })
    .toEqual(delta);
};

/** keeps the pointer off the images so that their `:hover` highlight stays out of screenshots. */
const parkCursor = async (page: Page): Promise<void> => {
  const box = await boundingBoxOf(editorPane(page));
  await page.mouse.move(box.x + 20, box.y + 20);
};

/** digests keep a mismatch readable instead of dumping every byte of the PNG. */
const digest = (png: Buffer): string => createHash("sha256").update(png).digest("hex");

const expectCanvasFitsPane = async (page: Page): Promise<void> => {
  const paneBox = await boundingBoxOf(editorPane(page));
  await expect
    .poll(async () => {
      const box = await boundingBoxOf(page.locator("canvas"));
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
    })
    .toEqual({
      x: Math.round(paneBox.x),
      y: Math.round(paneBox.y),
      // the width / height attributes of `<canvas/>` truncate the fractional size of the pane.
      width: Math.floor(paneBox.width),
      height: Math.floor(paneBox.height),
    });
};

/**
 * the canvas keeps its own intrinsic size, so it could push the footer out of the window if the
 * pane ever grew beyond its grid area. `expectCanvasFitsPane` alone would not notice that.
 */
const expectAppFitsWindow = async (page: Page): Promise<void> => {
  const viewport = page.viewportSize()!;
  await expect
    .poll(async () => {
      const box = await boundingBoxOf(page.locator("#root"));
      return { width: Math.round(box.width), height: Math.round(box.height) };
    })
    .toEqual(viewport);
};

const expectCenteredInPane = async (page: Page, item: Locator): Promise<void> => {
  const paneCenter = centerOf(await boundingBoxOf(editorPane(page)));
  const itemCenter = centerOf(await boundingBoxOf(item));
  expect(itemCenter.x).toBeCloseTo(paneCenter.x, 0);
  expect(itemCenter.y).toBeCloseTo(paneCenter.y, 0);
};

/**
 * the pixel comparisons are soft so that one drifted baseline does not hide the rest: they only
 * read the page, hence letting the flow continue past a mismatch stays safe.
 */
test("edits, exports, and navigates the picture", async ({ page }) => {
  await page.goto("/ss-edit/");

  const items = imageItems(page);
  const zoomLevel = page.getByTitle("Zoom level");
  const pictureSize = page.getByTitle("Size");

  const image320x240 = items.nth(0);
  const image200x200 = items.nth(1);
  const image728x90 = items.nth(2);

  await test.step("pile up images on the center of the pane", async () => {
    // every image is added on the center of the editor pane, so they pile up on each other.
    await addImage(page, "320x240.png");
    await addImage(page, "200x200.png");
    await addImage(page, "728x90.png");

    await expect(pictureSize).toHaveText("728 x 240");
    await parkCursor(page);
    await expect.soft(page).toHaveScreenshot("screenshot-piled-up.png");
    expect.soft(await saveAsPng(page)).toMatchSnapshot("export-piled-up.png");
  });

  const paneBox = await boundingBoxOf(editorPane(page));
  /** shared center of every image, in viewport coordinates. */
  const center = centerOf(await boundingBoxOf(image320x240));

  const movedApart = await test.step("move each image apart", async () => {
    // move each image by a small amount so that the images stay overlapped. every image is grabbed
    // where the images added after it (= stacked above it) do not cover, otherwise the drag would
    // hit the wrong one.
    const before728x90 = await boundingBoxOf(image728x90);
    await dragBy(page, { x: center.x + 300, y: center.y }, { x: 0, y: -60 });
    await expectMovedBy(image728x90, before728x90, { x: 0, y: -60 });

    const before200x200 = await boundingBoxOf(image200x200);
    await dragBy(page, { x: center.x, y: center.y + 80 }, { x: 70, y: 50 });
    await expectMovedBy(image200x200, before200x200, { x: 70, y: 50 });

    const before320x240 = await boundingBoxOf(image320x240);
    await dragBy(page, { x: center.x - 140, y: center.y + 100 }, { x: -70, y: 30 });
    await expectMovedBy(image320x240, before320x240, { x: -70, y: 30 });

    await expect(pictureSize).toHaveText("728 x 255");
    await parkCursor(page);
    await expect.soft(page).toHaveScreenshot("screenshot-moved-apart.png");
    const png = await saveAsPng(page);
    expect.soft(png).toMatchSnapshot("export-moved-apart.png");
    return png;
  });

  await test.step("zoom around the cursor with ctrl + wheel", async () => {
    // the wheel handler is registered through the DOM API because React's onWheel did not work,
    // so only a real browser exercises it.
    await expect(zoomLevel).toHaveText("100%");
    await page.mouse.move(center.x, center.y);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -100);
    await page.keyboard.up("Control");
    await expect(zoomLevel).toHaveText("130%");
  });

  await test.step("scroll the view with wheel", async () => {
    // wheel without a modifier scrolls the view, which moves every image on the screen.
    const beforeScroll = await boundingBoxOf(image728x90);
    await page.mouse.wheel(40, 60);
    await expectMovedBy(image728x90, beforeScroll, { x: -40, y: -60 });
  });

  await test.step("pan the view by dragging the empty area", async () => {
    // dragging the empty area of the pane scrolls the view as well.
    const beforePan = {
      image320x240: await boundingBoxOf(image320x240),
      image200x200: await boundingBoxOf(image200x200),
      image728x90: await boundingBoxOf(image728x90),
    };
    const panDelta = { x: 50, y: 30 };
    await dragBy(page, { x: paneBox.x + 40, y: paneBox.y + paneBox.height - 60 }, panDelta);
    await expectMovedBy(image320x240, beforePan.image320x240, panDelta);
    await expectMovedBy(image200x200, beforePan.image200x200, panDelta);
    await expectMovedBy(image728x90, beforePan.image728x90, panDelta);
  });

  await test.step("keep the exported picture untouched by the view operations", async () => {
    await parkCursor(page);
    await expect.soft(page).toHaveScreenshot("screenshot-zoomed.png");
    // zooming and scrolling belong to the view only: the exported picture must stay identical.
    await expect(pictureSize).toHaveText("728 x 255");
    expect(digest(await saveAsPng(page))).toBe(digest(movedApart));
  });
});

test("fits the canvas to the window and keeps the picture on its center", async ({ page }) => {
  await page.goto("/ss-edit/");
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
