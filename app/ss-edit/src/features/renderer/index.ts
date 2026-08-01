import type { PageState } from "../../store";

/**
 * create instance to render items to <canvas/>.
 * @returns renderer instance
 */
export const createItemRenderer = (element: HTMLCanvasElement) => {
  const canvas = element;
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    throw new Error("failed to get <canvas/> context 2d.");
  }

  const renderImage = (item: PageState.Item): void => {
    ctx.drawImage(item.data, ...item.offset);
  };

  return (items: readonly PageState.Item[]) => {
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
