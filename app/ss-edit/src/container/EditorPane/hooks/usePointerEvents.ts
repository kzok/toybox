import React from "react";
import { useEditorActions } from "../../../store/editor";

type Result = {
  isDragging: boolean;
  onClick: React.MouseEventHandler<HTMLElement>;
  onPointerMove: React.PointerEventHandler<HTMLElement>;
  onPointerUp: React.PointerEventHandler<HTMLElement>;
};

/**
 * register pointer event handlers
 */
export const usePointerEvents = (): Result => {
  const actions = useEditorActions();
  const [isDragging, setIsDragging] = React.useState(false);

  return {
    isDragging,
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
          setIsDragging(true);
          actions.scroll(e.movementX, e.movementY);
          return;
        }
      },
      [actions, setIsDragging],
    ),
    onPointerUp: React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      },
      [actions, setIsDragging],
    ),
  };
};
