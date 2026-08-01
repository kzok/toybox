import { describe, expect, it } from "vitest";
import { canvasOffset } from "../selectors";
import type { PageState } from "../types";

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
