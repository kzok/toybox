import { describe, expect, it } from "vitest";
import { canvasOffset, entirePictureRect } from "../selectors";
import type { PageState } from "../types";

const createImageItem = (
  offset: PageState.Item.Image["offset"],
  size: readonly [number, number],
): PageState.Item.Image => ({
  kind: "image",
  id: `item-${offset.join(",")}`,
  data: { width: size[0], height: size[1] } as ImageBitmap,
  offset,
});

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

describe("entirePictureRect()", () => {
  it("returns a zero-sized rect at the origin when there are no items.", () => {
    const rect = entirePictureRect([]);
    expect(rect.head.tuple()).toStrictEqual([0, 0]);
    expect(rect.tail.tuple()).toStrictEqual([0, 0]);
    expect(rect.size.tuple()).toStrictEqual([0, 0]);
  });

  it("encloses an item placed at a positive offset without clamping to the origin.", () => {
    const item = createImageItem([10, 20], [100, 50]);
    const rect = entirePictureRect([item]);
    expect(rect.head.tuple()).toStrictEqual([10, 20]);
    expect(rect.tail.tuple()).toStrictEqual([110, 70]);
    expect(rect.size.tuple()).toStrictEqual([100, 50]);
  });

  it("moves the head to enclose an item placed at a negative offset.", () => {
    const item = createImageItem([-30, -40], [100, 50]);
    const rect = entirePictureRect([item]);
    expect(rect.head.tuple()).toStrictEqual([-30, -40]);
    expect(rect.tail.tuple()).toStrictEqual([70, 10]);
    expect(rect.size.tuple()).toStrictEqual([100, 50]);
  });

  it("encloses every item across multiple items.", () => {
    const item1 = createImageItem([-30, 10], [40, 40]);
    const item2 = createImageItem([50, -20], [20, 60]);
    const rect = entirePictureRect([item1, item2]);
    expect(rect.head.tuple()).toStrictEqual([-30, -20]);
    expect(rect.tail.tuple()).toStrictEqual([70, 50]);
    expect(rect.size.tuple()).toStrictEqual([100, 70]);
  });
});
