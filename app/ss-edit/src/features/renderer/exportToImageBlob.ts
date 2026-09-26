import { type EditorItem, measurePicture } from "../editorItem";
import { renderEditorItem } from "./renderItems";

export const ALL_FORMAT = ["image/png", "image/webp"] as const satisfies readonly string[];
export const ALL_BACKGROUND = ["white", "transparent"] as const satisfies readonly string[];

export type ExportOption = Readonly<{
  format: (typeof ALL_FORMAT)[number];
  background: (typeof ALL_BACKGROUND)[number];
}>;

export const DEFAULT_OPTION: ExportOption = {
  format: "image/png",
  background: "white",
};

/**
 * renders editor items onto an off-screen canvas and encodes it as an image blob.
 * @returns blob in `option.format`, tightly cropped to the items' bounding box
 */
export const exportToImageBlob = async (
  items: readonly EditorItem[],
  option: Partial<ExportOption> = {},
): Promise<Blob> => {
  const completedOption: ExportOption = { ...DEFAULT_OPTION, ...option };
  const { head, size } = measurePicture(items);
  const canvas = new OffscreenCanvas(Math.ceil(size.x), Math.ceil(size.y));
  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    throw new Error("failed to get OffscreenCanvas context 2d.");
  }
  // background
  switch (completedOption.background) {
    case "white": {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  ctx.translate(-head.x, -head.y);
  for (const item of items) {
    renderEditorItem(ctx, item);
  }
  return canvas.convertToBlob({ type: completedOption.format });
};
