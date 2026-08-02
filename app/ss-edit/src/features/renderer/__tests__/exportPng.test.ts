import { afterEach, describe, expect, it, vi } from "vitest";
import type { PageState } from "../../../store";
import { exportToImageBlob } from "../exportToImageBlob";

const createImageItem = (
  offset: PageState.Item.Image["offset"],
  size: readonly [number, number],
): PageState.Item.Image => ({
  kind: "image",
  id: `item-${offset.join(",")}`,
  data: { width: size[0], height: size[1] } as ImageBitmap,
  offset,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(exportToImageBlob, () => {
  it("renders items onto an OffscreenCanvas sized to their bounding box and encodes it as PNG.", async () => {
    const item = createImageItem([10, 20], [100, 50]);
    const drawImage = vi.fn();
    const translate = vi.fn();
    const blob = new Blob(["dummy"], { type: "image/png" });
    const convertToBlob = vi.fn(async () => blob);
    const getContext = vi.fn(() => ({ drawImage, translate }));
    const constructorArgs: Array<readonly [number, number]> = [];
    class FakeOffscreenCanvas {
      getContext = getContext;
      convertToBlob = convertToBlob;
      constructor(width: number, height: number) {
        constructorArgs.push([width, height]);
      }
    }
    vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);

    const result = await exportToImageBlob([item]);

    expect(constructorArgs).toStrictEqual([[100, 50]]);
    expect(translate).toHaveBeenCalledWith(-10, -20);
    expect(drawImage).toHaveBeenCalledWith(item.data, 10, 20);
    expect(convertToBlob).toHaveBeenCalledWith({ type: "image/png" });
    expect(result).toBe(blob);
  });

  it("rounds up a fractional bounding box to integer canvas dimensions.", async () => {
    const item = createImageItem([0, 0], [10.2, 10.6]);
    const constructorArgs: Array<readonly [number, number]> = [];
    class FakeOffscreenCanvas {
      getContext = () => ({ drawImage: vi.fn(), translate: vi.fn() });
      convertToBlob = async () => new Blob();
      constructor(width: number, height: number) {
        constructorArgs.push([width, height]);
      }
    }
    vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);

    await exportToImageBlob([item]);

    expect(constructorArgs).toStrictEqual([[11, 11]]);
  });

  it("throws when the canvas fails to provide a 2d context.", async () => {
    class FakeOffscreenCanvas {
      getContext = () => null;
      constructor(
        public width: number,
        public height: number,
      ) {}
    }
    vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);

    await expect(exportToImageBlob([])).rejects.toThrow(
      "failed to get OffscreenCanvas context 2d.",
    );
  });
});
