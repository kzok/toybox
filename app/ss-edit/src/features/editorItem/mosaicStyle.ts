/** length a mosaic item's side is never laid out below */
const MIN_SIDE_PX = 16;

/**
 * @param side desired width or height (px), below the minimum or not
 * @returns the length a mosaic item's side can actually take
 */
export const clampMosaicSide = (side: number): number => Math.max(side, MIN_SIDE_PX);
