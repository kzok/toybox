import { Rect, type Vec2 } from "../../utils/geometry";
import { clampArrowLength } from "./arrowStyle";
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
 * @note pure, and the only place a dragged range becomes an item. both the committed item and the
 *   preview drawn under the pointer come through here, hence the one cannot drift from the other:
 *   whatever the preview shows is by construction what releasing the pointer leaves behind.
 * @note the id is asked for rather than made here, `crypto.randomUUID()` being a side effect. it
 *   also lets the preview hold an id of its own that never reaches the item list.
 */
export const editorItemFromRange = (
  itemKind: AddableItemKind,
  range: ItemRange,
  id: string,
): EditorItem => {
  const { head, size } = new Rect(...range);

  switch (itemKind) {
    case "text": {
      // NOTE: the dragged height is a single line box, hence the inverse of the `lineHeight`
      //   that `textStyleSizeOf()` derives from the font size.
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
    case "arrow": {
      // NOTE: the drag is read end to end rather than through the normalised `head`/`size` above:
      // those come from a `Rect`, which takes the min and the max of the two points and hence
      // throws away which end the user started from. that direction is the whole of what an
      // arrow is.
      const [tail, tip] = range;
      return {
        kind: "arrow",
        id,
        offset: tail.tuple(),
        length: clampArrowLength(tip.distance(tail)),
        // NOTE: a click that never became a drag leaves the two points equal, which `Math.atan2`
        // answers 0 for — a minimum length arrow pointing right, without a case of its own, the
        // way a click leaves a rect at its minimum square.
        angle: tip.sub(tail).angle(),
        color: NEW_ITEM_COLOR,
      };
    }
    default:
      itemKind satisfies never;
      throw new Error(`unknown item kind: ${JSON.stringify(itemKind)}`);
  }
};
