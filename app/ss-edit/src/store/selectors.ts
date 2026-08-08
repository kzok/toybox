import type { EditorRect } from "../features/editorItem";
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
 * @param range dragged range in [start, end], which may go up and/or left.
 * @returns rect of the range, with its corners sorted.
 */
export const rangeRect = (range: readonly [Point2D, Point2D]): EditorRect => {
  const [start, end] = range;
  const head = new Point2D(Math.min(start.x, end.x), Math.min(start.y, end.y));
  const tail = new Point2D(Math.max(start.x, end.x), Math.max(start.y, end.y));
  return { head, tail, size: tail.subtract(head) };
};
