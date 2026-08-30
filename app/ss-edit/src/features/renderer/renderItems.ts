import {
  ARROW_STYLE_SIZE,
  type EditorItem,
  measuredFontFamily,
  rectStyleSizeOf,
  splitLines,
  textStyleSizeOf,
} from "../editorItem";
import type { CanvasContext2D } from "./types";

/**
 * render editor item
 * @param ctx
 * @param item editor item
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
    default:
      item satisfies never;
      throw new Error(`unknown item: ${JSON.stringify(item)}`);
  }
};

const renderImage = (ctx: CanvasContext2D, item: EditorItem.Image): void => {
  ctx.drawImage(item.data, item.offset[0], item.offset[1], item.width, item.height);
};

/**
 * @param fontSize font size (px)
 * @returns blur radius of the shadow cast by the text (px)
 */
const textShadowBlurOf = (fontSize: number): number => Math.ceil(fontSize / 3);

/**
 * @param fontSize font size (px)
 * @returns distance the shadow is offset towards the bottom right (px)
 */
const textShadowOffsetOf = (fontSize: number): number => Math.ceil(fontSize / 12);

const renderText = (ctx: CanvasContext2D, item: EditorItem.Text): void => {
  const { padding, lineHeight, letterSpacing } = textStyleSizeOf(item);
  const strokeWidth = Math.ceil(item.fontSize / 6);
  const shadowBlur = textShadowBlurOf(item.fontSize);
  const shadowOffset = textShadowOffsetOf(item.fontSize);

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

    // NOTE: every draw call casts its own shadow, hence off again immediately.
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

const renderRect = (ctx: CanvasContext2D, item: EditorItem.Rect): void => {
  const { strokeWidth, padding, shadowBlur, shadowOffset } = rectStyleSizeOf(item);

  // NOTE: one path stroked three times, so that the three widths cannot drift apart.
  const path = new Path2D();
  path.roundRect(0, 0, item.width, item.height, item.lineWidth);

  ctx.save();
  ctx.translate(...item.offset);
  ctx.translate(padding, padding);
  ctx.lineJoin = "round";
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = shadowOffset;
  ctx.shadowOffsetY = shadowOffset;

  // NOTE: every draw call casts its own shadow, hence off again immediately.
  // NOTE: the black is drawn at the same width as the white hiding it, so that the shadow's
  //   silhouette is the one that is actually visible.
  ctx.lineWidth = strokeWidth;
  ctx.shadowColor = "#000";
  ctx.strokeStyle = "#000";
  ctx.stroke(path);
  ctx.shadowColor = "transparent";

  // outline
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
  const {
    outlineWidth,
    headLength,
    headWidth,
    headNotch,
    shaftTailWidth,
    shaftHeadWidth,
    shadowBlur,
    shadowOffset,
  } = ARROW_STYLE_SIZE;
  /** where the back two corners of the head sit on the axis */
  const backX = item.length - headLength;
  /**
   * the control point of the curve that dents the head's back edge.
   * @note twice the notch out, a quadratic curve only reaching half way to its control point —
   *   B(0.5) is the average of the midpoint of the two ends and the control point — so the dent
   *   bottoms out `headNotch` deep, at `backX + headNotch`.
   */
  const notchControlX = backX + headNotch * 2;

  // NOTE: a filled wedge rather than a stroked line, so that it can taper.
  // NOTE: it runs to the control point, past where the dent bottoms out: stopping short of the
  //   dent would leave a gap between the two shapes, and landing exactly on it would have them
  //   abut and show an antialiased seam.
  // NOTE: the tail is closed with a semicircle centred on the item's `offset` rather than with
  //   the flat edge `closePath()` would leave, which puts the back of the shaft half its own
  //   width behind `offset`. `padding` covers that, being wider than half the head.
  const shaft = new Path2D();
  shaft.moveTo(0, -shaftTailWidth / 2);
  shaft.lineTo(notchControlX, -shaftHeadWidth / 2);
  shaft.lineTo(notchControlX, shaftHeadWidth / 2);
  shaft.lineTo(0, shaftTailWidth / 2);
  shaft.arc(0, 0, shaftTailWidth / 2, Math.PI / 2, -Math.PI / 2);
  shaft.closePath();

  // NOTE: a triangle whose back edge is bowed in towards the tip.
  const head = new Path2D();
  head.moveTo(item.length, 0);
  head.lineTo(backX, -headWidth / 2);
  head.quadraticCurveTo(notchControlX, 0, backX, headWidth / 2);
  head.closePath();

  ctx.save();
  ctx.translate(...item.offset);
  ctx.rotate(item.angle);
  // NOTE: sharpens the corners of both shapes. the default `miterLimit` of 10 drops a join back
  // to a bevel below a tip angle of about 11 degrees, which is where a head narrowed further
  // would silently stop being pointed.
  ctx.lineJoin = "miter";
  ctx.lineWidth = outlineWidth;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = shadowOffset;
  ctx.shadowOffsetY = shadowOffset;

  // NOTE: both shapes are drawn the same way and at one stroke width — the fill is the shape
  // itself, and the stroke only lays the outline around it, half of `outlineWidth` landing
  // outside the path. nothing here widens a shape beyond the path it is built from.
  // NOTE: every draw call casts its own shadow, hence off again immediately.
  ctx.shadowColor = "#000";
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
