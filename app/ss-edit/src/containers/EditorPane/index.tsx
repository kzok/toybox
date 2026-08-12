import clsx from "clsx";
import React from "react";
import { usePointerEvents } from "../../hooks";
import { type PageState, pageCtx } from "../../store";
import { AddItemMode } from "./AddItemMode";
import { EditMode } from "./EditMode";
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
      <EditorOverlay />
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
      // `user-select: none` on this pane (see index.module.css) keeps the browser from
      // clearing an outside selection on its own, so do it explicitly.
      window.getSelection()?.removeAllRanges();
      actions.editorMode.clear();
    },
  });
};

/**
 * @note the current mode is exposed as `data-editor-mode` because each mode swaps the whole
 *   overlay content: it is the only stable handle on the mode from outside (e.g. e2e tests).
 */
const EditorOverlay = React.memo(() => {
  const editorMode = pageCtx.useEditorMode();

  return (
    <div className={styles.overlay} data-editor-mode={editorMode.kind}>
      {renderOverlayContent(editorMode)}
    </div>
  );
});

const renderOverlayContent = (editorMode: PageState.Mode): React.ReactNode => {
  switch (editorMode.kind) {
    case "select":
      return <SelectMode />;
    case "edit":
      return <EditMode />;
    case "add-item":
      return <AddItemMode editorMode={editorMode} />;
    default:
      editorMode satisfies never;
      throw new Error(`unknown editorMode: ${JSON.stringify(editorMode)}`);
  }
};
