import { describe, expect, it, vi } from "vitest";
import { saveBlobAsFile } from "../saveBlobAsFile";

describe(saveBlobAsFile, () => {
  it("triggers a download via a temporary anchor and revokes the object URL.", () => {
    const blob = new Blob(["dummy"], { type: "image/png" });
    const url = "blob:dummy-url";
    vi.spyOn(URL, "createObjectURL").mockReturnValue(url);
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const createElement = vi.spyOn(document, "createElement");

    saveBlobAsFile(blob, "screenshot.png");

    const anchor = createElement.mock.results[0]?.value as HTMLAnchorElement;
    expect(anchor.href).toBe(url);
    expect(anchor.download).toBe("screenshot.png");
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(url);
  });
});
