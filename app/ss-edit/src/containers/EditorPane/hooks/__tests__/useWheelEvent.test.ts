import { describe, expect, it } from "vitest";
import { nextWheelZoomScale } from "../useWheelEvent";

describe(nextWheelZoomScale, () => {
  describe("a mouse wheel notch", () => {
    it("zooms by 30% per notch.", () => {
      expect(nextWheelZoomScale(1, -100)).toBeCloseTo(1.3, 10);
      expect(nextWheelZoomScale(2, 100)).toBeCloseTo(2 / 1.3, 10);
    });

    it("reads a `deltaY` on the threshold as a notch and one below it as a pinch.", () => {
      expect(nextWheelZoomScale(1, -20)).toBeCloseTo(1.3 ** 0.2, 10);
      expect(nextWheelZoomScale(1, -19)).toBeCloseTo(1.02 ** 19, 10);
    });
  });

  describe("a trackpad pinch", () => {
    it("zooms by a small ratio per step.", () => {
      expect(nextWheelZoomScale(1, -1)).toBeCloseTo(1.02, 10);
      expect(nextWheelZoomScale(2, 1)).toBeCloseTo(2 / 1.02, 10);
    });

    it("leaves 100% on a single step, in either direction.", () => {
      // a snap window around 100% used to swallow a step this small, in both directions, which
      // left the trackpad unable to zoom at all once it had landed on 100%.
      expect(nextWheelZoomScale(1, -1)).toBeGreaterThan(1);
      expect(nextWheelZoomScale(1, 1)).toBeLessThan(1);
    });

    it("keeps zooming away from 100% as the pinch goes on.", () => {
      let scale = 1;
      for (let i = 0; i < 10; i++) {
        scale = nextWheelZoomScale(scale, -1);
      }
      expect(scale).toBeGreaterThan(1.2);
    });
  });

  describe("the 100% snap", () => {
    it("snaps to 100% on a step that crosses it.", () => {
      expect(nextWheelZoomScale(0.95, -100)).toBe(1);
      expect(nextWheelZoomScale(1.1, 100)).toBe(1);
    });

    it("leaves a step that does not cross 100% alone.", () => {
      expect(nextWheelZoomScale(1.05, -1)).toBeCloseTo(1.05 * 1.02, 10);
      expect(nextWheelZoomScale(0.95, -1)).toBeCloseTo(0.95 * 1.02, 10);
    });

    it("lands on 100% when wheeling back in from the minimum zoom.", () => {
      let scale = 0.27;
      for (let i = 0; i < 5; i++) {
        scale = nextWheelZoomScale(scale, -100);
      }
      expect(scale).toBe(1);
    });
  });
});
