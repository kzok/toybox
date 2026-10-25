import { describe, expect, it } from "vitest";
import { clampFontSize, clampTextWidth, scaleTextFontSize } from "../textStyle";

describe(clampFontSize, () => {
  it("keeps a font size that is already in range.", () => {
    expect(clampFontSize(32)).toBe(32);
  });

  it("rounds a fractional font size, so that it never misses the line cache.", () => {
    expect(clampFontSize(31.4)).toBe(31);
    expect(clampFontSize(31.5)).toBe(32);
  });

  it("does not go below the minimum.", () => {
    expect(clampFontSize(11.6)).toBe(12);
    expect(clampFontSize(0)).toBe(12);
    expect(clampFontSize(-100)).toBe(12);
  });

  it("does not go above the maximum.", () => {
    expect(clampFontSize(72.4)).toBe(72);
    expect(clampFontSize(1000)).toBe(72);
  });
});

describe(clampTextWidth, () => {
  it("keeps a width that is already wide enough.", () => {
    expect(clampTextWidth(400, 32)).toBe(400);
  });

  it("rounds a fractional width, so that it never misses the line cache.", () => {
    expect(clampTextWidth(400.4, 32)).toBe(400);
    expect(clampTextWidth(400.5, 32)).toBe(401);
  });

  it("does not go below four graphemes' worth of the font size.", () => {
    expect(clampTextWidth(127, 32)).toBe(128);
    expect(clampTextWidth(0, 32)).toBe(128);
    expect(clampTextWidth(-1000, 32)).toBe(128);
  });

  it("takes the minimum from the font size it is given.", () => {
    expect(clampTextWidth(0, 12)).toBe(48);
    expect(clampTextWidth(0, 72)).toBe(288);
  });
});

describe(scaleTextFontSize, () => {
  const layout = { width: 100, fontSize: 32 } as const;

  it("scales the width by the same factor as the font size.", () => {
    expect(scaleTextFontSize(layout, 48)).toStrictEqual({ width: 150, fontSize: 48 });
  });

  it("scales the width by the factor of the font size as clamped, not as asked.", () => {
    expect(scaleTextFontSize(layout, 1)).toStrictEqual({ width: 38, fontSize: 12 });
    expect(scaleTextFontSize(layout, 1000)).toStrictEqual({ width: 225, fontSize: 72 });
  });

  it("rounds the width, so that it never misses the line cache.", () => {
    // 100 * 41 / 32 = 128.125
    expect(scaleTextFontSize(layout, 41)).toStrictEqual({ width: 128, fontSize: 41 });
  });

  it("leaves the layout it is given as it is.", () => {
    const given = { ...layout };
    scaleTextFontSize(given, 48);
    expect(given).toStrictEqual(layout);
  });
});
