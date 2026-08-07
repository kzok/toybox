import type { EditorItem } from "../features/editorItem";
import type { Tuple2D } from "../utils/geometry";

/** entire page state */
export type PageState = Readonly<{
  editorView: PageState.View;
  editorMode: PageState.Mode;
  editorItems: readonly EditorItem[];
}>;

export namespace PageState {
  /** editor view state */
  export type View = Readonly<{
    /** actual canvas size px in [width, height] */
    canvasSize: Tuple2D;
    /** offset */
    offset: Tuple2D;
    /** scale multiplier */
    scale: number;
  }>;

  /** editor mode state */
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
