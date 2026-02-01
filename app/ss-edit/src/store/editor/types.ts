/**
 * a 2D coordinate expressing (x, y) or (width, height)
 */
export type Coordinate2D = readonly [number, number];

export namespace Editor {
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
    /** actual <canvas/> size px */
    canvas: Readonly<{ width: number; height: number }>;
  }>;

  /** editor state */
  export type State = Readonly<{
    view: View;
    items: readonly Item[];
  }>;
}
