import { describe, expect, it } from "vitest";
import { clampFontSize, clampTextWidth } from "../textStyle";

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

  it("does not go below ten graphemes' worth of the font size.", () => {
    expect(clampTextWidth(319, 32)).toBe(320);
    expect(clampTextWidth(0, 32)).toBe(320);
    expect(clampTextWidth(-1000, 32)).toBe(320);
  });

  it("takes the minimum from the font size it is given.", () => {
    expect(clampTextWidth(0, 12)).toBe(120);
    expect(clampTextWidth(0, 72)).toBe(720);
  });
});
