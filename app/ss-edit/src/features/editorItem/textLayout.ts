import styles from "./textLayout.module.css";
import { letterSpacingOf, lineHeightOf } from "./textStyle";
import type { EditorItem } from "./types";

export type TextLayout = Pick<EditorItem.Text, "width" | "fontSize" | "content">;

/**
 * @param layout text item
 * @returns splitted lines
 */
export const splitLines = (layout: TextLayout): string[] => {
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
 * the font family the text is measured with, for a canvas to draw the same shapes.
 * @note `ctx.font` takes a CSS font shorthand but resolves no `var()`, having no element to
 *   resolve it against. reading the value back off the element that measured the text is what
 *   keeps an exported picture and the preview it was laid out from in step.
 * @note the fallback covers an environment where the stylesheet never applied, such as jsdom.
 *   an empty family leaves the whole shorthand unparseable, which a canvas drops in silence.
 */
export const measuredFontFamily = (): string =>
  getComputedStyle(mountMeasureElement()).fontFamily || "sans-serif";

/**
 * @note grapheme segmentation does not depend on the locale;
 *   it is pinned only to keep the result identical across environments.
 */
const graphemes = new Intl.Segmenter("ja", { granularity: "grapheme" });
let measureElement: HTMLDivElement | null = null;

/**
 * @returns the hidden element the text is laid out on to be measured, mounted on first use
 * @note it hangs off `<body/>`, outside the `FluentProvider` the rendered text sits under, hence
 *   its stylesheet states the family rather than leaving it to inheritance.
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
 * @param layout text layout
 * @returns the measure element, styled for the given layout
 */
const getMeasureElement = (layout: TextLayout): HTMLDivElement => {
  const element = mountMeasureElement();
  element.style.width = `${layout.width}px`;
  element.style.fontSize = `${layout.fontSize}px`;
  element.style.lineHeight = `${lineHeightOf(layout.fontSize)}px`;
  element.style.letterSpacing = `${letterSpacingOf(layout.fontSize)}px`;
  return element;
};
