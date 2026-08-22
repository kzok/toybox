import { describe, expect, it } from "vitest";
import { clampFontSize } from "../textStyle";

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
