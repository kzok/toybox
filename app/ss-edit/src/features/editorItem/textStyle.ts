/**
 * @param fontSize font size (px)
 * @returns line height (px)
 */
export const lineHeightOf = (fontSize: number): number => Math.ceil(fontSize * 1.5);

/**
 * @param fontSize font size (px)
 * @returns letter spacing (px)
 */
export const letterSpacingOf = (fontSize: number): number => Math.ceil(fontSize / 12);

/**
 * @param fontSize font size (px)
 * @returns padding (px)
 */
export const paddingOf = (fontSize: number): number => Math.ceil(fontSize / 10);
