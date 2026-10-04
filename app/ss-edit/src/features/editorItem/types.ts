import type { Vec2 } from "../../utils/geometry";

/** editor item */
export type EditorItem =
  | EditorItem.Image
  | EditorItem.Text
  | EditorItem.Rect
  | EditorItem.Arrow
  | EditorItem.Mosaic;

export namespace EditorItem {
  /** image item */
  export type Image = Readonly<{
    kind: "image";
    id: string;
    /** image data */
    data: ImageBitmap;
    /** top-left offset */
    offset: Vec2.Tuple;
    /** display width */
    width: number;
    /** display height */
    height: number;
  }>;

  /** text item */
  export type Text = Readonly<{
    kind: "text";
    id: string;
    /** text content */
    content: string;
    /** top-left offset */
    offset: Vec2.Tuple;
    /** width */
    width: number;
    /** font size */
    fontSize: number;
    /** font color */
    color: string;
  }>;

  /** rect item */
  export type Rect = Readonly<{
    kind: "rect";
    id: string;
    /** top-left offset */
    offset: Vec2.Tuple;
    /** display width */
    width: number;
    /** display height */
    height: number;
    /** line color */
    color: string;
    /** line width */
    lineWidth: number;
  }>;

  /** arrow item */
  export type Arrow = Readonly<{
    kind: "arrow";
    id: string;
    /**
     * the tail point of the arrow.
     * @note not the top-left of the item's box, unlike every other kind's `offset`: the tail
     *   lands on whichever corner `angle` points away from.
     */
    offset: Vec2.Tuple;
    /** distance (px) from the tail to the tip */
    length: number;
    /**
     * direction the arrow points, in radians, with 0 pointing right (+x).
     * @note a positive angle turns clockwise *on screen*, canvas coordinates having y grow
     *   downwards. that is what `Math.atan2(dy, dx)`, `Math.cos`/`Math.sin`, `ctx.rotate()` and
     *   CSS `rotate()` all take, so no consumer has to convert.
     */
    angle: number;
    /** arrow color */
    color: string;
  }>;

  /** mosaic item, pixelating whatever is painted behind it */
  export type Mosaic = Readonly<{
    kind: "mosaic";
    id: string;
    /** top-left offset */
    offset: Vec2.Tuple;
    /** display width */
    width: number;
    /** display height */
    height: number;
    /** side (px) of a single square block, in canvas coordinates */
    blockSize: number;
  }>;
}

/**
 * the kinds of item a drag on the pane adds.
 * @note an image is not among them: it arrives whole from a file rather than being dragged out.
 */
export type AddableItemKind =
  | EditorItem.Text["kind"]
  | EditorItem.Rect["kind"]
  | EditorItem.Arrow["kind"]
  | EditorItem.Mosaic["kind"];

/** text item layout part */
export type TextItemLayout = Pick<EditorItem.Text, "width" | "fontSize" | "content">;
