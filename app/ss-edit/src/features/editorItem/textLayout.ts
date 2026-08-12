import { LruCache } from "../../utils/cache";
import styles from "./textLayout.module.css";
import { textStyleOf, textStyleSizeOf } from "./textStyle";
import type { TextItemLayout } from "./types";

/**
 * @note the working set is the text items on the picture, a handful at most. the surplus holds
 *   onto the keys an edit leaves behind, one per keystroke, so that backspacing through an edit
 *   stays a hit. an entry costs about twice the length of its content.
 */
const lineCache = new LruCache<string, readonly string[]>(1000);

/**
 * @param layout text item
 * @returns splitted lines
 * @note laying the text out costs a `getClientRects()` per grapheme, while the renderer asks for
 *   the lines of every item on every frame. only an edit ever changes the answer, hence the cache.
 */
export const splitLines = (layout: TextItemLayout): readonly string[] =>
  lineCache.getOrCompute(cacheKeyOf(layout), () => computeLines(layout));

/**
 * @param layout text layout
 * @returns the key the laid out lines are cached under
 * @note keyed by what the lines are laid out from rather than by the item identity: an item is
 *   replaced whenever it is dragged, which leaves the line breaks untouched.
 * @note the content goes last, being the only part that can hold the separator itself.
 */
const cacheKeyOf = (layout: TextItemLayout): string =>
  [...Object.values(textStyleSizeOf(layout)), layout.content].join(",");

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
const getMeasureElement = (layout: TextItemLayout): HTMLDivElement => {
  const element = mountMeasureElement();
  Object.assign(element.style, textStyleOf(layout));
  return element;
};
