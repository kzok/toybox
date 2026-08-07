import { Point2D } from "../../utils/geometry";
import type { EditorItem, EditorPictureRect } from "./types";

/**
 * @param items
 * @returns entire picture rect
 */
export const editorPictureRect = (items: readonly EditorItem[]): EditorPictureRect => {
  let headX: number | null = null;
  let headY: number | null = null;
  let tailX: number | null = null;
  let tailY: number | null = null;
  for (const item of items) {
    switch (item.kind) {
      case "image":
        headX = headX === null ? item.offset[0] : Math.min(headX, item.offset[0]);
        headY = headY === null ? item.offset[1] : Math.min(headY, item.offset[1]);
        tailX =
          tailX === null
            ? item.offset[0] + item.data.width
            : Math.max(tailX, item.offset[0] + item.data.width);
        tailY =
          tailY === null
            ? item.offset[1] + item.data.height
            : Math.max(tailY, item.offset[1] + item.data.height);
        break;
      case "text":
        // TODO: implement this.
        break;
      default:
        item satisfies never;
    }
  }
  const head = new Point2D(headX ?? 0, headY ?? 0);
  const tail = new Point2D(tailX ?? 0, tailY ?? 0);
  const size = tail.subtract(head);
  return { head, tail, size };
};
