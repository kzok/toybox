import { type EditorItem, measuredFontFamily, splitLines, textStyleSizeOf } from "../editorItem";
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
        throw new Error(`unknown item: ${JSON.stringify(item)}`);
    }
  }
};

const renderImage = (ctx: CanvasContext2D, item: EditorItem.Image): void => {
  ctx.drawImage(item.data, item.offset[0], item.offset[1], item.width, item.height);
};

/**
 * @param fontSize font size (px)
 * @returns blur radius of the shadow cast by the text (px)
 */
const shadowBlurOf = (fontSize: number): number => Math.ceil(fontSize / 3);

/**
 * @param fontSize font size (px)
 * @returns distance the shadow is offset towards the bottom right (px)
 */
const shadowOffsetOf = (fontSize: number): number => Math.ceil(fontSize / 12);

const renderText = (ctx: CanvasContext2D, item: EditorItem.Text): void => {
  const { padding, lineHeight, letterSpacing } = textStyleSizeOf(item);
  const strokeWidth = Math.ceil(item.fontSize / 6);
  const shadowBlur = shadowBlurOf(item.fontSize);
  const shadowOffset = shadowOffsetOf(item.fontSize);

  ctx.save();
  ctx.translate(...item.offset);
  ctx.translate(padding, padding);
  ctx.font = `bold ${item.fontSize}px ${measuredFontFamily()}`;
  ctx.letterSpacing = `${letterSpacing}px`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = strokeWidth;
  ctx.fillStyle = item.color;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = shadowOffset;
  ctx.shadowOffsetY = shadowOffset;

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
    ctx.strokeStyle = "#000";
    ctx.strokeText(line, 0, y);
    ctx.shadowColor = "transparent";

    // outline text
    ctx.strokeStyle = "#fff";
    ctx.strokeText(line, 0, y);

    // inner text
    ctx.fillText(line, 0, y);
  }

  ctx.restore();
};
