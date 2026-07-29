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
    /** actual editor pane size px in [width, height] */
    paneSize: Tuple2D;
    /** offset (from center point, NOT top-left) */
    centerOffset: Tuple2D;
    /** scale multiplier */
    scale: number;
  }>;

  /** editor item */
  export type Item = Item.Image;
  export namespace Item {
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
