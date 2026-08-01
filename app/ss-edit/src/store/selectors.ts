import { Point2D } from "../utils/geometry";
import type { PageState } from "./types";

/**
 * @param view
 * @returns translate() offset for `<canvas/>`
 */
export const canvasOffset = (view: PageState.View): Point2D => {
  const paneOffset = Point2D.new(view.canvasSize).scale(0.5);
  return paneOffset.subtract(Point2D.new(view.offset).scale(view.scale));
};

/**
 * @param items
 * @returns entire picture rect
 */
export const entirePictureRect = (
  items: readonly PageState.Item[],
): {
  /** top-left position */
  head: Point2D;
  /** bottom-right position */
  tail: Point2D;
  /** entire picture size */
  size: Point2D;
} => {
  let headX: number | null = null;
  let headY: number | null = null;
  let tailX: number | null = null;
  let tailY: number | null = null;
  for (const item of items) {
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
  }
  const head = new Point2D(headX ?? 0, headY ?? 0);
  const tail = new Point2D(tailX ?? 0, tailY ?? 0);
  const size = tail.subtract(head);
  return { head, tail, size };
};
