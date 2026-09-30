import type { ImageFile } from "./types";

/**
 * picks every image file out of a drop payload, then decodes them.
 * @param dataTransfer payload of a `drop` event.
 * @returns the picked files and their decoded images in the payload's order, or an empty array
 *   if the payload carries no image file.
 * @throws the decoding error if any picked file turns out not to be a decodable image.
 */
export const readImagesFromDataTransfer = async (
  dataTransfer: DataTransfer,
): Promise<ImageFile[]> => {
  const blobs = Array.from(dataTransfer.files).filter((file) => file.type.startsWith("image/"));
  return Promise.all(blobs.map(async (blob) => ({ blob, image: await createImageBitmap(blob) })));
};
