import type { EditorItem } from "../features/editorItem";
import type { Vec2 } from "../utils/geometry";

/** entire page state */
export type PageState = Readonly<{
  editorView: PageState.View;
  editorMode: PageState.Mode;
  editorItems: readonly EditorItem[];
}>;

export namespace PageState {
  /** editor view state */
  export type View = Readonly<{
    /** actual canvas size px in (width, height) */
    canvasSize: Vec2;
    /**
     * picture coordinates shown at the center of the pane.
     * @note not the top-left corner; the visible top-left is `offset - canvasSize / (2 * scale)`.
     */
    offset: Vec2;
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
      /**
       * kind of the item to be added
       * @note an image is not among them: it arrives whole from a file rather than being
       *   dragged out on the pane.
       */
      itemKind: EditorItem.Text["kind"] | EditorItem.Rect["kind"] | EditorItem.Arrow["kind"];
      /** dragged range in [start, end] in canvas coordinates, or null until the drag begins */
      range: readonly [Vec2, Vec2] | null;
    }>;
  }
}
