import type { EditorRect } from "../features/editorItem";
import { Vec2 } from "../utils/geometry";
import type { PageState } from "./types";

/**
 * @param view
 * @returns translate() offset for `<canvas/>`
 */
export const canvasOffset = (view: PageState.View): Vec2 => {
  const paneOffset = view.canvasSize.div(2);
  return paneOffset.sub(view.offset.mul(view.scale));
};

/**
 * @param range dragged range in [start, end], which may go up and/or left.
 * @returns rect of the range, with its corners sorted.
 */
export const rangeRect = (range: readonly [Vec2, Vec2]): EditorRect => {
  const [start, end] = range;
  const head = new Vec2(Math.min(start.x, end.x), Math.min(start.y, end.y));
  const tail = new Vec2(Math.max(start.x, end.x), Math.max(start.y, end.y));
  return { head, tail, size: tail.sub(head) };
};
