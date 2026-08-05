import { afterEach, describe, expect, it, vi } from "vitest";
import { readImageFromDataTransfer } from "../readImageFromDataTransfer";

/** jsdom has no `DataTransfer` constructor, and the helper only reads `files`. */
const dataTransferOf = (...files: readonly File[]): DataTransfer =>
  ({ files }) as unknown as DataTransfer;

const fileOf = (name: string, type: string): File => new File(["dummy"], name, { type });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(readImageFromDataTransfer, () => {
  it("resolves with the dropped file's blob and decoded image.", async () => {
    const image = {} as ImageBitmap;
    const createImageBitmap = vi.fn(async () => image);
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    const file = fileOf("test.png", "image/png");
    await expect(readImageFromDataTransfer(dataTransferOf(file))).resolves.toEqual({
      blob: file,
      image,
    });
    expect(createImageBitmap).toHaveBeenCalledWith(file);
  });

  it("picks the first image file, skipping the files that are not images.", async () => {
    const image = {} as ImageBitmap;
    const createImageBitmap = vi.fn(async () => image);
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    const text = fileOf("note.txt", "text/plain");
    const first = fileOf("first.png", "image/png");
    const second = fileOf("second.png", "image/png");
    await expect(readImageFromDataTransfer(dataTransferOf(text, first, second))).resolves.toEqual({
      blob: first,
      image,
    });
    expect(createImageBitmap).toHaveBeenCalledExactlyOnceWith(first);
  });

  it("resolves with null when the payload carries no image file.", async () => {
    const createImageBitmap = vi.fn();
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    await expect(
      readImageFromDataTransfer(dataTransferOf(fileOf("note.txt", "text/plain"))),
    ).resolves.toBeNull();
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it("resolves with null when the payload is empty.", async () => {
    await expect(readImageFromDataTransfer(dataTransferOf())).resolves.toBeNull();
  });

  it("rejects when the dropped image fails to decode.", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("decode error");
      }),
    );

    await expect(
      readImageFromDataTransfer(dataTransferOf(fileOf("broken.png", "image/png"))),
    ).rejects.toThrow("decode error");
  });
});
