import type { Tuple2D } from "../utils/geometry";

/** entire page state */
export type PageState = Readonly<{
  editorMode: PageState.Mode;
  editorView: PageState.View;
  editorItems: readonly PageState.Item[];
}>;

export namespace PageState {
  /** editor pane view */
  export type View = Readonly<{
    /** actual editor pane size px */
    paneSize: Readonly<{ width: number; height: number }>;
    /** current view offset */
    offset: Tuple2D;
    /** scale */
    scale: number;
  }>;

  /** editor item */
  export type Item = never;
  export namespace Item {}

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
