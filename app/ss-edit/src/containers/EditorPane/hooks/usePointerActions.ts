import React from "react";
import { usePointerEvents } from "../../../hooks/usePointerEvents";
import { useEditorActions } from "../../../store";

/**
 * @returns React event handlers
 */
export const usePointerActions = () => {
  const actions = useEditorActions();

  return {
    ...usePointerEvents({
      onPointerMove: (e) => {
        if (e.buttons === 1) {
          // main (left) button
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.setAttribute("data-scrolling", "");
          actions.scroll(e.movementX, e.movementY);
          return;
        }
      },
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        actions.clearMode();
      },
    }),
    onPointerUp: React.useCallback<React.PointerEventHandler>(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.removeAttribute("data-scrolling");
      },
      [actions],
    ),
  };
};
