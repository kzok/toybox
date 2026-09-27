import { describe, expect, it, vi } from "vitest";
import { ARROW_STYLE_SIZE } from "../arrowStyle";
import { measurePicture, textItemSizeOf } from "../measure";
import { rectStyleSizeOf } from "../rectStyle";
import { textStyleSizeOf } from "../textStyle";
import type { EditorItem } from "../types";

// NOTE: this environment's jsdom does not implement Range.prototype.getClientRects(), which
// splitLines() depends on to lay text out, so it is stubbed here to keep the test focused on
// measureItem()'s padding arithmetic rather than real text wrapping.
vi.mock("../textLayout", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../textLayout")>()),
  splitLines: vi.fn((): readonly string[] => ["first line", "second line"]),
}));

const createImageItem = (
  offset: EditorItem.Image["offset"],
  size: readonly [number, number],
): EditorItem.Image => ({
  kind: "image",
  id: `item-${offset.join(",")}`,
  data: {} as ImageBitmap,
  offset,
  width: size[0],
  height: size[1],
});

const createTextItem = (
  offset: EditorItem.Text["offset"],
  width: number,
  fontSize: number,
): EditorItem.Text => ({
  kind: "text",
  id: `item-${offset.join(",")}`,
  content: "first line\nsecond line",
  offset,
  width,
  fontSize,
  color: "#000",
});

const createRectItem = (
  offset: EditorItem.Rect["offset"],
  size: readonly [number, number],
  lineWidth: number,
): EditorItem.Rect => ({
  kind: "rect",
  id: `item-${offset.join(",")}`,
  offset,
  width: size[0],
  height: size[1],
  color: "#000",
  lineWidth,
});

const createArrowItem = (
  offset: EditorItem.Arrow["offset"],
  length: number,
  angle: number,
): EditorItem.Arrow => ({
  kind: "arrow",
  id: `item-${offset.join(",")}`,
  offset,
  length,
  angle,
  color: "#000",
});

const createMosaicItem = (
  offset: EditorItem.Mosaic["offset"],
  size: readonly [number, number],
): EditorItem.Mosaic => ({
  kind: "mosaic",
  id: `item-${offset.join(",")}`,
  offset,
  width: size[0],
  height: size[1],
});

describe(textItemSizeOf, () => {
  it("pads the laid out lines on every side to match what the renderer draws.", () => {
    const item = createTextItem([0, 0], 100, 20);
    const { padding, lineHeight } = textStyleSizeOf(item);
    // the mocked `splitLines` lays the content out as two lines.
    expect(textItemSizeOf(item).tuple()).toStrictEqual([
      100 + 2 * padding,
      2 * lineHeight + 2 * padding,
    ]);
  });

  it("grows both dimensions with the font size.", () => {
    const small = textItemSizeOf(createTextItem([0, 0], 100, 20));
    const large = textItemSizeOf(createTextItem([0, 0], 100, 40));
    expect(large.y).toBeGreaterThan(small.y);
    // the width is given rather than measured, so only the padding grows with the font size.
    expect(large.x).toBeGreaterThan(small.x);
  });
});

