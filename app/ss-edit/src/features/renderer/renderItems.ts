import type { EditorItem } from "../editorItem";
import type { CanvasContext2D } from "./types";

/**
 * render editor items
 * @param ctx
 * @param items editor items
 */
export const renderEditorItems = (ctx: CanvasContext2D, items: readonly EditorItem[]) => {
  for (const item of items) {
    switch (item.kind) {
      case "image":
        renderImage(ctx, item);
        break;
      case "text":
        renderText(ctx, item);
        break;
      default:
        item satisfies never;
    }
  }
};

const renderImage = (ctx: CanvasContext2D, item: EditorItem.Image): void => {
  ctx.drawImage(item.data, ...item.offset);
};

const renderText = (ctx: CanvasContext2D, item: EditorItem.Text): void => {
  const [x, y] = item.offset;
  const strokeWidth = Math.ceil(item.fontSize / 6);
  const letterSpacing = Math.ceil(strokeWidth / 2);

  ctx.save();
  ctx.font = `bold ${item.fontSize}px "Noto Sans JP"`;
  ctx.letterSpacing = `${letterSpacing}px`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";

  // text shadow
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = letterSpacing;
  ctx.shadowOffsetY = letterSpacing;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = strokeWidth;
  ctx.strokeText(item.content, x, y);
  ctx.shadowColor = "transparent";

  // outline text
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = strokeWidth;
  ctx.strokeText(item.content, x, y);

  // inner text
  ctx.fillStyle = item.color;
  ctx.fillText(item.content, x, y);

  ctx.restore();
};
