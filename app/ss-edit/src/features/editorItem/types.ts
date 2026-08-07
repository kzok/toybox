import type { Point2D, Tuple2D } from "../../utils/geometry";

/** editor item */
export type EditorItem = EditorItem.Image;

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
}

/** entire picture rect */
export type EditorPictureRect = Readonly<{
  /** top-left position */
  head: Point2D;
  /** bottom-right position */
  tail: Point2D;
  /** entire picture size */
  size: Point2D;
}>;
