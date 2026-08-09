import { describe, expect, it } from "vitest";
import { Rect } from "../rect";
import { Vec2 } from "../vec2";

describe("Rect", () => {
  describe("new()", () => {
    it("creates new instance.", () => {
      expect(Rect.new([0, 0], [10, 20])).instanceOf(Rect);
      expect(Rect.new({ x: 0, y: 0 }, { x: 10, y: 20 })).toMatchObject({
        head: { x: 0, y: 0 },
        tail: { x: 10, y: 20 },
      });
      expect(Rect.new(Vec2.new(0, 0), [10, 20])).toMatchObject({
        head: { x: 0, y: 0 },
        tail: { x: 10, y: 20 },
      });
    });
  });

  describe("constructor", () => {
    it("sorts the corners regardless of the given order.", () => {
      const expected = { head: { x: 10, y: 20 }, tail: { x: 110, y: 70 } };
      // to bottom-right
      expect(new Rect(new Vec2(10, 20), new Vec2(110, 70))).toMatchObject(expected);
      // to top-left
      expect(new Rect(new Vec2(110, 70), new Vec2(10, 20))).toMatchObject(expected);
      // to bottom-left
      expect(new Rect(new Vec2(110, 20), new Vec2(10, 70))).toMatchObject(expected);
      // to top-right
      expect(new Rect(new Vec2(10, 70), new Vec2(110, 20))).toMatchObject(expected);
    });

    it("accepts negative coordinates.", () => {
      expect(new Rect(new Vec2(100, 0), new Vec2(-100, 48))).toMatchObject({
        head: { x: -100, y: 0 },
        tail: { x: 100, y: 48 },
      });
    });
  });

  describe("size", () => {
    it("is the distance between the corners.", () => {
      expect(Rect.new([10, 20], [110, 70]).size.tuple()).toStrictEqual([100, 50]);
      expect(Rect.new([110, 70], [10, 20]).size.tuple()).toStrictEqual([100, 50]);
      expect(Rect.new([-100, 0], [100, 48]).size.tuple()).toStrictEqual([200, 48]);
    });

    it("is zero when the rect is degenerate.", () => {
      expect(Rect.new([10, 20], [10, 20]).size.tuple()).toStrictEqual([0, 0]);
      expect(Rect.new([10, 20], [110, 20]).size.tuple()).toStrictEqual([100, 0]);
    });
  });

  describe("contains()", () => {
    const outer = Rect.new([0, 0], [100, 100]);

    it("returns true for an inner rect.", () => {
      expect(outer.contains(Rect.new([10, 10], [90, 90]))).toBe(true);
    });

    it("returns true for itself.", () => {
      expect(outer.contains(outer)).toBe(true);
    });

    it("returns true for an edge-touching inner rect.", () => {
      expect(outer.contains(Rect.new([0, 0], [50, 50]))).toBe(true);
      expect(outer.contains(Rect.new([50, 50], [100, 100]))).toBe(true);
    });

    it("returns false for a partially overlapping rect.", () => {
      expect(outer.contains(Rect.new([50, 50], [150, 150]))).toBe(false);
    });

    it("returns false for a disjoint rect.", () => {
      expect(outer.contains(Rect.new([200, 200], [300, 300]))).toBe(false);
    });

    it("returns false when the instance is the contained one.", () => {
      expect(Rect.new([10, 10], [90, 90]).contains(outer)).toBe(false);
    });
  });

  describe("union()", () => {
    const base = Rect.new([0, 0], [100, 100]);

    it("expands to the given direction.", () => {
      // left
      expect(base.union(Rect.new([-50, 0], [0, 100]))).toMatchObject({
        head: { x: -50, y: 0 },
        tail: { x: 100, y: 100 },
      });
      // right
      expect(base.union(Rect.new([100, 0], [150, 100]))).toMatchObject({
        head: { x: 0, y: 0 },
        tail: { x: 150, y: 100 },
      });
      // up
      expect(base.union(Rect.new([0, -50], [100, 0]))).toMatchObject({
        head: { x: 0, y: -50 },
        tail: { x: 100, y: 100 },
      });
      // down
      expect(base.union(Rect.new([0, 100], [100, 150]))).toMatchObject({
        head: { x: 0, y: 0 },
        tail: { x: 100, y: 150 },
      });
    });

    it("covers a disjoint rect.", () => {
      expect(base.union(Rect.new([200, 200], [300, 300]))).toMatchObject({
        head: { x: 0, y: 0 },
        tail: { x: 300, y: 300 },
      });
    });

    it("returns the instance itself when it already contains another.", () => {
      expect(base.union(Rect.new([10, 10], [90, 90]))).toBe(base);
      expect(base.union(base)).toBe(base);
    });

    it("is commutative.", () => {
      const another = Rect.new([50, 50], [150, 150]);
      expect(base.union(another).size.tuple()).toStrictEqual(another.union(base).size.tuple());
      expect(base.union(another).head.tuple()).toStrictEqual(another.union(base).head.tuple());
    });
  });
});
