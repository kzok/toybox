import type { Vec2 } from "../utils/geometry";
import type { PageState } from "./types";

/**
 * @param view
 * @returns translate() offset for `<canvas/>`
 */
export const canvasOffset = (view: PageState.View): Vec2 => {
  const paneOffset = view.canvasSize.div(2);
  return paneOffset.sub(view.offset.mul(view.scale));
};
