/** width (px) across the back of the arrowhead, corner to corner */
const HEAD_WIDTH = 34;

/** how far (px) the arrowhead reaches back from the tip */
const HEAD_LENGTH = 40;

/** how far (px) the white outline stands out from the edge of the shape it surrounds */
const OUTLINE_BAND = 2.5;

/**
 * length (px) an arrow is never laid out below.
 * @note three times the arrowhead's own length, which leaves a visible stub of shaft behind the
 *   head even at the minimum. that is also why the head is never scaled down to fit a short
 *   arrow: it cannot outgrow an arrow that is always at least this long.
 */
const MIN_LENGTH_PX = HEAD_LENGTH * 3;

/**
 * @param length desired length (px), below the minimum or not
 * @returns the length an arrow item can actually take
 * @note bounded for the same reason a rect item's side is (see `clampRectSide`): an arrow short
 *   enough to disappear under its own head could never be grabbed again.
 */
export const clampArrowLength = (length: number): number => Math.max(length, MIN_LENGTH_PX);

/**
 * shared style/layout size (px) for arrow item rendering.
 * @note a constant rather than a function of the item, unlike `rectStyleSizeOf` and
 *   `textStyleSizeOf`: nothing here is derived from a field, an arrow carrying no width of its
 *   own. it serves the same purpose those do all the same — the renderer, the two mode overlays
 *   and `measureItem` read these values rather than recomputing them inline.
 * @note every dimension here is the size the arrow actually appears at on screen, hence they are
 *   stated flat rather than as ratios of one another. `renderArrow` is what holds that up. the
 *   two derived values at the end are consequences rather than knobs.
 */
export const ARROW_STYLE_SIZE = {
  /** across the tail, where the shaft is at its thinnest */
  shaftTailWidth: 4,
  /** across the point where the shaft hands over to the head */
  shaftHeadWidth: 10,
  headWidth: HEAD_WIDTH,
  headLength: HEAD_LENGTH,
  /** how deep the back edge of the head is bowed in towards the tip */
  headNotch: 4,
  shadowBlur: 9,
  shadowOffset: 4,

  // NOTE: derived. the width to stroke a shape at so that it gains `OUTLINE_BAND` of outline,
  //   half of a stroke landing outside the path it runs along.
  outlineWidth: OUTLINE_BAND * 2,
  // NOTE: derived. how far the drawing reaches to the side of the line from tail to tip, taken
  //   off the arrowhead because it is the widest part — the shaft never reaches as far, and the
  //   notch only ever moves the back edge inwards. uniform on every side, so that `measureItem`
  //   can grow the tail-to-tip rect by it whatever the angle, the shadow left out as a rect
  //   item's is.
  padding: HEAD_WIDTH / 2 + OUTLINE_BAND,
} as const;
