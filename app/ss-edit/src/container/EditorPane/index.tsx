import clsx from "clsx";
import React from "react";
import { usePointerEvents } from "./hooks/usePointerEvents";
import { useResizeObserver } from "./hooks/useResizeObserver";
import styles from "./index.module.css";
import { Painter } from "./Painter";

/**
 * a canvas pane of the application.
 */
export const EditorPane = React.memo((props: { className?: string | undefined }) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  useResizeObserver(elementRef);
  usePointerEvents(elementRef);

  return (
    <div ref={elementRef} className={clsx(styles.container, props.className)}>
      <Painter />
    </div>
  );
});
