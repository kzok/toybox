import clsx from "clsx";
import React from "react";
import { usePointerEvents } from "../../hooks";
import { pageCtx } from "../../store";
import { useResizeObserver } from "./hooks/useResizeObserver";
import { useWheelEvent } from "./hooks/useWheelEvent";
import styles from "./index.module.css";
import { Painter } from "./Painter";
import { SelectMode } from "./SelectMode";

/** an editor canvas pane of the application. */
export const EditorPane = React.memo((props: { className?: string | undefined }) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  useResizeObserver(elementRef);
  useWheelEvent(elementRef);

  return (
    <div
      ref={elementRef}
      className={clsx(styles.container, props.className)}
      draggable={false}
      {...usePointerActions()}
    >
      <Painter />
      <div className={styles.overlay}>
        <EditorOverlayContent />
      </div>
    </div>
  );
});

const usePointerActions = () => {
  const actions = pageCtx.useActions();

  return usePointerEvents({
    onPointerMove: (e) => {
      if (e.buttons === 1) {
        // main (left) button
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.setAttribute("data-scrolling", "");
        actions.editorView.scroll(e.movementX, e.movementY);
        return;
      }
    },
    onPointerUp: (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.removeAttribute("data-scrolling");
    },
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      actions.editorMode.clear();
    },
  });
};

const EditorOverlayContent = React.memo(() => {
  const editorMode = pageCtx.useEditorMode();

  switch (editorMode.kind) {
    case "select":
      return <SelectMode />;
    case "edit":
      return null; // TODO: implement
    default:
      editorMode satisfies never;
      return null;
  }
});
