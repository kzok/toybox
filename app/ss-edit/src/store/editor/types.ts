import type { Tuple2D } from "../../utils/geometry";

export namespace EditorState {
  /** editor view */
  export type View = Readonly<{
    /** actual <svg/> size px */
    size: Readonly<{ width: number; height: number }>;
    /** current view offset */
    offset: Tuple2D;
    /** scale */
    scale: number;
  }>;

  /** editor item */
  export type Item = Item.Line;
  export namespace Item {
    /** drawing line */
    export type Line = Readonly<{
      kind: "line";
      id: string;
      head: Tuple2D;
      tail: Tuple2D;
      color: string;
      width: number;
    }>;
  }
}

/** entire editor state */
export type EditorState = Readonly<{
  /** state about view in <canvas/> */
  view: EditorState.View;
  /** state about paintable items */
  items: readonly EditorState.Item[];
}>;
