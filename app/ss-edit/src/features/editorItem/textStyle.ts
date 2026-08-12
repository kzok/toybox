import type { TextItemLayout } from "./types";

/**
 * @param layout text layout
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
  letterSpacing: Math.ceil(layout.fontSize / 12),
});

/**
 * @param layout text layout
 * @returns shared inline style for text item rendering
 * @note the cache key of `splitLines` is derived from these values.
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
