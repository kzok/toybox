import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";
import { editorAtoms } from "../../store/editor";
import { usePointerEvents } from "./hooks/usePointerEvents";
import { useResizeObserver } from "./hooks/useResizeObserver";
import styles from "./index.module.css";
import { Painter } from "./Painter";

const ConnectedPainter = React.memo(() => {
  const state = useAtomValue(editorAtoms.state);
  return <Painter state={state} />;
});

/**
 * a canvas pane of the application.
 */
export const CanvasPane = React.memo((props: { className?: string | undefined }) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  useResizeObserver(elementRef);
  usePointerEvents(elementRef);

  return (
    <div ref={elementRef} className={clsx(styles.container, props.className)}>
      <ConnectedPainter />
    </div>
  );
});
