import type { EditorItem } from "../editorItem";
import type { CanvasContext2D } from "./types";

/**
 * render editor items
 * @param ctx
 * @param items editor items
 */
export const renderEditorItems = (ctx: CanvasContext2D, items: readonly EditorItem[]) => {
  const renderImage = (item: EditorItem.Image): void => {
    ctx.drawImage(item.data, ...item.offset);
  };

  for (const item of items) {
    switch (item.kind) {
      case "image":
        renderImage(item);
        break;
      case "text":
        // TODO: implement this.
        break;
      default:
        item satisfies never;
    }
  }
};
