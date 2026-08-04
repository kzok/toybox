import type { ImageFile } from "./types";

/**
 * opens a native file picker restricted to images, then decodes the selected file.
 * @returns the selected file and its decoded image, or `null` if the user cancels.
 */
export const pickImageFile = (accept = "image/*"): Promise<ImageFile | null> =>
  new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("cancel", () => {
      resolve(null);
    });
    input.addEventListener("change", () => {
      const blob = input.files?.[0];
      if (blob == null) {
        resolve(null);
        return;
      }
      createImageBitmap(blob)
        .then((image) => {
          resolve({ blob, image });
        })
        .catch(reject);
    });
    input.click();
  });
