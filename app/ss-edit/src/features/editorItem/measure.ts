import { Rect, Vec2 } from "../../utils/geometry";
import { rectStyleSizeOf } from "./rectStyle";
import { splitLines } from "./textLayout";
import { textStyleSizeOf } from "./textStyle";
import type { EditorItem, TextItemLayout } from "./types";

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
 * @param layout text layout
 * @returns the size the text occupies, laid out at that layout
 * @note the renderer pads the text on every side (see renderText()'s translate(padding, padding)),
 *   so this size includes that padding too, or it would clip what's actually drawn.
 */
export const textItemSizeOf = (layout: TextItemLayout): Vec2 => {
  const { padding, lineHeight } = textStyleSizeOf(layout);
  const lineCount = splitLines(layout).length;
  const doublePadding = padding * 2;
  return new Vec2(layout.width, lineCount * lineHeight).add([doublePadding, doublePadding]);
};

/**
 * @param item editor item
 * @returns rect of the item
 */
const measureItem = (item: EditorItem): Rect => {
  let size: Vec2;
  switch (item.kind) {
    case "image":
      size = new Vec2(item.width, item.height);
      break;
    case "text":
      size = textItemSizeOf(item);
      break;
    case "rect": {
      // NOTE: the renderer pads the rect on every side to take up the half of the outline that
      //   lies outside its edge (see rectStyleSizeOf()), so this size includes that padding too.
      //   the shadow is left out of it, as a text item's shadow is.
      const doublePadding = rectStyleSizeOf(item).padding * 2;
      size = new Vec2(item.width, item.height).add([doublePadding, doublePadding]);
      break;
    }
    default:
      item satisfies never;
      throw new Error(`unknown item: ${JSON.stringify(item)}`);
  }
  const head = Vec2.new(item.offset);
  return new Rect(head, head.add(size));
};
