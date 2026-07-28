import { afterEach, describe, expect, it, vi } from "vitest";
import { pickImageFile } from "../pickImageFile";

const setUp = () => {
  vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
  const createElement = vi.spyOn(document, "createElement");
  const promise = pickImageFile();
  const input = createElement.mock.results[0]?.value as HTMLInputElement;
  return { promise, input };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(pickImageFile, () => {
  it("resolves with the selected file's blob and decoded image.", async () => {
    const image = {} as ImageBitmap;
    const createImageBitmap = vi.fn(async () => image);
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    const { promise, input } = setUp();
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change"));

    await expect(promise).resolves.toEqual({ blob: file, image });
    expect(createImageBitmap).toHaveBeenCalledWith(file);
  });

  it("resolves with null when no file is selected.", async () => {
    const { promise, input } = setUp();
    Object.defineProperty(input, "files", { value: [], configurable: true });
    input.dispatchEvent(new Event("change"));

    await expect(promise).resolves.toBeNull();
  });

  it("resolves with null when the picker is cancelled.", async () => {
    const { promise, input } = setUp();
    input.dispatchEvent(new Event("cancel"));

    await expect(promise).resolves.toBeNull();
  });

  it("rejects when the selected image fails to decode.", async () => {
    const createImageBitmap = vi.fn(async () => {
      throw new Error("decode error");
    });
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    const { promise, input } = setUp();
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change"));

    await expect(promise).rejects.toThrow("decode error");
  });
});
