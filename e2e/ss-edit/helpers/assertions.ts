import { expect, type Locator, type Page } from "@playwright/test";
import { appRoot, canvas, editorOverlay, editorPane } from "./locators";
import { type Box, boundingBoxOf, centerOf, type Point, roundBox } from "./support";

export type EditorMode = "select" | "edit" | "add-item";

export const expectMode = async (page: Page, mode: EditorMode): Promise<void> => {
  await expect(editorOverlay(page)).toHaveAttribute("data-editor-mode", mode);
};

/**
 * guards against a drag that silently missed its target: the pane itself would scroll instead,
 * which leaves the exported picture untouched and makes the snapshot below meaningless.
 */
export const expectMovedBy = async (element: Locator, before: Box, delta: Point): Promise<void> => {
  await expect
    .poll(async () => {
      const box = await boundingBoxOf(element);
      return { x: Math.round(box.x - before.x), y: Math.round(box.y - before.y) };
    })
    .toEqual(delta);
};

/**
 * asserts that the element occupies the given rectangle of the viewport.
 * @note the offsets travel through `toFixed(1)` and a division by the scale on their way to the
 *   style, so a sub-pixel drift is expected and every side is compared within `tolerance`.
 */
export const expectBoxOnScreen = async (
  element: Locator,
  expected: Box,
  tolerance: number = 1,
): Promise<void> => {
  const snap = (actual: number, target: number): number =>
    Math.abs(actual - target) <= tolerance ? target : Math.round(actual);
  await expect
    .poll(async () => {
      const box = await boundingBoxOf(element);
      return {
        x: snap(box.x, Math.round(expected.x)),
        y: snap(box.y, Math.round(expected.y)),
        width: snap(box.width, Math.round(expected.width)),
        height: snap(box.height, Math.round(expected.height)),
      };
    })
    .toEqual(roundBox(expected));
};

export const expectCenteredInPane = async (page: Page, item: Locator): Promise<void> => {
  const paneCenter = centerOf(await boundingBoxOf(editorPane(page)));
  const itemCenter = centerOf(await boundingBoxOf(item));
  expect(itemCenter.x).toBeCloseTo(paneCenter.x, 0);
  expect(itemCenter.y).toBeCloseTo(paneCenter.y, 0);
};

export const expectCanvasFitsPane = async (page: Page): Promise<void> => {
  const paneBox = await boundingBoxOf(editorPane(page));
  await expect
    .poll(async () => roundBox(await boundingBoxOf(canvas(page))))
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
export const expectAppFitsWindow = async (page: Page): Promise<void> => {
  const viewport = page.viewportSize()!;
  await expect
    .poll(async () => {
      const box = await boundingBoxOf(appRoot(page));
      return { width: Math.round(box.width), height: Math.round(box.height) };
    })
    .toEqual(viewport);
};
