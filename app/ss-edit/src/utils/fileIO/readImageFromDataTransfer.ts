import type { ImageFile } from "./types";

/**
 * picks the first image file out of a drop payload, then decodes it.
 * @param dataTransfer payload of a `drop` event.
 * @returns the picked file and its decoded image, or `null` if the payload carries no image file.
 * @throws the decoding error if the picked file turns out not to be a decodable image.
 */
export const readImageFromDataTransfer = async (
  dataTransfer: DataTransfer,
): Promise<ImageFile | null> => {
  const blob = Array.from(dataTransfer.files).find((file) => file.type.startsWith("image/"));
  if (blob == null) {
    return null; // no image file in the payload.
  }
  return { blob, image: await createImageBitmap(blob) };
};
