import type { EditorItem } from "./types";

/** how much wider the outline is than the line it surrounds. */
const OUTLINE_RATIO = 1.7;

/** line width a rect item never takes below */
export const MIN_RECT_LINE_WIDTH_PX = 1;
/** line width a rect item never takes above */
export const MAX_RECT_LINE_WIDTH_PX = 12;

/**
 * @param lineWidth desired line width (px), fractional or out of range
 * @returns the line width a rect item can actually take
 */
export const clampRectLineWidth = (lineWidth: number): number =>
  Math.min(Math.max(Math.round(lineWidth), MIN_RECT_LINE_WIDTH_PX), MAX_RECT_LINE_WIDTH_PX);

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
  } as const;
};
