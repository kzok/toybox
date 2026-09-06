import { Vec2 } from "./vec2";

/** immutable 2D rect */
export class Rect {
  static new(p0: Vec2.Param, p1: Vec2.Param): Rect {
    return new Rect(Vec2.new(p0), Vec2.new(p1));
  }
  /** rect top-left position */
  public readonly head: Vec2;
  /** rect bottom-right position */
  public readonly tail: Vec2;
  /** rect size */
  public readonly size: Vec2;
  constructor(p0: Vec2, p1: Vec2) {
    this.head = new Vec2(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y));
    this.tail = new Vec2(Math.max(p0.x, p1.x), Math.max(p0.y, p1.y));
    this.size = this.tail.sub(this.head);
  }
  /**
   * Boundaries are inclusive, so a rect contains itself and any edge-touching rect.
   */
  contains(another: Rect): boolean {
    return (
      this.head.x <= another.head.x &&
      this.head.y <= another.head.y &&
      another.tail.x <= this.tail.x &&
      another.tail.y <= this.tail.y
    );
  }
  /**
   * @returns the smallest rect containing both, or the instance itself if it already contains another
   */
  union(another: Rect): Rect {
    if (this.contains(another)) return this;
    return new Rect(
      new Vec2(Math.min(this.head.x, another.head.x), Math.min(this.head.y, another.head.y)),
      new Vec2(Math.max(this.tail.x, another.tail.x), Math.max(this.tail.y, another.tail.y)),
    );
  }
}
