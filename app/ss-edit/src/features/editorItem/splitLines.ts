import styles from "./splitLines.module.css";
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

const graphemes = new Intl.Segmenter("ja", { granularity: "grapheme" });
let measureElement: HTMLDivElement | null = null;

/**
 * @param layout text layout
 * @returns singleton measure element styled for the given layout
 */
const getMeasureElement = (layout: TextLayout): HTMLDivElement => {
  if (measureElement == null) {
    measureElement = document.createElement("div");
    measureElement.classList.add(styles.text!);
    measureElement.setAttribute("aria-hidden", "true");
    document.body.appendChild(measureElement);
  }
  measureElement.style.width = `${layout.width}px`;
  measureElement.style.fontSize = `${layout.fontSize}px`;
  measureElement.style.lineHeight = `${lineHeightOf(layout.fontSize)}px`;
  measureElement.style.letterSpacing = `${letterSpacingOf(layout.fontSize)}px`;
  return measureElement;
};
