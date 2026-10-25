import { describe, expect, it } from "vitest";
import { clampRectLineWidth } from "../rectStyle";

describe(clampRectLineWidth, () => {
  it("keeps a line width that is already in range.", () => {
    expect(clampRectLineWidth(4)).toBe(4);
  });

  it("rounds a fractional line width.", () => {
    expect(clampRectLineWidth(4.4)).toBe(4);
    expect(clampRectLineWidth(4.5)).toBe(5);
  });

  it("does not go below the minimum.", () => {
    expect(clampRectLineWidth(0.4)).toBe(1);
    expect(clampRectLineWidth(-10)).toBe(1);
  });

  it("does not go above the maximum.", () => {
    expect(clampRectLineWidth(12.4)).toBe(12);
    expect(clampRectLineWidth(100)).toBe(12);
  });
});
