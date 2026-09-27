import { Rect, type Vec2 } from "../../utils/geometry";
import { clampArrowLength } from "./arrowStyle";
import { clampMosaicSide } from "./mosaicStyle";
import { clampRectSide } from "./rectStyle";
import { clampFontSize, clampTextWidth } from "./textStyle";
import type { AddableItemKind, EditorItem } from "./types";

/** color of a newly added item, whichever kind it is */
const NEW_ITEM_COLOR = "#EF3171";

/** line width (px) of a newly added rect item */
const NEW_RECT_LINE_WIDTH = 4;

/** the two points a drag on the pane ran between, in canvas coordinates */
export type ItemRange = readonly [Vec2, Vec2];

/**
 * builds the item a drag on the pane asks for, without adding it anywhere.
 * @param range the drag, from the point it began at to the point it currently reaches
 * @param id item.id to give it
 * @returns the item that drag describes
 */
export const editorItemFromRange = (
  itemKind: AddableItemKind,
  range: ItemRange,
  id: string,
): EditorItem => {
  const { head, size } = new Rect(...range);

  switch (itemKind) {
    case "text": {
      // the dragged height is a single line box, hence the inverse of the `lineHeight`.
      const fontSize = clampFontSize(size.y / 1.5);
      return {
        kind: "text",
        id,
        content: "",
        offset: head.tuple(),
        width: clampTextWidth(size.x, fontSize),
        fontSize,
        color: NEW_ITEM_COLOR,
      };
    }
    case "rect": {
      return {
        kind: "rect",
        id,
        offset: head.tuple(),
        width: clampRectSide(size.x),
        height: clampRectSide(size.y),
        color: NEW_ITEM_COLOR,
        lineWidth: NEW_RECT_LINE_WIDTH,
      };
    }
    case "mosaic": {
      return {
        kind: "mosaic",
        id,
        offset: head.tuple(),
        width: clampMosaicSide(size.x),
        height: clampMosaicSide(size.y),
      };
    }
    case "arrow": {
      // the drag is read end to end rather than through the normalised `head`/`size`.
      const [tail, tip] = range;
      return {
        kind: "arrow",
        id,
        offset: tail.tuple(),
        length: clampArrowLength(tip.distance(tail)),
        angle: tip.sub(tail).angle(),
        color: NEW_ITEM_COLOR,
      };
    }
    default:
      itemKind satisfies never;
      throw new Error(`unknown item kind: ${JSON.stringify(itemKind)}`);
  }
};
