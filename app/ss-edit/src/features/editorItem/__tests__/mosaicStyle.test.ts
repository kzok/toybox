import { describe, expect, it } from "vitest";
import { clampMosaicBlockSize } from "../mosaicStyle";

describe(clampMosaicBlockSize, () => {
  it("keeps a block size that is already in range.", () => {
    expect(clampMosaicBlockSize(8)).toBe(8);
  });

  it("rounds a fractional block size.", () => {
    expect(clampMosaicBlockSize(8.4)).toBe(8);
    expect(clampMosaicBlockSize(8.5)).toBe(9);
  });

  it("does not go below the minimum.", () => {
    expect(clampMosaicBlockSize(3.4)).toBe(4);
    expect(clampMosaicBlockSize(-10)).toBe(4);
  });

  it("does not go above the maximum.", () => {
    expect(clampMosaicBlockSize(32.4)).toBe(32);
    expect(clampMosaicBlockSize(100)).toBe(32);
  });
});
