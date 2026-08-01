import type { PageState } from "../../store";
import { Point2D } from "../../utils/geometry";

type Renderer = (items: readonly PageState.Item[], view: PageState.View) => void;

/**
 * create instance to render to <canvas/>.
 * @returns renderer instance
 */
export const createRenderer = (element: HTMLCanvasElement): Renderer => {
  const canvas = element;
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    throw new Error("failed to get <canvas/> context 2d.");
  }

  const renderImage = (item: PageState.Item): void => {
    ctx.drawImage(item.data, ...item.offset);
  };

  return (items, view) => {
    ctx.reset();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const paneOffset = Point2D.new(view.canvasSize).scale(0.5);
    const offset = paneOffset.subtract(Point2D.new(view.offset).scale(view.scale));
    ctx.translate(...offset.tuple());
    ctx.scale(view.scale, view.scale);
    for (const item of items) {
      switch (item.kind) {
        case "image":
          renderImage(item);
          break;
        default:
          item.kind satisfies never;
      }
    }
  };
};
