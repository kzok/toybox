import { LruCache } from "../../utils/cache";
import styles from "./textLayout.module.css";
import { textStyleOf, textStyleSizeOf } from "./textStyle";
import type { TextItemLayout } from "./types";

/** the line cache of `splitLines` */
const lineCache = new LruCache<string, readonly string[]>(1000);

export const splitLines = (layout: TextItemLayout): readonly string[] =>
  lineCache.getOrCompute(cacheKeyOf(layout), () => computeLines(layout));

/**
 * @returns the key the laid out lines are cached under
 */
const cacheKeyOf = (layout: TextItemLayout): string =>
  [...Object.values(textStyleSizeOf(layout)), layout.content].join(",");

/**
 * @returns the lines, laid out with dom and range.
 */
const computeLines = (layout: TextItemLayout): string[] => {
  const lines: string[] = [];
  const range = document.createRange();
  const measure = getMeasureElement(layout);
  for (const paragraph of layout.content.split("\n")) {
    measure.textContent = paragraph;
    const node = measure.firstChild;
    if (node == null) {
      lines.push("");
      continue;
    }
    let current = "";
    let lastTop = null;
    for (const { segment, index } of graphemes.segment(paragraph)) {
      range.setStart(node, index);
      range.setEnd(node, index + segment.length);
      const rect = range.getClientRects()[0];
      if (rect == null) {
        current += segment;
        continue;
      }
      if (lastTop != null && rect.top - lastTop > 0.5) {
        lines.push(current);
        current = segment;
      } else {
        current += segment;
      }
      lastTop = rect.top;
    }
    lines.push(current);
  }
  measure.textContent = "";

  return lines;
};

/**
 * @returns the font family the text is measured with, computed from style.
 */
export const measuredFontFamily = (): string =>
  getComputedStyle(mountMeasureElement()).fontFamily || "sans-serif";

/**
 * @note grapheme segmentation does not depend on the locale.
 */
const graphemes = new Intl.Segmenter("ja", { granularity: "grapheme" });

let measureElement: HTMLDivElement | null = null;

/**
 * @returns the hidden element the text is laid out on to be measured, mounted on first use
 * @note it hangs off `<body/>`, outside the `FluentProvider` the rendered text sits under.
 */
const mountMeasureElement = (): HTMLDivElement => {
  if (measureElement == null) {
    measureElement = document.createElement("div");
    measureElement.classList.add(styles.text!);
    measureElement.setAttribute("aria-hidden", "true");
    document.body.appendChild(measureElement);
  }
  return measureElement;
};

/**
 * @returns the measure element, styled for the given layout
 */
const getMeasureElement = (layout: TextItemLayout): HTMLDivElement => {
  const element = mountMeasureElement();
  Object.assign(element.style, textStyleOf(layout));
  return element;
};
