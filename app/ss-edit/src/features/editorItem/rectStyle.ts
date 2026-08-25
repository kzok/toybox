import type { EditorItem } from "./types";

/**
 * how much wider the outline is than the line it surrounds.
 * @note the outline is what keeps one colour legible on a light UI, a dark terminal and a photo
 *   alike, the same way a text item's does.
 */
const OUTLINE_RATIO = 1.6;

/**
 * how far the shadow is blurred, relative to the outline casting it.
 * @note unrelated to `OUTLINE_RATIO` despite the matching value: a blur much tighter than the
 *   outline leaves the band's core fully opaque, which reads as a hard black edge rather than a
 *   shadow. this ratio is what keeps a rect item's shadow as soft as a text item's.
 */
const SHADOW_BLUR_RATIO = 1.6;

/**
 * @param item rect item
 * @returns shared style/layout size (px) for rect item rendering
 * @note the outline straddles the path it is stroked along, hence `padding` takes up the half of
 *   it lying outside. that keeps `offset` the visible top-left corner whatever the line width,
 *   the same way a text item's padding does.
 */
export const rectStyleSizeOf = (
  item: EditorItem.Rect,
): {
  strokeWidth: number;
  padding: number;
  shadowBlur: number;
  shadowOffset: number;
} => {
  const strokeWidth = Math.ceil(item.lineWidth * OUTLINE_RATIO);

  return {
    strokeWidth,
    padding: strokeWidth / 2,
    shadowBlur: strokeWidth * SHADOW_BLUR_RATIO,
    shadowOffset: strokeWidth / 2,
  };
};
