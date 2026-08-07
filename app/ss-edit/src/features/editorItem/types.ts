import type { Point2D, Tuple2D } from "../../utils/geometry";

/** editor item */
export type EditorItem = EditorItem.Image | EditorItem.Text;

export namespace EditorItem {
  /** image item */
  export type Image = Readonly<{
    kind: "image";
    id: string;
    /** image data */
    data: ImageBitmap;
    /** top-left offset */
    offset: Tuple2D;
  }>;

  /** text item */
  export type Text = Readonly<{
    kind: "text";
    id: string;
    /** text content */
    content: string;
    /** top-left offset */
    offset: Tuple2D;
    /** width */
    width: number;
    /** font size */
    fontSize: number;
    /** font color */
    color: string;
  }>;
}

/** editor picture/item rect */
export type EditorRect = Readonly<{
  /** top-left position */
  head: Point2D;
  /** bottom-right position */
  tail: Point2D;
  /** entire picture size */
  size: Point2D;
}>;
