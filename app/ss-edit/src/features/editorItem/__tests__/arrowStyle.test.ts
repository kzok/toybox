import { describe, expect, it } from "vitest";
import { arrowOutlineCornersOf, arrowStyleSizeOf, clampArrowLength } from "../arrowStyle";

describe(clampArrowLength, () => {
  it("keeps a length that is already long enough.", () => {
    expect(clampArrowLength(400)).toBe(400);
  });

  it("does not go below the minimum.", () => {
    expect(clampArrowLength(-100)).toBe(clampArrowLength(0));
    expect(clampArrowLength(0)).toBeGreaterThan(0);
  });
});

describe(arrowStyleSizeOf, () => {
  it("keeps every size at full size from 100px up.", () => {
    expect(arrowStyleSizeOf(400)).toStrictEqual(arrowStyleSizeOf(100));
  });

  it("scales every size down in proportion below 100px.", () => {
    const full = arrowStyleSizeOf(100);
    const half = arrowStyleSizeOf(50);
    for (const [key, value] of Object.entries(full)) {
      expect(half[key as keyof typeof half]).toBeCloseTo(value / 2);
    }
  });
});

describe(arrowOutlineCornersOf, () => {
  it("keeps the head at full size from 100px up, only the shaft growing.", () => {
    const full = arrowOutlineCornersOf(100);
    const long = arrowOutlineCornersOf(400);
    for (const [i, corner] of full.entries()) {
      expect(long[i]?.x).toBeCloseTo(corner.x + 300);
      expect(long[i]?.y).toBeCloseTo(corner.y);
    }
  });

  it("scales the whole outline down in proportion below 100px.", () => {
    const full = arrowOutlineCornersOf(100);
    const half = arrowOutlineCornersOf(50);
    for (const [i, corner] of full.entries()) {
      expect(half[i]?.x).toBeCloseTo(corner.x / 2);
      expect(half[i]?.y).toBeCloseTo(corner.y / 2);
    }
  });
});
