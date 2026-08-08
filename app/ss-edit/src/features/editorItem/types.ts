import type { Vec2 } from "../../utils/geometry";

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
    offset: Vec2.Tuple;
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
}
