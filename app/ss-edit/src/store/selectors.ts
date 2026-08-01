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
