import { readFile } from "node:fs/promises";
import { expect, type JSHandle, type Locator, type Page, test } from "@playwright/test";
import { expectMode } from "./assertions";
import { editorPane, imageItems, textEditor } from "./locators";
import { type Box, boundingBoxOf, fixture, type Point } from "./support";

/**
 * opens the application and waits until it is ready to be measured.
 * @note the text items are laid out by measuring them, so the fonts have to have settled before
 *   anything is read off the page.
 */
export const openApp = async (page: Page): Promise<void> => {
  await blockExternalRequests(page);
  await page.goto("/ss-edit/");
  await expectMode(page, "select");
  await page.evaluate(() => document.fonts.ready);
};

/**
 * keeps the run hermetic by cutting every request that leaves the machine.
 * @note nothing the page needs leaves the machine, and a run that starts reaching out is a bug worth
 *   failing on rather than something to let through.
 * @note "local" is the host of `baseURL`, so that moving the server of `playwright.config.ts` to
 *   another host or port never turns the application itself into a blocked origin.
 */
const blockExternalRequests = async (page: Page): Promise<void> => {
  const { baseURL } = test.info().project.use;
  if (baseURL == null) {
    throw new Error("the project has no baseURL to tell the local host from a remote one.");
  }
  const localHost = new URL(baseURL).host;
  await page.route("**/*", (route) => {
    const { protocol, host } = new URL(route.request().url());
    const isRemote = (protocol === "http:" || protocol === "https:") && host !== localHost;
    return isRemote ? route.abort() : route.continue();
  });
};

/** picks the given fixture through "Edit" -> "Add image". */
export const addImage = async (page: Page, fileName: string): Promise<void> => {
  const count = await imageItems(page).count();
  await page.getByRole("button", { name: "Edit" }).click();
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("menuitem", { name: "Add image" }).click(),
  ]);
  await chooser.setFiles(fixture(fileName));
  await expect(imageItems(page)).toHaveCount(count + 1);
};

/** gets into "add-item" mode through "Edit" -> "Add text". */
export const enterAddText = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("menuitem", { name: "Add text" }).click();
  await expectMode(page, "add-item");
};

/** exports the picture through "File" -> "Save as PNG". */
export const saveAsPng = async (page: Page): Promise<Buffer> => {
  await page.getByRole("button", { name: "File" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Save as PNG" }).click(),
  ]);
  return readFile(await download.path());
};

/** exports the picture with the save hotkey, the counterpart of `saveAsPng`'s menu route. */
export const saveByHotkey = async (page: Page): Promise<Buffer> => {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.keyboard.press("ControlOrMeta+s"),
  ]);
  return readFile(await download.path());
};

/** discards the picture through "File" -> "New instance", answering the confirmation if shown. */
export const newInstance = async (
  page: Page,
  choice: "Discard Changes" | "Cancel" | null = null,
): Promise<void> => {
  await page.getByRole("button", { name: "File" }).click();
  await page.getByRole("menuitem", { name: "New instance" }).click();
  if (choice != null) {
    await page.getByRole("button", { name: choice }).click();
  }
};

/** picks a zoom level from the preset list of the footer. */
export const zoomTo = async (page: Page, percent: 200 | 150 | 100 | 50): Promise<void> => {
  await page.getByTitle("Zoom level").click();
  await page.getByRole("menuitem", { name: `${percent}%` }).click();
  await expect(page.getByTitle("Zoom level")).toHaveText(`${percent}%`);
};

/** drags the topmost element at `from` by `delta` with the main button held down. */
export const dragBy = async (page: Page, from: Point, delta: Point): Promise<void> => {
  await dragFromTo(page, from, { x: from.x + delta.x, y: from.y + delta.y });
};

/** drags the topmost element at `from` to `to` with the main button held down. */
export const dragFromTo = async (page: Page, from: Point, to: Point): Promise<void> => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  // dragging is driven by `movementX` / `movementY` of each pointermove, hence the steps.
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
};

/** turns a rectangle in editor pane coordinates into viewport coordinates. */
export const paneRectToViewport = async (page: Page, rect: Box): Promise<Box> => {
  const pane = await boundingBoxOf(editorPane(page));
  return { ...rect, x: pane.x + rect.x, y: pane.y + rect.y };
};

/**
 * adds a text item by dragging `rect`, given in editor pane coordinates, and types `content` into
 * it. the editor is left open, so that the caller decides how the edit ends.
 * @returns the `<textarea/>` of the edit mode the application ends up in.
 */
export const addTextByDrag = async (page: Page, rect: Box, content?: string): Promise<Locator> => {
  const { x, y, width, height } = await paneRectToViewport(page, rect);
  await enterAddText(page);
  await dragFromTo(page, { x, y }, { x: x + width, y: y + height });
  await expectMode(page, "edit");
  if (content != null) {
    await typeText(page, content);
  }
  return textEditor(page);
};

/** adds a text item and ends the edit right away, for tests that only need one to exist. */
export const addText = async (page: Page, rect: Box, content: string): Promise<void> => {
  await addTextByDrag(page, rect, content);
  await commitText(page);
};

/**
 * types into the focused `<textarea/>` of edit mode.
 * @note key by key instead of `fill`, which replaces the whole value at once and hence would tell
 *   nothing about where the caret was.
 */
export const typeText = async (page: Page, text: string): Promise<void> => {
  await page.keyboard.type(text);
  await expect(textEditor(page)).toHaveValue(new RegExp(`${escapeRegExp(text)}$`));
};

/** erases the whole content of the `<textarea/>` of edit mode. */
export const eraseText = async (page: Page): Promise<void> => {
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  await expect(textEditor(page)).toHaveValue("");
};

/** ends the edit by clicking an empty corner of the pane, as a user would. */
export const commitText = async (page: Page): Promise<void> => {
  const pane = await boundingBoxOf(editorPane(page));
  await page.mouse.click(pane.x + 20, pane.y + 20);
  await expectMode(page, "select");
};

/** keeps the pointer off the items so that their `:hover` highlight stays out of screenshots. */
export const parkCursor = async (page: Page): Promise<void> => {
  const box = await boundingBoxOf(editorPane(page));
  await page.mouse.move(box.x + 20, box.y + 20);
};

/**
 * builds a drop payload out of the given fixtures.
 * @note playwright drives the native file picker but cannot drop a file from outside the page, so
 *   the payload is assembled in the page and handed to synthetic drag events.
 */
export const dataTransferOf = async (
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

export const dispatchDrag = (
  dataTransfer: JSHandle<DataTransfer>,
  name: "dragenter" | "dragover" | "dragleave" | "drop",
): Promise<void> =>
  dataTransfer.evaluate((dataTransfer, name) => {
    window.dispatchEvent(new DragEvent(name, { dataTransfer, bubbles: true, cancelable: true }));
  }, name);

const escapeRegExp = (source: string): string => source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
