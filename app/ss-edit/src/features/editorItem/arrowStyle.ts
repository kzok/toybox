import { Vec2 } from "../../utils/geometry";

/** width (px) across the back of the arrowhead, corner to corner */
const HEAD_WIDTH = 34;

/** how far (px) the arrowhead reaches back from the tip */
const HEAD_LENGTH = 40;

/** how deep (px) the back edge of the head is bowed in towards the tip */
const HEAD_NOTCH = 4;

/**
 * how far (px) in front of the head's back corners the control point of the curve along its back
 * edge sits.
 * @note twice the notch, a quadratic curve only reaching half way to its control point.
 */
const HEAD_NOTCH_CONTROL = HEAD_NOTCH * 2;

/** width (px) across the tail, where the shaft is at its thinnest */
const SHAFT_TAIL_WIDTH = 4;

/** how far (px) the white outline stands out from the edge of the shape it surrounds */
const OUTLINE_BAND = 2.5;

/**
 * the shortest length (px) an arrow is drawn at full size.
 * a shorter arrow is scaled down as a whole, keeping its proportions.
 */
const FULL_SIZE_LENGTH_PX = 100;

/** length (px) an arrow is never laid out below */
const MIN_LENGTH_PX = 40;

/**
 * @param length desired length (px), below the minimum or not
 * @returns the length an arrow item can actually take
 */
export const clampArrowLength = (length: number): number => Math.max(length, MIN_LENGTH_PX);

/**
 * @param length the arrow's length (px)
 * @returns the factor every size of the arrow is drawn at, relative to its full size
 */
const scaleOf = (length: number): number => Math.min(length / FULL_SIZE_LENGTH_PX, 1);

/**
 * @param length the arrow's length (px)
 * @returns shared style/layout size (px) for arrow item rendering
 * @note every value is scaled here, the shadow included, rather than through `ctx.scale()`:
 *   a canvas shadow ignores the current transform.
 */
export const arrowStyleSizeOf = (length: number) => {
  const scale = scaleOf(length);

  return {
    shaftTailWidth: SHAFT_TAIL_WIDTH * scale,
    /** across the point where the shaft hands over to the head */
    shaftHeadWidth: 10 * scale,
    headWidth: HEAD_WIDTH * scale,
    headLength: HEAD_LENGTH * scale,
    headNotchControl: HEAD_NOTCH_CONTROL * scale,
    shadowBlur: 9 * scale,
    shadowOffset: 4 * scale,

    /** the width to stroke a shape at so that it gains `OUTLINE_BAND` of outline. */
    outlineWidth: OUTLINE_BAND * 2 * scale,
    /** how far the outline reaches out from the tail point, whichever way the arrow points */
    tailReach: (SHAFT_TAIL_WIDTH / 2 + OUTLINE_BAND) * scale,
    /** half the width of the band an arrow is hit-tested on, either side of the line from tail to tip */
    padding: (HEAD_WIDTH / 2 + OUTLINE_BAND) * scale,
  } as const;
};

/**
 * @param a direction one edge leaves the corner in
 * @param b direction the other edge leaves the corner in
 * @returns where a miter-joined outline of `OUTLINE_BAND` reaches to, relative to the corner
 */
const miterOffsetOf = (a: Vec2, b: Vec2): Vec2 => {
  const unitA = a.div(a.distance(Vec2.ORIGIN));
  const unitB = b.div(b.distance(Vec2.ORIGIN));
  const inward = unitA.add(unitB);
  const halfAngle = Math.acos(unitA.dot(unitB)) / 2;
  return inward.div(-inward.distance(Vec2.ORIGIN)).mul(OUTLINE_BAND / Math.sin(halfAngle));
};

const TIP_MITER = miterOffsetOf(
  new Vec2(-HEAD_LENGTH, -HEAD_WIDTH / 2),
  new Vec2(-HEAD_LENGTH, HEAD_WIDTH / 2),
);

/**
 * of the back corner on the -y side.
 * @note the curved back edge leaves the corner towards its control point.
 */
const BACK_MITER = miterOffsetOf(
  new Vec2(HEAD_LENGTH, HEAD_WIDTH / 2),
  new Vec2(HEAD_NOTCH_CONTROL, HEAD_WIDTH / 2),
);

/**
 * @param length the arrow's length (px)
 * @returns the corners the white outline reaches out to, on an arrow laid out along +x from its
 *   tail at the origin. the round tail is left to `tailReach`.
 */
export const arrowOutlineCornersOf = (length: number): readonly Vec2[] => {
  const scale = scaleOf(length);
  const backX = length - HEAD_LENGTH * scale;
  const tipMiter = TIP_MITER.mul(scale);
  const backMiter = BACK_MITER.mul(scale);
  return [
    new Vec2(length, 0).add(tipMiter),
    new Vec2(backX, (-HEAD_WIDTH / 2) * scale).add(backMiter),
    new Vec2(backX, (HEAD_WIDTH / 2) * scale).add([backMiter.x, -backMiter.y]),
  ];
};
