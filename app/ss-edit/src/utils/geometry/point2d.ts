/** 2D coordinate (x, y) tuple */
export type Tuple2D = readonly [number, number];

/**
 * @param arg non-asserted parameter
 * @returns aligned parameter
 */
const toTuple = (arg: Point2D.Param): Tuple2D => {
  if (typeof arg === "object" && "x" in arg) {
    return [arg.x, arg.y];
  }
  return arg;
};

/** immutable plane point */
export class Point2D {
  static new(...args: [Point2D.Param] | [number, number]): Point2D {
    if (args.length === 2) {
      return new Point2D(...args);
    }
    return new Point2D(...toTuple(args[0]));
  }
  /**
   * @param x x coordinate
   * @param y y coordinate
   */
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}
  /**
   * @param arg another operand
   * @returns added point
   */
  add(arg: Point2D.Param): Point2D {
    const [x, y] = toTuple(arg);
    return new Point2D(this.x + x, this.y + y);
  }
  /**
   * @param arg another operand
   * @returns subtracted point
   */
  sub(arg: Point2D.Param): Point2D {
    const [x, y] = toTuple(arg);
    return new Point2D(this.x - x, this.y - y);
  }
  /**
   * @param scale scale factor
   * @returns multiplied point
   */
  mul(scale: number): Point2D {
    return new Point2D(this.x * scale, this.y * scale);
  }
  /**
   * @param scale scale factor
   * @returns divided point
   */
  div(scale: number): Point2D {
    return new Point2D(this.x / scale, this.y / scale);
  }
  /**
   * @param scale scale factor
   * @param origin origin of scaling
   * @returns scaled point
   */
  scale(scale: number, origin: Point2D.Param): Point2D {
    return this.sub(origin).mul(scale).add(origin);
  }
  /**
   * @returns [x, y]
   */
  tuple(): [number, number] {
    return [this.x, this.y];
  }
  /**
   * @param another another point
   * @returns distance (px)
   */
  distance(another: Point2D.Param): number {
    const diff = this.sub(another);
    return Math.sqrt(diff.x ** 2 + diff.y ** 2);
  }
}

export namespace Point2D {
  /** Point2D acceptable parameter */
  export type Param = Tuple2D | Readonly<Record<"x" | "y", number>>;
}
