import { Rect, Vec2 } from "../../utils/geometry";
import { ARROW_STYLE_SIZE } from "./arrowStyle";
import { rectStyleSizeOf } from "./rectStyle";
import { splitLines } from "./textLayout";
import { textStyleSizeOf } from "./textStyle";
import type { EditorItem, TextItemLayout } from "./types";

/** picture rect of an empty item list */
const EMPTY_PICTURE_RECT = Rect.new([0, 0], [0, 0]);

/**
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
 * @returns the size the text occupies, laid out at that layout
 */
export const textItemSizeOf = (layout: TextItemLayout): Vec2 => {
  const { padding, lineHeight } = textStyleSizeOf(layout);
  const lineCount = splitLines(layout).length;
  const doublePadding = padding * 2;
  return new Vec2(layout.width, lineCount * lineHeight).add([doublePadding, doublePadding]);
};

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
      const doublePadding = rectStyleSizeOf(item).padding * 2;
      size = new Vec2(item.width, item.height).add([doublePadding, doublePadding]);
      break;
    }
    case "arrow": {
      const tail = Vec2.new(item.offset);
      const tip = tail.add(Vec2.polar(item.length, item.angle));
      const bounds = new Rect(tail, tip);
      const padding = Vec2.new(ARROW_STYLE_SIZE.padding, ARROW_STYLE_SIZE.padding);
      return new Rect(bounds.head.sub(padding), bounds.tail.add(padding));
    }
    default:
      item satisfies never;
      throw new Error(`unknown item: ${JSON.stringify(item)}`);
  }
  const head = Vec2.new(item.offset);
  return new Rect(head, head.add(size));
};
