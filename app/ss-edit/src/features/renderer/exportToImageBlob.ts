import { type PageState, selectors } from "../../store";
import { renderEditorItems } from "./renderEditorItems";

/**
 * renders editor items onto an off-screen canvas and encodes it as a PNG blob.
 * @param items editor items
 * @returns PNG blob tightly cropped to the items' bounding box
 */
export const exportToImageBlob = async (items: readonly PageState.Item[]): Promise<Blob> => {
  const { head, size } = selectors.entirePictureRect(items);
  const canvas = new OffscreenCanvas(Math.ceil(size.x), Math.ceil(size.y));
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    throw new Error("failed to get OffscreenCanvas context 2d.");
  }
  ctx.translate(-head.x, -head.y);
  renderEditorItems(ctx, items);
  return canvas.convertToBlob({ type: "image/png" });
};
