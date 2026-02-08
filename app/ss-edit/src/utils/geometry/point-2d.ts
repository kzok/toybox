import type { Tuple2D } from "./types";

type PointerArg = Tuple2D | Readonly<Record<"x" | "y", number>>;

/**
 * @param arg non-asserted parameter
 * @returns aligned parameter
 */
const alignArg = (arg: PointerArg): readonly [number, number] => {
  if (typeof arg === "object" && "x" in arg) {
    return [arg.x, arg.y];
  }
  return arg;
};

/** immutable plane point */
export class Point2D {
  static new(...args: [PointerArg] | [number, number]): Point2D {
    if (args.length === 2) {
      return new Point2D(...args);
    }
    return new Point2D(...alignArg(args[0]));
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
  add(arg: PointerArg): Point2D {
    const [x, y] = alignArg(arg);
    return new Point2D(this.x + x, this.y + y);
  }
  /**
   * @param scale
   * @returns scaled point
   */
  scale(scale: number, origin: PointerArg = [0, 0]): Point2D {
    const originP = alignArg(origin);
    const x = (this.x - originP[0]) * scale + originP[0];
    const y = (this.y - originP[1]) * scale + originP[1];
    return new Point2D(x, y);
  }
  /**
   * @returns inverted point
   */
  invert(): Point2D {
    return new Point2D(-this.x, -this.y);
  }
  /**
   * @returns [x, y]
   */
  tuple(): [number, number] {
    return [this.x, this.y];
  }
}
