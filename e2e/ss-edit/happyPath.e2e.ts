import { expect, test } from "@playwright/test";
import {
  addImage,
  boundingBoxOf,
  centerOf,
  digest,
  dragBy,
  editorPane,
  expectMovedBy,
  imageItems,
  openApp,
  parkCursor,
  pictureSize,
  saveAsPng,
  zoomLevel,
} from "./helpers";

/**
 * the pixel comparisons are soft so that one drifted baseline does not hide the rest: they only
 * read the page, hence letting the flow continue past a mismatch stays safe.
 */
test("edits, exports, and navigates the picture", async ({ page }) => {
  await openApp(page);

  const items = imageItems(page);

  const image320x240 = items.nth(0);
  const image200x200 = items.nth(1);
  const image728x90 = items.nth(2);

  await test.step("pile up images on the center of the pane", async () => {
    // every image is added on the center of the editor pane, so they pile up on each other.
    await addImage(page, "320x240.png");
    await addImage(page, "200x200.png");
    await addImage(page, "728x90.png");

    await expect(pictureSize(page)).toHaveText("728 x 240");
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

    await expect(pictureSize(page)).toHaveText("728 x 255");
    await parkCursor(page);
    await expect.soft(page).toHaveScreenshot("screenshot-moved-apart.png");
    const png = await saveAsPng(page);
    expect.soft(png).toMatchSnapshot("export-moved-apart.png");
    return png;
  });

  await test.step("zoom around the cursor with ctrl + wheel", async () => {
    // the wheel handler is registered through the DOM API because React's onWheel did not work,
    // so only a real browser exercises it.
    await expect(zoomLevel(page)).toHaveText("100%");
    await page.mouse.move(center.x, center.y);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -100);
    await page.keyboard.up("Control");
    await expect(zoomLevel(page)).toHaveText("130%");
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
    await expect(pictureSize(page)).toHaveText("728 x 255");
    expect(digest(await saveAsPng(page))).toBe(digest(movedApart));
  });
});
