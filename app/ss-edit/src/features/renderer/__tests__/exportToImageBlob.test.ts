import { afterEach, describe, expect, it, vi } from "vitest";
import type { EditorItem } from "../../editorItem";
import { exportToImageBlob } from "../exportToImageBlob";

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
    const getContext = vi.fn(() => ({ drawImage, translate, fillRect: vi.fn() }));
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
    expect(drawImage).toHaveBeenCalledWith(item.data, 10, 20, 100, 50);
    expect(convertToBlob).toHaveBeenCalledWith({ type: "image/png" });
    expect(result).toBe(blob);
  });

  it("rounds up a fractional bounding box to integer canvas dimensions.", async () => {
    const item = createImageItem([0, 0], [10.2, 10.6]);
    const constructorArgs: Array<readonly [number, number]> = [];
    class FakeOffscreenCanvas {
      getContext = () => ({ drawImage: vi.fn(), translate: vi.fn(), fillRect: vi.fn() });
      convertToBlob = async () => new Blob();
      constructor(width: number, height: number) {
        constructorArgs.push([width, height]);
      }
    }
    vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);

    await exportToImageBlob([item]);

    expect(constructorArgs).toStrictEqual([[11, 11]]);
  });

  describe("option", () => {
    /**
     * @returns the 2d context and `convertToBlob` of a stubbed canvas, which records the fill
     *   style each `fillRect()` call is made with.
     */
    const stubCanvas = () => {
      const fills: Array<{ style: unknown; rect: readonly number[] }> = [];
      const context = {
        fillStyle: "" as unknown,
        drawImage: vi.fn(),
        translate: vi.fn(),
        fillRect: vi.fn((...rect: number[]) => fills.push({ style: context.fillStyle, rect })),
      };
      const convertToBlob = vi.fn(async () => new Blob());
      vi.stubGlobal(
        "OffscreenCanvas",
        class {
          getContext = () => context;
          convertToBlob = convertToBlob;
          constructor(
            public width: number,
            public height: number,
          ) {}
        },
      );
      return { context, convertToBlob, fills } as const;
    };

    it("fills the whole canvas white before drawing the items on a white background.", async () => {
      const { context, fills } = stubCanvas();

      await exportToImageBlob([createImageItem([10, 20], [100, 50])], { background: "white" });

      expect(fills).toStrictEqual([{ style: "#fff", rect: [0, 0, 100, 50] }]);
      expect(context.fillRect.mock.invocationCallOrder[0]!).toBeLessThan(
        context.drawImage.mock.invocationCallOrder[0]!,
      );
    });

    it("fills nothing on a transparent background.", async () => {
      const { context } = stubCanvas();

      await exportToImageBlob([createImageItem([10, 20], [100, 50])], {
        background: "transparent",
      });

      expect(context.fillRect).not.toHaveBeenCalled();
    });

    it("encodes the canvas in the requested format.", async () => {
      const { convertToBlob } = stubCanvas();

      await exportToImageBlob([createImageItem([10, 20], [100, 50])], { format: "image/webp" });

      expect(convertToBlob).toHaveBeenCalledWith({ type: "image/webp" });
    });
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
