import { describe, expect, it } from "vitest";
import { Vec2 } from "../../../utils/geometry";
import { clampArrowLength } from "../arrowStyle";
import { editorItemFromRange, type ItemRange, type NewItemStyle } from "../fromRange";

/**
 * @param from the point the drag began at
 * @param to the point it reaches
 * @returns the range those two points make
 */
const range = (from: readonly [number, number], to: readonly [number, number]): ItemRange => [
  new Vec2(...from),
  new Vec2(...to),
];

/** styles within range, each unlike its default so that a test sees which one was taken */
const style: NewItemStyle = { color: "#123456", fontSize: 40, lineWidth: 6, blockSize: 12 };

describe(editorItemFromRange, () => {
  describe('"text"', () => {
    it("builds a blank item as wide as the dragged range, in the given style.", () => {
      expect(
        editorItemFromRange("text", range([20, 40], [420, 80]), "item-1", style),
      ).toStrictEqual({
        kind: "text",
        id: "item-1",
        content: "",
        offset: [20, 40],
        width: 400,
        fontSize: 40,
        color: "#123456",
      });
    });

    it("takes the font size from the style, whatever height the range is dragged to.", () => {
      const item = editorItemFromRange("text", range([20, 40], [420, 640]), "item-1", style);
      expect(item.kind === "text" && item.fontSize).toBe(40);
    });

    it("sorts the corners of a range dragged up and left.", () => {
      const item = editorItemFromRange("text", range([420, 80], [20, 40]), "item-1", style);
      expect(item.offset).toStrictEqual([20, 40]);
    });

    it("widens a range too narrow for four characters of its font size.", () => {
      // a click leaves a range of a single point behind.
      const item = editorItemFromRange("text", range([20, 40], [20, 40]), "item-1", style);
      expect(item.kind === "text" && [item.width, item.fontSize]).toStrictEqual([160, 40]);
    });

    it("clamps a font size smaller than a font can be.", () => {
      const item = editorItemFromRange("text", range([20, 40], [420, 80]), "item-1", {
        ...style,
        fontSize: 1,
      });
      expect(item.kind === "text" && item.fontSize).toBe(12);
    });

    it("clamps a font size larger than a font can be.", () => {
      const item = editorItemFromRange("text", range([20, 40], [120, 80]), "item-1", {
        ...style,
        fontSize: 1000,
      });
      expect(item.kind === "text" && [item.width, item.fontSize]).toStrictEqual([288, 72]);
    });
  });

  describe('"rect"', () => {
    it("builds an item sized by the dragged range, in the given style.", () => {
      expect(
        editorItemFromRange("rect", range([20, 40], [420, 140]), "item-1", style),
      ).toStrictEqual({
        kind: "rect",
        id: "item-1",
        offset: [20, 40],
        width: 400,
        height: 100,
        color: "#123456",
        lineWidth: 6,
      });
    });

    it("sorts the corners of a range dragged up and left.", () => {
      const item = editorItemFromRange("rect", range([420, 140], [20, 40]), "item-1", style);
      expect(item.offset).toStrictEqual([20, 40]);
    });

    it("grows a range dragged too small to be grabbed again.", () => {
      // a click leaves a range of a single point behind.
      const item = editorItemFromRange("rect", range([20, 40], [20, 40]), "item-1", style);
      expect(item.kind === "rect" && [item.width, item.height]).toStrictEqual([16, 16]);
      // the head of the drag is kept, so the item grows away from where it started.
      expect(item.offset).toStrictEqual([20, 40]);
    });

    it("clamps a line width out of the range that the item style offers.", () => {
      const item = editorItemFromRange("rect", range([20, 40], [420, 140]), "item-1", {
        ...style,
        lineWidth: 100,
      });
      expect(item.kind === "rect" && item.lineWidth).toBe(12);
    });
  });

  describe('"mosaic"', () => {
    it("builds an item covering exactly the dragged range, in the given style.", () => {
      expect(
        editorItemFromRange("mosaic", range([20, 40], [420, 140]), "item-1", style),
      ).toStrictEqual({
        kind: "mosaic",
        id: "item-1",
        offset: [20, 40],
        width: 400,
        height: 100,
        blockSize: 12,
      });
    });

    it("sorts the corners of a range dragged up and left.", () => {
      const item = editorItemFromRange("mosaic", range([420, 140], [20, 40]), "item-1", style);
      expect(item.offset).toStrictEqual([20, 40]);
    });

    it("grows a range dragged too small to be grabbed again.", () => {
      // a click leaves a range of a single point behind.
      const item = editorItemFromRange("mosaic", range([20, 40], [20, 40]), "item-1", style);
      expect(item.kind === "mosaic" && [item.width, item.height]).toStrictEqual([16, 16]);
      // the head of the drag is kept, so the item grows away from where it started.
      expect(item.offset).toStrictEqual([20, 40]);
    });

    it("clamps a block size out of the range that the item style offers.", () => {
      const item = editorItemFromRange("mosaic", range([20, 40], [420, 140]), "item-1", {
        ...style,
        blockSize: 100,
      });
      expect(item.kind === "mosaic" && item.blockSize).toBe(32);
    });
  });

  describe('"arrow"', () => {
    it("runs from the head of the drag to its end, in the given style.", () => {
      // dragged right and down, three-four-five, hence a length of 500.
      const item = editorItemFromRange("arrow", range([20, 40], [320, 440]), "item-1", style);
      expect(item.kind).toBe("arrow");
      // the offset is the tail, which is where the drag started rather than a corner of its box.
      expect(item.offset).toStrictEqual([20, 40]);
      expect(item.kind === "arrow" && item.length).toBeCloseTo(500);
      expect(item.kind === "arrow" && item.angle).toBeCloseTo(Math.atan2(400, 300));
      expect(item.kind === "arrow" && item.color).toBe("#123456");
    });

    it("keeps the tail where the drag began when it is dragged backwards.", () => {
      // NOTE: the case a normalised head/size loses. the drag runs up and to the left, so the
      //   tail is the bottom right of the box the two points span rather than its top left.
      const item = editorItemFromRange("arrow", range([320, 440], [20, 40]), "item-1", style);
      expect(item.offset).toStrictEqual([320, 440]);
      expect(item.kind === "arrow" && item.angle).toBeCloseTo(Math.atan2(-400, -300));
    });

    it("grows a drag too small, leaving it pointing right.", () => {
      // a click leaves a range of a single point behind.
      const item = editorItemFromRange("arrow", range([20, 40], [20, 40]), "item-1", style);
      expect(item.kind === "arrow" && item.length).toBe(clampArrowLength(0));
      // `Math.atan2(0, 0)` is +0, so a click needs no case of its own to point somewhere.
      expect(item.kind === "arrow" && item.angle).toBe(0);
      expect(item.offset).toStrictEqual([20, 40]);
    });
  });

  it("gives the item the id it is handed.", () => {
    expect(editorItemFromRange("rect", range([0, 0], [10, 10]), "given-id", style).id).toBe(
      "given-id",
    );
  });
});
