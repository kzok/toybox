import type { EditorItem } from "./types";

/** how much wider the outline is than the line it surrounds. */
const OUTLINE_RATIO = 1.6;

/** how far the shadow is blurred, relative to the outline casting it. */
const SHADOW_BLUR_RATIO = 1.6;

/** line widths (px) the user can pick for a rect item */
export const RECT_LINE_WIDTHS: readonly number[] = [1, 2, 3, 4, 8, 12];

/** length a rect item's side is never laid out below */
const MIN_SIDE_PX = 16;

/**
 * @param side desired width or height (px), below the minimum or not
 * @returns the length a rect item's side can actually take
 */
export const clampRectSide = (side: number): number => Math.max(side, MIN_SIDE_PX);

/**
 * @returns shared style/layout size (px) for rect item rendering
 */
export const rectStyleSizeOf = (item: EditorItem.Rect) => {
  const strokeWidth = Math.ceil(item.lineWidth * OUTLINE_RATIO);

  return {
    strokeWidth,
    padding: strokeWidth / 2,
    shadowBlur: strokeWidth * SHADOW_BLUR_RATIO,
    shadowOffset: strokeWidth / 2,
  } as const;
};
