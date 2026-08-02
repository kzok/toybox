/**
 * triggers a browser download for the given blob.
 * @param blob file content
 * @param fileName suggested file name
 */
export const saveBlobAsFile = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
};
