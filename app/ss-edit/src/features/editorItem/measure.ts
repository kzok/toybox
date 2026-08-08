import { Point2D } from "../../utils/geometry";
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
    let itemSize: Point2D;
    switch (item.kind) {
      case "image":
        itemSize = new Point2D(item.data.width, item.data.height);
        break;
      case "text":
        itemSize = measureText(item);
        break;
      default:
        item satisfies never;
        continue;
    }
    const itemHead = Point2D.new(item.offset);
    const itemTail = itemHead.add(itemSize);
    headX = headX === null ? itemHead.x : Math.min(headX, itemHead.x);
    headY = headY === null ? itemHead.y : Math.min(headY, itemHead.y);
    tailX = tailX === null ? itemTail.x : Math.max(tailX, itemTail.x);
    tailY = tailY === null ? itemTail.y : Math.max(tailY, itemTail.y);
  }
  const head = new Point2D(headX ?? 0, headY ?? 0);
  const tail = new Point2D(tailX ?? 0, tailY ?? 0);
  const size = tail.sub(head);
  return { head, tail, size };
};

/**
 * @param item text item
 * @returns text item size
 */
export const measureText = (item: TextLayout): Point2D => {
  const lineCount = splitLines(item).length;
  return new Point2D(item.width, lineCount * lineHeightOf(item.fontSize));
};
