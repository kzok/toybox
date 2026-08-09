import { Rect, Vec2 } from "../../utils/geometry";
import { splitLines, type TextLayout } from "./splitLines";
import { lineHeightOf } from "./textStyle";
import type { EditorItem } from "./types";

/** picture rect of an empty item list */
const EMPTY_PICTURE_RECT = Rect.new([0, 0], [0, 0]);

/**
 * @param items
 * @returns entire picture rect
 */
export const measurePicture = (items: readonly EditorItem[]): Rect => {
  let rect: Rect | null = null;
  for (const item of items) {
    const itemRect = measureItem(item);
    rect = rect == null ? itemRect : rect.union(itemRect);
  }
  return rect ?? EMPTY_PICTURE_RECT;
};

/**
 * @param item editor item
 * @returns rect of the item
 */
const measureItem = (item: EditorItem): Rect => {
  let size: Vec2;
  switch (item.kind) {
    case "image":
      size = new Vec2(item.data.width, item.data.height);
      break;
    case "text":
      size = measureTextSize(item);
      break;
    default:
      item satisfies never;
      throw new Error(`unknown item: ${JSON.stringify(item)}`);
  }
  const head = Vec2.new(item.offset);
  return new Rect(head, head.add(size));
};

/**
 * @param item text item
 * @returns text item size
 */
export const measureTextSize = (item: TextLayout): Vec2 => {
  const lineCount = splitLines(item).length;
  return new Vec2(item.width, lineCount * lineHeightOf(item.fontSize));
};
