import type { Tuple2D } from "../../utils/geometry";

/** entire editor state */
export type EditorState = Readonly<{
  /** current editor action mode */
  mode: EditorState.Mode;
  /** state about view in <canvas/> */
  view: EditorState.View;
  /** state about paintable items */
  items: readonly EditorState.Item[];
}>;
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

  /** editor mode */
  export type Mode = Mode.Select;
  export namespace Mode {
    /** selection mode */
    export type Select = Readonly<{
      kind: "select";
      /** selected item Ids */
      selectedIds: readonly string[];
    }>;
  }
}
