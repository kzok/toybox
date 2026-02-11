import React from "react";
import { useEditorActions } from "../../../store/editor";

type Result = {
  onClick: React.MouseEventHandler<HTMLElement>;
  onPointerMove: React.PointerEventHandler<HTMLElement>;
  onPointerUp: React.PointerEventHandler<HTMLElement>;
};

/**
 * register pointer event handlers
 */
export const usePointerEvents = (): Result => {
  const actions = useEditorActions();

  return {
    onClick: React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        actions.clearMode();
      },
      [actions],
    ),
    onPointerMove: React.useCallback(
      (e) => {
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
      [actions],
    ),
    onPointerUp: React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.removeAttribute("data-scrolling");
      },
      [actions],
    ),
  };
};
