import type { Tuple2D } from "../utils/geometry";

/** entire page state */
export type PageState = Readonly<{
  isSaved: boolean;
  editorView: PageState.View;
  editorMode: PageState.Mode;
  editorItems: readonly PageState.Item[];
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
