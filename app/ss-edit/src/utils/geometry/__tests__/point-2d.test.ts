import { describe, expect, it } from "vitest";
import { Point2D } from "../point-2d";

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

  describe("scale()", () => {
    it("scales the point.", () => {
      expect(Point2D.new(0, 0).scale(3.0).tuple()).toStrictEqual([0, 0]);
      expect(Point2D.new(10, 30).scale(3.0).tuple()).toStrictEqual([30, 90]);
    });

    it("can specify the origin of scaling.", () => {
      const p = Point2D.new(100, 100);
      expect(p.scale(3.0).tuple()).toStrictEqual([300, 300]);
      expect(p.scale(3.0, Point2D.new(100, 100)).tuple()).toStrictEqual([100, 100]);
      expect(p.scale(3.0, Point2D.new(200, 200)).tuple()).toStrictEqual([-100, -100]);
    });
  });

  describe("invert()", () => {
    it("inverts the point.", () => {
      expect(Point2D.new(10, 20).invert().tuple()).toStrictEqual([-10, -20]);
    });
  });
});
