import clsx from "clsx";
import React from "react";
import { usePointerEvents } from "../../hooks";
import { type PageState, pageCtx } from "../../store";
import { AddItemMode } from "./AddItemMode";
import { useEditorContextMenu } from "./ContextMenu";
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
  const [onContextMenu, contextMenu] = useEditorContextMenu();

  return (
    <>
      <div
        ref={elementRef}
        className={clsx(styles.container, props.className)}
        draggable={false}
        onContextMenu={onContextMenu}
        {...usePointerActions()}
      >
        <Painter />
        <EditorOverlay />
      </div>
      {contextMenu}
    </>
  );
});

const usePointerActions = () => {
  const actions = pageCtx.useActions();

  return usePointerEvents({
    onPointerDown: (e) => {
      e.stopPropagation();
      // capture the pointer only when main (left) button.
      if (e.buttons === 1) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    onPointerMove: (e) => {
      e.stopPropagation();
      if (e.buttons === 1) {
        // main (left) button
        e.currentTarget.setAttribute("data-scrolling", "");
        actions.view.scroll(e.movementX, e.movementY);
        return;
      }
    },
    onPointerUp: (e) => {
      e.stopPropagation();
      e.currentTarget.removeAttribute("data-scrolling");
    },
    onClick: (e) => {
      e.stopPropagation();
      // `user-select: none` on this pane (see index.module.css) keeps the browser from
      // clearing an outside selection on its own, so do it explicitly.
      window.getSelection()?.removeAllRanges();
      actions.selectMode.clear();
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
