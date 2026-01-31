export type Point2D = Readonly<{
  x: number;
  y: number;
}>;

export type LineItem = Readonly<{
  kind: "line";
  head: Point2D;
  tail: Point2D;
  color: string;
  width: number;
}>;

export type Item = LineItem;

export type EditorState = Readonly<{
  items: readonly Item[];
}>;
