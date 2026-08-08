import { Vec2 } from "../../utils/geometry";
import { splitLines, type TextLayout } from "./splitLines";
import { lineHeightOf } from "./textStyle";
import type { EditorItem, EditorRect } from "./types";

/**
 * @param items
 * @returns entire picture rect
 */
export const measurePicture = (items: readonly EditorItem[]): EditorRect => {
  let headX: number | null = null;
  let headY: number | null = null;
  let tailX: number | null = null;
  let tailY: number | null = null;
  for (const item of items) {
    let itemSize: Vec2;
    switch (item.kind) {
      case "image":
        itemSize = new Vec2(item.data.width, item.data.height);
        break;
      case "text":
        itemSize = measureText(item);
        break;
      default:
        item satisfies never;
        continue;
    }
    const itemHead = Vec2.new(item.offset);
    const itemTail = itemHead.add(itemSize);
    headX = headX === null ? itemHead.x : Math.min(headX, itemHead.x);
    headY = headY === null ? itemHead.y : Math.min(headY, itemHead.y);
    tailX = tailX === null ? itemTail.x : Math.max(tailX, itemTail.x);
    tailY = tailY === null ? itemTail.y : Math.max(tailY, itemTail.y);
  }
  const head = new Vec2(headX ?? 0, headY ?? 0);
  const tail = new Vec2(tailX ?? 0, tailY ?? 0);
  const size = tail.sub(head);
  return { head, tail, size };
};

/**
 * @param item text item
 * @returns text item size
 */
export const measureText = (item: TextLayout): Vec2 => {
  const lineCount = splitLines(item).length;
  return new Vec2(item.width, lineCount * lineHeightOf(item.fontSize));
};
