import { createHash } from "node:crypto";
import path from "node:path";
import type { Locator } from "@playwright/test";

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; width: number; height: number };

/** resolves a file under `e2e/ss-edit/fixtures/`. */
export const fixture = (fileName: string): string =>
  path.join(import.meta.dirname, "..", "fixtures", fileName);

export const boundingBoxOf = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (box == null) {
    throw new Error("the element has no bounding box.");
  }
  return box;
};

export const centerOf = (box: Box): Point => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

/** rounds every side so that sub-pixel layout noise never breaks a comparison. */
export const roundBox = (box: Box): Box => ({
  x: Math.round(box.x),
  y: Math.round(box.y),
  width: Math.round(box.width),
  height: Math.round(box.height),
});

/** grows a box by `delta` on its width and height, keeping its top-left corner in place. */
export const growBox = (box: Box, delta: number): Box => ({
  ...box,
  width: box.width + delta,
  height: box.height + delta,
});

/** digests keep a mismatch readable instead of dumping every byte of the PNG. */
export const digest = (png: Buffer): string => createHash("sha256").update(png).digest("hex");
