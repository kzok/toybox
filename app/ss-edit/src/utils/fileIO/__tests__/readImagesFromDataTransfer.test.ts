import { afterEach, describe, expect, it, vi } from "vitest";
import { readImagesFromDataTransfer } from "../readImagesFromDataTransfer";

/** jsdom has no `DataTransfer` constructor, and the helper only reads `files`. */
const dataTransferOf = (...files: readonly File[]): DataTransfer =>
  ({ files }) as unknown as DataTransfer;

const fileOf = (name: string, type: string): File => new File(["dummy"], name, { type });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(readImagesFromDataTransfer, () => {
  it("resolves with the dropped file's blob and decoded image.", async () => {
    const image = {} as ImageBitmap;
    const createImageBitmap = vi.fn(async () => image);
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    const file = fileOf("test.png", "image/png");
    await expect(readImagesFromDataTransfer(dataTransferOf(file))).resolves.toEqual([
      { blob: file, image },
    ]);
    expect(createImageBitmap).toHaveBeenCalledWith(file);
  });

  it("picks every image file in the payload's order, skipping the files that are not images.", async () => {
    const images = new Map<Blob, ImageBitmap>();
    const createImageBitmap = vi.fn(async (blob: Blob) => {
      const image = {} as ImageBitmap;
      images.set(blob, image);
      return image;
    });
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    const text = fileOf("note.txt", "text/plain");
    const first = fileOf("first.png", "image/png");
    const second = fileOf("second.png", "image/png");
    const picked = await readImagesFromDataTransfer(dataTransferOf(first, text, second));

    expect(picked.map(({ blob }) => blob)).toStrictEqual([first, second]);
    expect(picked.map(({ image }) => image)).toStrictEqual([images.get(first), images.get(second)]);
    expect(createImageBitmap).toHaveBeenCalledTimes(2);
  });

  it("resolves with an empty array when the payload carries no image file.", async () => {
    const createImageBitmap = vi.fn();
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    await expect(
      readImagesFromDataTransfer(dataTransferOf(fileOf("note.txt", "text/plain"))),
    ).resolves.toStrictEqual([]);
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it("resolves with an empty array when the payload is empty.", async () => {
    await expect(readImagesFromDataTransfer(dataTransferOf())).resolves.toStrictEqual([]);
  });

  it("rejects when any of the dropped images fails to decode.", async () => {
    const broken = fileOf("broken.png", "image/png");
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async (blob: Blob) => {
        if (blob === broken) throw new Error("decode error");
        return {} as ImageBitmap;
      }),
    );

    await expect(
      readImagesFromDataTransfer(dataTransferOf(fileOf("ok.png", "image/png"), broken)),
    ).rejects.toThrow("decode error");
  });
});
