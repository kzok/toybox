import type { Vec2 } from "../utils/geometry";
import type { PageState } from "./types";

/**
 * @returns translate() offset for `<canvas/>`
 * @note `view.offset` names the picture point shown at the centre of the pane, hence the half
 *   canvas size: that point has to land there rather than at the top-left corner.
 * @note the only place the offset is derived. `Painter` hands it to `ctx.translate()` and
 *   `CanvasLayer` to a CSS `translate()`, and the overlays line up with the drawn pixels only
 *   because both read this same number.
 */
export const canvasOffset = (view: PageState.View): Vec2 => {
  const paneOffset = view.canvasSize.div(2);
  return paneOffset.sub(view.offset.mul(view.scale));
};
