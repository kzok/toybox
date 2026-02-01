/** immutable plane point */
export class Point2D {
  static new(x: number, y: number): Point2D {
    return new Point2D(x, y);
  }
  /**
   * @param x
   * @param y
   */
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}
  /**
   * @param x
   * @param y
   * @returns added point
   */
  add(x: number, y: number): Point2D {
    return Point2D.new(this.x + x, this.y + y);
  }
  /**
   * @param scale
   * @returns scaled point
   */
  scale(scale: number): Point2D {
    return Point2D.new(this.x * scale, this.y * scale);
  }
  /**
   * @returns inverted point
   */
  invert(): Point2D {
    return Point2D.new(-this.x, -this.y);
  }
  /**
   * @returns [x, y]
   */
  tuple(): [number, number] {
    return [this.x, this.y];
  }
}
