import {
  arrowStyleSizeOf,
  type EditorItem,
  measuredFontFamily,
  rectStyleSizeOf,
  splitLines,
  textStyleSizeOf,
} from "../editorItem";
import type { CanvasContext2D } from "./types";

/**
 * render editor item
 */
export const renderEditorItem = (ctx: CanvasContext2D, item: EditorItem) => {
  switch (item.kind) {
    case "image":
      renderImage(ctx, item);
      break;
    case "text":
      renderText(ctx, item);
      break;
    case "rect":
      renderRect(ctx, item);
      break;
    case "arrow":
      renderArrow(ctx, item);
      break;
    case "mosaic":
      renderMosaic(ctx, item);
      break;
    default:
      item satisfies never;
      throw new Error(`unknown item: ${JSON.stringify(item)}`);
  }
};

const SHADOW_COLOR = "rgba(0,0,0,0.6)";

const renderImage = (ctx: CanvasContext2D, item: EditorItem.Image): void => {
  ctx.drawImage(item.data, item.offset[0], item.offset[1], item.width, item.height);
};

const renderText = (ctx: CanvasContext2D, item: EditorItem.Text): void => {
  const { lineHeight, letterSpacing } = textStyleSizeOf(item);
  const strokeWidth = Math.ceil(item.fontSize / 6);
  const shadowBlur = Math.ceil(item.fontSize / 24);
  const shadowOffset = Math.ceil(item.fontSize / 12);

  ctx.save();
  ctx.translate(...item.offset);
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

  // the measured text is arbitrary since only font-wide metrics are used.
  const metrics = ctx.measureText("あ");
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  // CSS line boxes floor the half-leading, so rounding up shifts the
  // baseline 1px below the DOM overlay on some font sizes.
  const halfLeading = Math.floor((lineHeight - (ascent + descent)) / 2);
  const firstBaseline = halfLeading + ascent;

  const lines = splitLines(item);
  for (const [index, line] of lines.entries()) {
    const y = firstBaseline + index * lineHeight;

    // shadow
    ctx.shadowColor = SHADOW_COLOR;
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

const renderRect = (ctx: CanvasContext2D, item: EditorItem.Rect): void => {
  const { strokeWidth, padding } = rectStyleSizeOf(item);

  // rect path
  const path = new Path2D();
  path.roundRect(0, 0, item.width, item.height, item.lineWidth);

  ctx.save();
  ctx.translate(...item.offset);
  ctx.translate(padding, padding);
  ctx.lineJoin = "round";

  // outline
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "#fff";
  ctx.stroke(path);

  // inner line
  ctx.lineWidth = item.lineWidth;
  ctx.strokeStyle = item.color;
  ctx.stroke(path);

  ctx.restore();
};

/**
 * @note laid out along +x from the origin and rotated into place, so that the geometry stays one
 *   dimensional. `angle` is exactly what `ctx.rotate()` takes (see `EditorItem.Arrow`).
 */
const renderArrow = (ctx: CanvasContext2D, item: EditorItem.Arrow): void => {
  const { outlineWidth, headLength, headWidth, headNotchControl, shaftTailWidth, shaftHeadWidth } =
    arrowStyleSizeOf(item.length);
  /** where the back two corners of the head sit on the axis */
  const backX = item.length - headLength;
  /** the control point of the curve that dents the head's back edge. */
  const notchControlX = backX + headNotchControl;

  /** a filled wedge rather than a stroked line. */
  const shaft = new Path2D();
  shaft.moveTo(0, -shaftTailWidth / 2);
  shaft.lineTo(notchControlX, -shaftHeadWidth / 2);
  shaft.lineTo(notchControlX, shaftHeadWidth / 2);
  shaft.lineTo(0, shaftTailWidth / 2);
  shaft.arc(0, 0, shaftTailWidth / 2, Math.PI / 2, -Math.PI / 2);
  shaft.closePath();

  /** a triangle whose back edge is bowed in towards the tip. */
  const head = new Path2D();
  head.moveTo(item.length, 0);
  head.lineTo(backX, -headWidth / 2);
  head.quadraticCurveTo(notchControlX, 0, backX, headWidth / 2);
  head.closePath();

  ctx.save();
  ctx.translate(...item.offset);
  ctx.rotate(item.angle);
  ctx.lineJoin = "miter";
  ctx.lineWidth = outlineWidth;
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  // shadow
  ctx.shadowColor = SHADOW_COLOR;
  ctx.strokeStyle = "#000";
  ctx.stroke(shaft);
  ctx.stroke(head);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#000";
  ctx.fill(shaft);
  ctx.fill(head);

  // outline
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.stroke(shaft);
  ctx.stroke(head);
  ctx.fill(shaft);
  ctx.fill(head);

  // inner
  ctx.fillStyle = item.color;
  ctx.fill(shaft);
  ctx.fill(head);

  ctx.restore();
};

/**
 * @note reads back what `ctx` already holds, so every item behind the mosaic must have been painted
 *   before this is called.
 * @note the grid is laid in canvas coordinates from the item's offset, never in the pixels of
 *   `ctx.canvas`, so that neither the view transform nor the export crop shifts the blocks.
 */
const renderMosaic = (ctx: CanvasContext2D, item: EditorItem.Mosaic): void => {
  const [x, y] = item.offset;
  const columns = Math.ceil(item.width / item.blockSize);
  const rows = Math.ceil(item.height / item.blockSize);
  // whole blocks, the last column and row reaching past the item and clipped off below.
  const gridWidth = columns * item.blockSize;
  const gridHeight = rows * item.blockSize;

  const transform = ctx.getTransform();
  const sourceHead = transform.transformPoint({ x, y });
  const sourceTail = transform.transformPoint({ x: x + gridWidth, y: y + gridHeight });

  // one pixel per block, averaging what lies behind it.
  const blocks = new OffscreenCanvas(columns, rows);
  const blocksCtx = blocks.getContext("2d");
  if (blocksCtx == null) {
    throw new Error("failed to get OffscreenCanvas context 2d.");
  }
  blocksCtx.imageSmoothingQuality = "high";
  blocksCtx.drawImage(
    ctx.canvas,
    sourceHead.x,
    sourceHead.y,
    sourceTail.x - sourceHead.x,
    sourceTail.y - sourceHead.y,
    0,
    0,
    columns,
    rows,
  );

  const clip = new Path2D();
  clip.rect(x, y, item.width, item.height);

  ctx.save();
  ctx.clip(clip);
  // a block averaged with transparency is itself translucent, and would let the sharp content
  // behind it show through were it drawn over rather than in place of that content.
  ctx.clearRect(x, y, item.width, item.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(blocks, x, y, gridWidth, gridHeight);
  ctx.restore();
};
