import { describe, expect, it } from "vitest";
import { Point2D } from "../point2d";

describe("Point2D", () => {
  describe("new()", () => {
    it("creates new instance.", () => {
      expect(Point2D.new({ x: 0, y: 0 })).instanceOf(Point2D);
      expect(Point2D.new([10, 20])).toMatchObject({ x: 10, y: 20 });
      expect(Point2D.new(100, 200)).toMatchObject({ x: 100, y: 200 });
    });
  });

  describe("tuple()", () => {
    it("dump the point as a tuple.", () => {
      expect(Point2D.new(10, 0).tuple()).toStrictEqual([10, 0]);
      expect(Point2D.new(0, 20).tuple()).toStrictEqual([0, 20]);
    });
  });

  describe("add()", () => {
    it("adds the point.", () => {
      const p1 = Point2D.new(0, 0);
      const p2 = p1.add([100, 0]);
      const p3 = p2.add(Point2D.new([0, 200]));
      expect(p1.tuple()).toStrictEqual([0, 0]);
      expect(p2.tuple()).toStrictEqual([100, 0]);
      expect(p3.tuple()).toStrictEqual([100, 200]);
    });
  });

  describe("sub()", () => {
    it("subtracts the point.", () => {
      const p1 = Point2D.new(100, 200);
      const p2 = p1.sub([100, 0]);
      const p3 = p2.sub(Point2D.new([0, 200]));
      expect(p1.tuple()).toStrictEqual([100, 200]);
      expect(p2.tuple()).toStrictEqual([0, 200]);
      expect(p3.tuple()).toStrictEqual([0, 0]);
    });
  });

  describe("mul()", () => {
    it("multiplies the point.", () => {
      expect(Point2D.new(0, 0).mul(3.0).tuple()).toStrictEqual([0, 0]);
      expect(Point2D.new(10, 30).mul(3.0).tuple()).toStrictEqual([30, 90]);
      expect(Point2D.new(10, 30).mul(-1).tuple()).toStrictEqual([-10, -30]);
    });
  });

  describe("div()", () => {
    it("divides the point.", () => {
      expect(Point2D.new(0, 0).div(3.0).tuple()).toStrictEqual([0, 0]);
      expect(Point2D.new(30, 90).div(3.0).tuple()).toStrictEqual([10, 30]);
    });

    it("does not guard against zero division.", () => {
      expect(Point2D.new(10, 20).div(0).tuple()).toStrictEqual([
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
      ]);
    });
  });

  describe("scale()", () => {
    it("scales the point from the given origin.", () => {
      const p = Point2D.new(100, 100);
      expect(p.scale(3.0, [0, 0]).tuple()).toStrictEqual([300, 300]);
      expect(p.scale(3.0, Point2D.new(100, 100)).tuple()).toStrictEqual([100, 100]);
      expect(p.scale(3.0, Point2D.new(200, 200)).tuple()).toStrictEqual([-100, -100]);
    });
  });

  describe("distance()", () => {
    it("calculates the distance to the given point.", () => {
      expect(Point2D.new(10, 10).distance([40, 50])).toBe(50);
    });
  });
});
