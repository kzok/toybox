/** width (px) across the back of the arrowhead, corner to corner */
const HEAD_WIDTH = 34;

/** how far (px) the arrowhead reaches back from the tip */
const HEAD_LENGTH = 40;

/** how far (px) the white outline stands out from the edge of the shape it surrounds */
const OUTLINE_BAND = 2.5;

/** length (px) an arrow is never laid out below */
const MIN_LENGTH_PX = 120;

/**
 * @param length desired length (px), below the minimum or not
 * @returns the length an arrow item can actually take
 */
export const clampArrowLength = (length: number): number => Math.max(length, MIN_LENGTH_PX);

/** shared style/layout size (px) for arrow item rendering. */
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

  /** the width to stroke a shape at so that it gains `OUTLINE_BAND` of outline. */
  outlineWidth: OUTLINE_BAND * 2,
  /** how far the drawing reaches to the side of the line from tail to tip */
  padding: HEAD_WIDTH / 2 + OUTLINE_BAND,
} as const;
