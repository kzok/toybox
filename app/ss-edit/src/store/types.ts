import type { EditorItem } from "../features/editorItem";
import type { Point2D, Tuple2D } from "../utils/geometry";

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
  export type Mode = Mode.Select | Mode.Edit | Mode.AddItem;
  export namespace Mode {
    /** selection mode */
    export type Select = Readonly<{
      kind: "select";
      /** selected item Ids */
      selectedIds: readonly string[];
    }>;

    /** edit mode */
    export type Edit = Readonly<{
      kind: "edit";
      /** target item Id */
      itemId: string;
    }>;

    /** add item mode */
    export type AddItem = Readonly<{
      kind: "add-item";
      /** kind of the item to be added */
      itemKind: EditorItem.Text["kind"];
      /** dragged range in [start, end] in canvas coordinates, or null until the drag begins */
      range: readonly [Point2D, Point2D] | null;
    }>;
  }
}
