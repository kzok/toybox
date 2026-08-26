import type { Vec2 } from "../../utils/geometry";

/** editor item */
export type EditorItem = EditorItem.Image | EditorItem.Text | EditorItem.Rect;

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
}

/** text item layout part */
export type TextItemLayout = Pick<EditorItem.Text, "width" | "fontSize" | "content">;
