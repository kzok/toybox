import React from "react";

/** whether the drag carries files. */
const carriesFiles = (e: DragEvent): boolean => e.dataTransfer?.types.includes("Files") === true;

/**
 * accept files dropped anywhere in the window.
 * @param onDrop called with the payload of the drop.
 * @returns whether files are being dragged over the window.
 */
export const useWindowFileDrop = (onDrop: (dataTransfer: DataTransfer) => void): boolean => {
  const onDropRef = React.useRef(onDrop);
  onDropRef.current = onDrop;
  const [dragging, setDragging] = React.useState(false);

  React.useEffect(() => {
    /**
     * `dragenter` / `dragleave` fire again on every element the cursor crosses, hence counting how
     * deep the drag went instead of toggling on each pair of them.
     */
    let depth = 0;

    const onDragEnter = (e: DragEvent): void => {
      if (!carriesFiles(e)) return;
      depth += 1;
      setDragging(true);
    };
    const onDragOver = (e: DragEvent): void => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer != null) {
        e.dataTransfer.dropEffect = "copy";
      }
    };
    const onDragLeave = (e: DragEvent): void => {
      if (!carriesFiles(e)) return;
      depth = Math.max(depth - 1, 0);
      if (depth === 0) {
        setDragging(false);
      }
    };
    const onWindowDrop = (e: DragEvent): void => {
      if (!carriesFiles(e) || e.dataTransfer == null) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      onDropRef.current(e.dataTransfer);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onWindowDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onWindowDrop);
    };
  }, []);

  return dragging;
};
