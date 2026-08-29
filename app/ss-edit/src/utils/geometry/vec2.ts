/**
 * @param arg non-asserted parameter
 * @returns aligned parameter
 */
const toTuple = (arg: Vec2.Param): Vec2.Tuple => {
  if (typeof arg === "object" && "x" in arg) {
    return [arg.x, arg.y];
  }
  return arg;
};

/** immutable 2D vector */
export class Vec2 {
  /**
   * the zero vector.
   * @note handy as the point a vector's own length is measured against, `Vec2` offering no
   *   magnitude of its own: `v.distance(Vec2.ORIGIN)`.
   */
  static readonly ORIGIN = new Vec2(0, 0);
  static new(...args: [Vec2.Param] | [number, number]): Vec2 {
    if (args.length === 2) {
      return new Vec2(...args);
    }
    return new Vec2(...toTuple(args[0]));
  }
  /**
   * @param length distance from the origin
   * @param angle direction in radians, with 0 pointing along +x
   * @returns the vector that length and angle describe
   * @note a positive angle turns towards +y, which is clockwise wherever y grows downwards, as it
   *   does in canvas and screen coordinates.
   */
  static polar(length: number, angle: number): Vec2 {
    return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length);
  }
  /**
   * @param x x component
   * @param y y component
   */
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}
  /**
   * @param arg another operand
   * @returns added vector
   */
  add(arg: Vec2.Param): Vec2 {
    const [x, y] = toTuple(arg);
    return new Vec2(this.x + x, this.y + y);
  }
  /**
   * @param arg another operand
   * @returns subtracted vector
   */
  sub(arg: Vec2.Param): Vec2 {
    const [x, y] = toTuple(arg);
    return new Vec2(this.x - x, this.y - y);
  }
  /**
   * @param scale scale factor
   * @returns multiplied vector
   */
  mul(scale: number): Vec2 {
    return new Vec2(this.x * scale, this.y * scale);
  }
  /**
   * @param scale scale factor
   * @returns divided vector
   */
  div(scale: number): Vec2 {
    return new Vec2(this.x / scale, this.y / scale);
  }
  /**
   * @param scale scale factor
   * @param origin origin of scaling
   * @returns scaled vector
   */
  scale(scale: number, origin: Vec2.Param): Vec2 {
    return this.sub(origin).mul(scale).add(origin);
  }
  /**
   * @returns [x, y]
   */
  tuple(): [number, number] {
    return [this.x, this.y];
  }
  /**
   * @param another another vector
   * @returns distance (px)
   */
  distance(another: Vec2.Param): number {
    const diff = this.sub(another);
    return Math.sqrt(diff.x ** 2 + diff.y ** 2);
  }
  /**
   * @returns the direction from the origin to this vector, in radians, with 0 pointing along +x
   * @note the inverse of `Vec2.polar`, hence the same convention: a positive angle turns towards
   *   +y. the zero vector has no direction of its own and answers 0 rather than NaN, `Math.atan2`
   *   being defined that way for two zeroes.
   */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }
  /**
   * @param arg another operand
   * @returns dot product
   */
  dot(arg: Vec2.Param): number {
    const [x, y] = toTuple(arg);
    return this.x * x + this.y * y;
  }
}

export namespace Vec2 {
  /** 2D component (x, y) tuple */
  export type Tuple = readonly [number, number];
  /** Vec2 acceptable parameter */
  export type Param = Tuple | Readonly<Record<"x" | "y", number>>;
}
