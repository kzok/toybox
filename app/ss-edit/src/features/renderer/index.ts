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
    ctx.scale(view.scale, view.scale);
    const paneOffset = Point2D.new(view.paneSize)
      .scale(0.5)
      .scale(1 / view.scale);
    const offset = paneOffset.subtract(view.centerOffset).tuple();
    ctx.translate(...offset);
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
