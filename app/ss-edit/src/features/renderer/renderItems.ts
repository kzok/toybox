import { type EditorItem, letterSpacingOf, lineHeightOf, splitLines } from "../editorItem";
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
  const lineHeight = lineHeightOf(item.fontSize);
  const strokeWidth = Math.ceil(item.fontSize / 6);
  const letterSpacing = letterSpacingOf(item.fontSize);

  ctx.save();
  ctx.translate(...item.offset);
  ctx.font = `bold ${item.fontSize}px "Noto Sans JP", "Noto Sans", sans-serif`;
  ctx.letterSpacing = `${letterSpacing}px`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";

  // NOTE: the measured text is arbitrary since only font-wide metrics are used.
  const metrics = ctx.measureText("あ");
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  // NOTE: CSS line boxes floor the half-leading, so rounding up shifts the
  // baseline 1px below the DOM overlay on some font sizes.
  const halfLeading = Math.floor((lineHeight - (ascent + descent)) / 2);
  const firstBaseline = halfLeading + ascent;

  const lines = splitLines(item);
  for (const [index, line] of lines.entries()) {
    const y = firstBaseline + index * lineHeight;

    // text shadow
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = letterSpacing;
    ctx.shadowOffsetY = letterSpacing;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = strokeWidth;
    ctx.strokeText(line, 0, y);
    ctx.shadowColor = "transparent";

    // outline text
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = strokeWidth;
    ctx.strokeText(line, 0, y);

    // inner text
    ctx.fillStyle = item.color;
    ctx.fillText(line, 0, y);
  }

  ctx.restore();
};
