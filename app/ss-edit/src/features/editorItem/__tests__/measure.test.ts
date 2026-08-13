import { describe, expect, it, vi } from "vitest";
import { measurePicture } from "../measure";
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
});
