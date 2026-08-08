import { describe, expect, it } from "vitest";
import { Point2D } from "../../utils/geometry";
import { canvasOffset, rangeRect } from "../selectors";
import type { PageState } from "../types";

describe("canvasOffset()", () => {
  it("returns half of canvasSize when offset is zero.", () => {
    const view: PageState.View = {
      canvasSize: [800, 600],
      offset: [0, 0],
      scale: 1,
    };
    expect(canvasOffset(view).tuple()).toStrictEqual([400, 300]);
  });

  it("subtracts offset scaled by view.scale.", () => {
    const view: PageState.View = {
      canvasSize: [800, 600],
      offset: [100, 50],
      scale: 2,
    };
    expect(canvasOffset(view).tuple()).toStrictEqual([200, 200]);
  });

  it("supports negative offsets.", () => {
    const view: PageState.View = {
      canvasSize: [800, 600],
      offset: [-100, -50],
      scale: 1,
    };
    expect(canvasOffset(view).tuple()).toStrictEqual([500, 350]);
  });
});

describe("rangeRect()", () => {
  it("returns the rect of a range dragged down and right.", () => {
    const rect = rangeRect([new Point2D(10, 20), new Point2D(110, 70)]);
    expect(rect.head.tuple()).toStrictEqual([10, 20]);
    expect(rect.tail.tuple()).toStrictEqual([110, 70]);
    expect(rect.size.tuple()).toStrictEqual([100, 50]);
  });

  it("sorts the corners of a range dragged up and left.", () => {
    const rect = rangeRect([new Point2D(110, 70), new Point2D(10, 20)]);
    expect(rect.head.tuple()).toStrictEqual([10, 20]);
    expect(rect.tail.tuple()).toStrictEqual([110, 70]);
    expect(rect.size.tuple()).toStrictEqual([100, 50]);
  });

  it("returns an empty rect for a range of a single point.", () => {
    const rect = rangeRect([new Point2D(10, 20), new Point2D(10, 20)]);
    expect(rect.size.tuple()).toStrictEqual([0, 0]);
  });
});
