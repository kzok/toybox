import type { EditorState } from "../../../store/editor";
import { Point2D } from "../../../utils/geometry";

/**
 * @param canvas
 * @param state
 */
export const renderCanvas = (canvas: HTMLCanvasElement, state: EditorState): void => {
  const ctx = canvas.getContext("2d")!;
  ctx.reset();
  ctx.translate(
    ...Point2D.new(...state.view.offset)
      .invert()
      .tuple(),
  );
  for (let i = state.items.length - 1; i >= 0; i -= 1) {
    const item = state.items[i]!;
    renderLine(ctx, item);
  }
};

/**
 * @param ctx
 * @param lineItem
 */
const renderLine = (ctx: CanvasRenderingContext2D, item: EditorState.Item.Line): void => {
  ctx.lineCap = "round";
  ctx.strokeStyle = item.color;
  ctx.lineWidth = item.width;
  ctx.beginPath();
  ctx.moveTo(...item.head);
  ctx.lineTo(...item.tail);
  ctx.stroke();
};
