import type { TextItemLayout } from "./types";

/** font size a text item is never laid out below */
const MIN_FONT_SIZE_PX = 12;
/** font size a text item is never laid out above */
const MAX_FONT_SIZE_PX = 72;

/**
 * @param fontSize desired font size (px), fractional or out of range
 * @returns the font size a text item can actually take
 * @note rounded as well as clamped: the cache key of `splitLines` is derived from the font size,
 *   hence a fractional one would miss the cache on every frame of a resize drag.
 */
export const clampFontSize = (fontSize: number): number =>
  Math.min(Math.max(Math.round(fontSize), MIN_FONT_SIZE_PX), MAX_FONT_SIZE_PX);

/** the fewest full-width graphemes a text item's line box is ever laid out to hold */
const MIN_WIDTH_IN_GRAPHEMES = 10;

/**
 * @param width desired width (px), fractional or below the minimum
 * @param fontSize the font size (px) the text is laid out at
 * @returns the width a text item can actually take
 * @note rounded as well as clamped, for the same reason as `clampFontSize`: the cache key of
 *   `splitLines` is derived from the width too.
 */
export const clampTextWidth = (width: number, fontSize: number): number =>
  Math.max(Math.round(width), fontSize * MIN_WIDTH_IN_GRAPHEMES);

/**
 * @returns shared style/layout size (px) for text item rendering
 */
export const textStyleSizeOf = (
  layout: TextItemLayout,
): {
  width: number;
  fontSize: number;
  padding: number;
  lineHeight: number;
  letterSpacing: number;
} => ({
  width: layout.width,
  fontSize: layout.fontSize,
  padding: Math.ceil(layout.fontSize / 10),
  lineHeight: Math.ceil(layout.fontSize * 1.5),
  // NOTE: deliberately left fractional, unlike the two above. rounding it up would step the
  // grapheme advance out of proportion with the font size, and a resize scaling the width and the
  // font size together (see `resizeTextFontSize`) would then re-wrap the text every few pixels
  // of the drag. the padding and the line height are free to be whole pixels: neither takes part
  // in the wrapping, the padding sitting outside the content box the text is laid out in.
  letterSpacing: layout.fontSize / 12,
});

/**
 * @returns shared inline style for text item rendering
 */
export const textStyleOf = (layout: TextItemLayout) => {
  const { width, fontSize, padding, lineHeight, letterSpacing } = textStyleSizeOf(layout);

  return {
    width: `${width}px`,
    fontSize: `${fontSize}px`,
    padding: `${padding}px`,
    lineHeight: `${lineHeight}px`,
    letterSpacing: `${letterSpacing}px`,
    margin: "0",
    border: "0",
    boxSizing: "content-box",
    whiteSpace: "pre-wrap",
    lineBreak: "anywhere",
    overflowWrap: "break-word",
    fontFamily: "var(--font-family)",
    fontWeight: "bold",
  } as const satisfies Partial<CSSStyleDeclaration>;
};
