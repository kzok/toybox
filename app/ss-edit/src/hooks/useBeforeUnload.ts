import React from "react";

/**
 * show the browser's leave-confirmation dialog.
 */
export const useBeforeUnload = (enabled: boolean): void => {
  const enabledRef = React.useRef(enabled);
  enabledRef.current = enabled;
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent): void => {
      if (!enabledRef.current) {
        return;
      }
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, []);
};
