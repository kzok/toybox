/**
 * a 2D coordinate expressing (x, y) or (width, height)
 */
export type Coordinate2D = readonly [number, number];

export namespace EditorState {
  export namespace Item {
    /** drawing line */
    export type Line = Readonly<{
      kind: "line";
      head: Coordinate2D;
      tail: Coordinate2D;
      color: string;
      width: number;
    }>;
  }

  /** editor item */
  export type Item = Item.Line;

  /** editor view */
  export type View = Readonly<{
    /** actual <svg/> size px */
    size: Readonly<{ width: number; height: number }>;
    /** current view offset */
    offset: Coordinate2D;
  }>;
}

/** entire editor state */
export type EditorState = Readonly<{
  /** state about view in <canvas/> */
  view: EditorState.View;
  /** state about paintable items */
  items: readonly EditorState.Item[];
}>;
