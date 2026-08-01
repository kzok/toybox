import clsx from "clsx";
import React from "react";
import { createRenderer } from "../../features/renderer";
import { pageCtx } from "../../store";
import { convertPointerEvents } from "../../utils/react";
import { useResizeObserver } from "./hooks/useResizeObserver";
import { useWheelEvent } from "./hooks/useWheelEvent";
import styles from "./index.module.css";
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
  const actions = pageCtx.usePageActions();

  return React.useMemo(() => {
    const pointerEventHandlers = convertPointerEvents({
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
    });

    return {
      ...pointerEventHandlers,
      onPointerUp: (e: React.PointerEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.removeAttribute("data-scrolling");
      },
    };
  }, [actions]);
};

const Painter = React.memo(() => {
  const rendererRef = React.useRef<ReturnType<typeof createRenderer>>(null);
  const canvasRef = React.useCallback<React.RefCallback<HTMLCanvasElement>>((element) => {
    if (element == null) {
      rendererRef.current = null;
      return;
    }
    rendererRef.current = createRenderer(element);
  }, []);
  const view = pageCtx.useEditorView();
  const items = pageCtx.useEditorItems();
  React.useLayoutEffect(() => {
    rendererRef.current?.(items, view);
  }, [view, items]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={view.canvasSize[0]}
      height={view.canvasSize[1]}
    />
  );
});

const EditorOverlayContent = React.memo(() => {
  const editorMode = pageCtx.useEditorMode();

  switch (editorMode.kind) {
    case "select":
      return <SelectMode editorMode={editorMode} />;
    default:
      editorMode.kind satisfies never;
      return null;
  }
});
