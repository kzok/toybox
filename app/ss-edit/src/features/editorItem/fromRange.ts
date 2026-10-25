import { z } from "zod";
import { Rect, type Vec2 } from "../../utils/geometry";
import { clampArrowLength } from "./arrowStyle";
import { clampMosaicBlockSize, clampMosaicSide } from "./mosaicStyle";
import { NEW_ITEM_COLOR } from "./palette";
import { clampRectLineWidth, clampRectSide } from "./rectStyle";
import { clampFontSize, clampTextWidth } from "./textStyle";
import type { AddableItemKind, EditorItem } from "./types";

/** the styles a new item starts with, one value for each property whichever kind has it */
export type NewItemStyle = Readonly<{
  /** color of a kind that has a `color` */
  color: string;
  /** font size (px) of a text item */
  fontSize: number;
  /** line width (px) of a rect item */
  lineWidth: number;
  /** block size (px) of a mosaic item */
  blockSize: number;
}>;

/**
 * the schema that a stored `NewItemStyle` must fit to be read back, with every field optional.
 * @note it lets a value out of range through: `editorItemFromRange` clamps every style anyway.
 */
export const newItemStyleSchema = z
  .object({
    color: z.string(),
    fontSize: z.number(),
    lineWidth: z.number(),
    blockSize: z.number(),
  })
  .partial();

/** the styles a new item starts with until the user sets any */
export const DEFAULT_NEW_ITEM_STYLE: NewItemStyle = {
  color: NEW_ITEM_COLOR,
  fontSize: 32,
  lineWidth: 4,
  blockSize: 8,
};

/** the two points a drag on the pane ran between, in canvas coordinates */
export type ItemRange = readonly [Vec2, Vec2];

/**
 * builds the item a drag on the pane asks for, without adding it anywhere.
 * @param range the drag, from the point it began at to the point it currently reaches
 * @param id item.id to give it
 * @param style the styles to give it, out of range or not
 * @returns the item that drag describes
 */
export const editorItemFromRange = (
  itemKind: AddableItemKind,
  range: ItemRange,
  id: string,
  style: NewItemStyle,
): EditorItem => {
  const { head, size } = new Rect(...range);

  switch (itemKind) {
    case "text": {
      const fontSize = clampFontSize(style.fontSize);
      return {
        kind: "text",
        id,
        content: "",
        offset: head.tuple(),
        width: clampTextWidth(size.x, fontSize),
        fontSize,
        color: style.color,
      };
    }
    case "rect": {
      return {
        kind: "rect",
        id,
        offset: head.tuple(),
        width: clampRectSide(size.x),
        height: clampRectSide(size.y),
        color: style.color,
        lineWidth: clampRectLineWidth(style.lineWidth),
      };
    }
    case "mosaic": {
      return {
        kind: "mosaic",
        id,
        offset: head.tuple(),
        width: clampMosaicSide(size.x),
        height: clampMosaicSide(size.y),
        blockSize: clampMosaicBlockSize(style.blockSize),
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
        color: style.color,
      };
    }
    default:
      itemKind satisfies never;
      throw new Error(`unknown item kind: ${JSON.stringify(itemKind)}`);
  }
};
