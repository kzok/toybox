import { describe, expect, it } from "vitest";
import { Vec2 } from "../../../utils/geometry";
import { clampArrowLength } from "../arrowStyle";
import { editorItemFromRange, type ItemRange } from "../fromRange";
import { RECT_LINE_WIDTHS } from "../rectStyle";

/**
 * @param from the point the drag began at
 * @param to the point it reaches
 * @returns the range those two points make
 */
const range = (from: readonly [number, number], to: readonly [number, number]): ItemRange => [
  new Vec2(...from),
  new Vec2(...to),
];

describe(editorItemFromRange, () => {
  describe('"text"', () => {
    it("builds a blank item sized by the dragged range.", () => {
      expect(editorItemFromRange("text", range([20, 40], [420, 80]), "item-1")).toStrictEqual({
        kind: "text",
        id: "item-1",
        content: "",
        offset: [20, 40],
        width: 400,
        // the dragged height (40px) is a single line box of this font size.
        fontSize: 32,
        color: expect.any(String),
      });
    });

    it("sorts the corners of a range dragged up and left.", () => {
      const item = editorItemFromRange("text", range([420, 80], [20, 40]), "item-1");
      expect(item.offset).toStrictEqual([20, 40]);
    });

    it("widens a range too narrow for four characters of its font size.", () => {
      const item = editorItemFromRange("text", range([20, 40], [120, 80]), "item-1");
      expect(item.kind === "text" && [item.width, item.fontSize]).toStrictEqual([128, 32]);
    });

    it("clamps a font size the range asks to be smaller than a font can be.", () => {
      // a click leaves a range of a single point behind.
      const item = editorItemFromRange("text", range([20, 40], [20, 40]), "item-1");
      expect(item.kind === "text" && [item.width, item.fontSize]).toStrictEqual([48, 12]);
    });

    it("clamps a font size the range asks to be larger than a font can be.", () => {
      const item = editorItemFromRange("text", range([20, 40], [120, 640]), "item-1");
      expect(item.kind === "text" && [item.width, item.fontSize]).toStrictEqual([288, 72]);
    });
  });

  describe('"rect"', () => {
    it("builds an item sized by the dragged range.", () => {
      expect(editorItemFromRange("rect", range([20, 40], [420, 140]), "item-1")).toStrictEqual({
        kind: "rect",
        id: "item-1",
        offset: [20, 40],
        width: 400,
        height: 100,
        color: expect.any(String),
        lineWidth: expect.any(Number),
      });
    });

    it("sorts the corners of a range dragged up and left.", () => {
      const item = editorItemFromRange("rect", range([420, 140], [20, 40]), "item-1");
      expect(item.offset).toStrictEqual([20, 40]);
    });

    it("grows a range dragged too small to be grabbed again.", () => {
      // a click leaves a range of a single point behind.
      const item = editorItemFromRange("rect", range([20, 40], [20, 40]), "item-1");
      expect(item.kind === "rect" && [item.width, item.height]).toStrictEqual([16, 16]);
      // the head of the drag is kept, so the item grows away from where it started.
      expect(item.offset).toStrictEqual([20, 40]);
    });

    it("takes a line width that the toolbar offers.", () => {
      const item = editorItemFromRange("rect", range([20, 40], [420, 140]), "item-1");
      if (item.kind !== "rect") throw new Error("not a rect item");
      expect(RECT_LINE_WIDTHS).toContain(item.lineWidth);
    });
  });

  describe('"mosaic"', () => {
    it("builds an item covering exactly the dragged range.", () => {
      expect(editorItemFromRange("mosaic", range([20, 40], [420, 140]), "item-1")).toStrictEqual({
        kind: "mosaic",
        id: "item-1",
        offset: [20, 40],
        width: 400,
        height: 100,
      });
    });

    it("sorts the corners of a range dragged up and left.", () => {
      const item = editorItemFromRange("mosaic", range([420, 140], [20, 40]), "item-1");
      expect(item.offset).toStrictEqual([20, 40]);
    });

    it("grows a range dragged too small to be grabbed again.", () => {
      // a click leaves a range of a single point behind.
      const item = editorItemFromRange("mosaic", range([20, 40], [20, 40]), "item-1");
      expect(item.kind === "mosaic" && [item.width, item.height]).toStrictEqual([16, 16]);
      // the head of the drag is kept, so the item grows away from where it started.
      expect(item.offset).toStrictEqual([20, 40]);
    });
  });

  describe('"arrow"', () => {
    it("runs from the head of the drag to its end.", () => {
      // dragged right and down, three-four-five, hence a length of 500.
      const item = editorItemFromRange("arrow", range([20, 40], [320, 440]), "item-1");
      expect(item.kind).toBe("arrow");
      // the offset is the tail, which is where the drag started rather than a corner of its box.
      expect(item.offset).toStrictEqual([20, 40]);
      expect(item.kind === "arrow" && item.length).toBeCloseTo(500);
      expect(item.kind === "arrow" && item.angle).toBeCloseTo(Math.atan2(400, 300));
    });

    it("keeps the tail where the drag began when it is dragged backwards.", () => {
      // NOTE: the case a normalised head/size loses. the drag runs up and to the left, so the
      //   tail is the bottom right of the box the two points span rather than its top left.
      const item = editorItemFromRange("arrow", range([320, 440], [20, 40]), "item-1");
      expect(item.offset).toStrictEqual([320, 440]);
      expect(item.kind === "arrow" && item.angle).toBeCloseTo(Math.atan2(-400, -300));
    });

    it("grows a drag too small, leaving it pointing right.", () => {
      // a click leaves a range of a single point behind.
      const item = editorItemFromRange("arrow", range([20, 40], [20, 40]), "item-1");
      expect(item.kind === "arrow" && item.length).toBe(clampArrowLength(0));
      // `Math.atan2(0, 0)` is +0, so a click needs no case of its own to point somewhere.
      expect(item.kind === "arrow" && item.angle).toBe(0);
      expect(item.offset).toStrictEqual([20, 40]);
    });
  });

  it("gives the item the id it is handed.", () => {
    expect(editorItemFromRange("rect", range([0, 0], [10, 10]), "given-id").id).toBe("given-id");
  });
});
