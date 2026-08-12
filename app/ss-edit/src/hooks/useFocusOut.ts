import React from "react";

/**
 * listen "focusout" for the element.
 * @param elementRef target element ref object
 * @param callback event listener
 */
export const useFocusOut = (
  elementRef: React.RefObject<HTMLElement | null>,
  callback: () => void,
): void => {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    const element = elementRef.current;
    if (element == null) return;
    const handler = (): void => callbackRef.current();
    element.addEventListener("focusout", handler);
    return () => element.removeEventListener("focusout", handler);
  }, [elementRef]);
};
