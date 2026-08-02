import type { PageState } from "../../store";

/**
 * render editor items
 * @param ctx
 * @param items editor items
 */
export const renderEditorItems = (ctx: CanvasDrawImage, items: readonly PageState.Item[]) => {
  const renderImage = (item: PageState.Item): void => {
    ctx.drawImage(item.data, ...item.offset);
  };

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
