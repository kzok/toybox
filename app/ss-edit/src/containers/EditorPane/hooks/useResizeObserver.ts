import React from "react";
import { useEditorActions } from "../../../store";

/**
 * call specified action when resized.
 * @param elementRef ref object for an element
 */
export const useResizeObserver = <T extends Element>(
  elementRef: React.RefObject<T | null>,
): void => {
  const actions = useEditorActions();
  React.useLayoutEffect(() => {
    const element = elementRef.current;
    if (element == null) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== element) {
          continue;
        }
        actions.updateCanvasSize(entry.contentRect.width, entry.contentRect.height);
      }
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
};
