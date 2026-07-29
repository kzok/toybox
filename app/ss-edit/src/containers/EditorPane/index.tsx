import clsx from "clsx";
import React from "react";
import { selectors } from "../../store";
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
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const view = selectors.useEditorView();
  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={view.paneSize.width}
      height={view.paneSize.height}
    />
  );
});
