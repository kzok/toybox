/** block size a mosaic item never takes below */
export const MIN_MOSAIC_BLOCK_SIZE_PX = 4;
/** block size a mosaic item never takes above */
export const MAX_MOSAIC_BLOCK_SIZE_PX = 32;

/**
 * @param blockSize desired block size (px), fractional or out of range
 * @returns the block size a mosaic item can actually take
 */
export const clampMosaicBlockSize = (blockSize: number): number =>
  Math.min(Math.max(Math.round(blockSize), MIN_MOSAIC_BLOCK_SIZE_PX), MAX_MOSAIC_BLOCK_SIZE_PX);

/** length a mosaic item's side is never laid out below */
const MIN_SIDE_PX = 16;

/**
 * @param side desired width or height (px), below the minimum or not
 * @returns the length a mosaic item's side can actually take
 */
export const clampMosaicSide = (side: number): number => Math.max(side, MIN_SIDE_PX);
