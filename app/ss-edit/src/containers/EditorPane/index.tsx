import clsx from "clsx";
import React from "react";
import { createRenderer } from "../../features/renderer";
import { pageCtx } from "../../store";
import { usePointerActions } from "./hooks/usePointerActions";
import { useResizeObserver } from "./hooks/useResizeObserver";
import { useWheelEvent } from "./hooks/useWheelEvent";
import styles from "./index.module.css";

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
    </div>
  );
});

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