describe(measurePicture, () => {
  it("returns a zero-sized rect at the origin when there are no items.", () => {
    const rect = measurePicture([]);
    expect(rect.head.tuple()).toStrictEqual([0, 0]);
    expect(rect.tail.tuple()).toStrictEqual([0, 0]);
    expect(rect.size.tuple()).toStrictEqual([0, 0]);
  });

  it("encloses an item placed at a positive offset without clamping to the origin.", () => {
    const item = createImageItem([10, 20], [100, 50]);
    const rect = measurePicture([item]);
    expect(rect.head.tuple()).toStrictEqual([10, 20]);
    expect(rect.tail.tuple()).toStrictEqual([110, 70]);
    expect(rect.size.tuple()).toStrictEqual([100, 50]);
  });

  it("moves the head to enclose an item placed at a negative offset.", () => {
    const item = createImageItem([-30, -40], [100, 50]);
    const rect = measurePicture([item]);
    expect(rect.head.tuple()).toStrictEqual([-30, -40]);
    expect(rect.tail.tuple()).toStrictEqual([70, 10]);
    expect(rect.size.tuple()).toStrictEqual([100, 50]);
  });

  it("encloses every item across multiple items.", () => {
    const item1 = createImageItem([-30, 10], [40, 40]);
    const item2 = createImageItem([50, -20], [20, 60]);
    const rect = measurePicture([item1, item2]);
    expect(rect.head.tuple()).toStrictEqual([-30, -20]);
    expect(rect.tail.tuple()).toStrictEqual([70, 50]);
    expect(rect.size.tuple()).toStrictEqual([100, 70]);
  });

  it("pads a text item's rect on every side to match what the renderer draws.", () => {
    const width = 100;
    const fontSize = 20;
    const item = createTextItem([10, 20], width, fontSize);
    const rect = measurePicture([item]);
    const { padding, lineHeight } = textStyleSizeOf(item);
    const height = 2 * lineHeight;
    expect(rect.head.tuple()).toStrictEqual([10, 20]);
    expect(rect.size.tuple()).toStrictEqual([width + 2 * padding, height + 2 * padding]);
  });

  it("pads a rect item's rect on every side to take up the outline the renderer draws.", () => {
    const item = createRectItem([10, 20], [100, 50], 6);
    const rect = measurePicture([item]);
    const { padding } = rectStyleSizeOf(item);
    expect(rect.head.tuple()).toStrictEqual([10, 20]);
    expect(rect.size.tuple()).toStrictEqual([100 + 2 * padding, 50 + 2 * padding]);
  });

  it("grows a rect item's rect with the line width, keeping the head on the offset.", () => {
    const thin = measurePicture([createRectItem([10, 20], [100, 50], 2)]);
    const thick = measurePicture([createRectItem([10, 20], [100, 50], 12)]);
    expect(thick.size.x).toBeGreaterThan(thin.size.x);
    expect(thick.size.y).toBeGreaterThan(thin.size.y);
    // the padding lies inside the item, so a thicker line never moves its visible top-left corner.
    expect(thin.head.tuple()).toStrictEqual([10, 20]);
    expect(thick.head.tuple()).toStrictEqual([10, 20]);
  });

  it("takes a mosaic item's rect as it is, the blocks never reaching past the item.", () => {
    const rect = measurePicture([createMosaicItem([10, 20], [100, 50])]);
    expect(rect.head.tuple()).toStrictEqual([10, 20]);
    expect(rect.size.tuple()).toStrictEqual([100, 50]);
  });

  it("pads an arrow item's rect on every side, the offset landing inside rather than on a corner.", () => {
    const { padding } = ARROW_STYLE_SIZE;
    // pointing right, hence `Math.cos`/`Math.sin` land on exactly 1 and 0.
    const rect = measurePicture([createArrowItem([10, 20], 100, 0)]);
    expect(rect.head.tuple()).toStrictEqual([10 - padding, 20 - padding]);
    expect(rect.tail.tuple()).toStrictEqual([110 + padding, 20 + padding]);
  });

  it("encloses an arrow pointing back the way it came, whose tip is behind its offset.", () => {
    const { padding } = ARROW_STYLE_SIZE;
    // NOTE: the case that catches padding applied to the tail and the tip as they are rather than
    //   to the rect they span — that shrinks the box here instead of growing it, `offset` being
    //   the tail and hence the bottom right corner of an arrow drawn like this.
    const rect = measurePicture([createArrowItem([100, 50], 100, Math.PI)]);
    expect(rect.head.x).toBeCloseTo(-padding);
    expect(rect.head.y).toBeCloseTo(50 - padding);
    expect(rect.tail.x).toBeCloseTo(100 + padding);
    expect(rect.tail.y).toBeCloseTo(50 + padding);
  });

  it("keeps an arrow's rect the same size whichever way it points.", () => {
    const sizes = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map(
      (angle) => measurePicture([createArrowItem([10, 20], 100, angle)]).size,
    );
    for (const size of sizes) {
      // the padding is uniform, so a quarter turn only swaps the two dimensions over.
      expect(Math.min(size.x, size.y)).toBeCloseTo(Math.min(sizes[0]?.x ?? 0, sizes[0]?.y ?? 0));
      expect(Math.max(size.x, size.y)).toBeCloseTo(Math.max(sizes[0]?.x ?? 0, sizes[0]?.y ?? 0));
    }
  });
});
