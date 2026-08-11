import { Rect, Vec2 } from "../../utils/geometry";
import { splitLines, type TextLayout } from "./textLayout";
import { lineHeightOf, paddingOf } from "./textStyle";
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
    case "text": {
      // NOTE: the renderer pads the text on every side (see renderText()'s
      // translate(padding, padding)), but measureTextSize() itself must keep
      // returning the unpadded content size since EditMode.tsx also relies on
      // it for the edit textarea's content-box height.
      const padding = paddingOf(item.fontSize) * 2;
      size = measureTextSize(item).add([padding, padding]);
      break;
    }
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
 * @note the outline stroked by the renderer fits in the slack of the line box, hence only the shadow reaches outside this size and it is deliberately left to be cropped on export.
 */
export const measureTextSize = (item: TextLayout): Vec2 => {
  const lineCount = splitLines(item).length;
  return new Vec2(item.width, lineCount * lineHeightOf(item.fontSize));
};
