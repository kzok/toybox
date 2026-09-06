import React from "react";
import { pageCtx } from "../../../store";

/**
 * call specified action when resized.
 */
export const useResizeObserver = <T extends Element>(
  elementRef: React.RefObject<T | null>,
): void => {
  const actions = pageCtx.useActions();
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
        actions.view.syncCanvasSize([entry.contentRect.width, entry.contentRect.height]);
      }
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [elementRef, actions]);
};
