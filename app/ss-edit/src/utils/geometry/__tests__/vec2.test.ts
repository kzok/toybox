import { describe, expect, it } from "vitest";
import { Vec2 } from "../vec2";

describe("Vec2", () => {
  describe("new()", () => {
    it("creates new instance.", () => {
      expect(Vec2.new({ x: 0, y: 0 })).instanceOf(Vec2);
      expect(Vec2.new([10, 20])).toMatchObject({ x: 10, y: 20 });
      expect(Vec2.new(100, 200)).toMatchObject({ x: 100, y: 200 });
    });
  });

  describe("polar()", () => {
    it("creates the vector the length and the angle describe.", () => {
      expect(Vec2.polar(10, 0).tuple()).toStrictEqual([10, 0]);
      const quarterTurn = Vec2.polar(10, Math.PI / 2);
      expect(quarterTurn.x).toBeCloseTo(0);
      // positive angles turn towards +y, hence clockwise on a canvas.
      expect(quarterTurn.y).toBeCloseTo(10);
      const halfTurn = Vec2.polar(10, Math.PI);
      expect(halfTurn.x).toBeCloseTo(-10);
      expect(halfTurn.y).toBeCloseTo(0);
    });

    it("keeps the length it is given whichever way it points.", () => {
      for (const angle of [0, 1, 2, 3, -1, -2]) {
        expect(Vec2.polar(10, angle).distance([0, 0])).toBeCloseTo(10);
      }
    });

    it("collapses onto the origin at zero length.", () => {
      expect(Vec2.polar(0, 1.234).distance([0, 0])).toBeCloseTo(0);
    });
  });

  describe("tuple()", () => {
    it("dump the point as a tuple.", () => {
      expect(Vec2.new(10, 0).tuple()).toStrictEqual([10, 0]);
      expect(Vec2.new(0, 20).tuple()).toStrictEqual([0, 20]);
    });
  });

  describe("add()", () => {
    it("adds the point.", () => {
      const p1 = Vec2.new(0, 0);
      const p2 = p1.add([100, 0]);
      const p3 = p2.add(Vec2.new([0, 200]));
      expect(p1.tuple()).toStrictEqual([0, 0]);
      expect(p2.tuple()).toStrictEqual([100, 0]);
      expect(p3.tuple()).toStrictEqual([100, 200]);
    });
  });

  describe("sub()", () => {
    it("subtracts the point.", () => {
      const p1 = Vec2.new(100, 200);
      const p2 = p1.sub([100, 0]);
      const p3 = p2.sub(Vec2.new([0, 200]));
      expect(p1.tuple()).toStrictEqual([100, 200]);
      expect(p2.tuple()).toStrictEqual([0, 200]);
      expect(p3.tuple()).toStrictEqual([0, 0]);
    });
  });

  describe("mul()", () => {
    it("multiplies the point.", () => {
      expect(Vec2.new(0, 0).mul(3.0).tuple()).toStrictEqual([0, 0]);
      expect(Vec2.new(10, 30).mul(3.0).tuple()).toStrictEqual([30, 90]);
      expect(Vec2.new(10, 30).mul(-1).tuple()).toStrictEqual([-10, -30]);
    });
  });

  describe("div()", () => {
    it("divides the point.", () => {
      expect(Vec2.new(0, 0).div(3.0).tuple()).toStrictEqual([0, 0]);
      expect(Vec2.new(30, 90).div(3.0).tuple()).toStrictEqual([10, 30]);
    });

    it("does not guard against zero division.", () => {
      expect(Vec2.new(10, 20).div(0).tuple()).toStrictEqual([
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
      ]);
    });
  });

  describe("scale()", () => {
    it("scales the point from the given origin.", () => {
      const p = Vec2.new(100, 100);
      expect(p.scale(3.0, [0, 0]).tuple()).toStrictEqual([300, 300]);
      expect(p.scale(3.0, Vec2.new(100, 100)).tuple()).toStrictEqual([100, 100]);
      expect(p.scale(3.0, Vec2.new(200, 200)).tuple()).toStrictEqual([-100, -100]);
    });
  });

  describe("distance()", () => {
    it("calculates the distance to the given point.", () => {
      expect(Vec2.new(10, 10).distance([40, 50])).toBe(50);
    });
  });

  describe("dot()", () => {
    it("calculates the dot product with the given vector.", () => {
      expect(Vec2.new(2, 3).dot([4, 5])).toBe(23);
      expect(Vec2.new(1, 0).dot(Vec2.new(0, 1))).toBe(0);
    });
  });
});
