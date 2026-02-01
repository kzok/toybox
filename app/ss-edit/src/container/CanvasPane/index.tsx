import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";
import { editorAtoms, useEditorActions } from "../../store/editor";
import styles from "./index.module.css";
import { Painter } from "./Painter";

/**
 * a canvas pane of the application.
 */
export const CanvasPane = React.memo((props: { className?: string | undefined }) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const state = useAtomValue(editorAtoms.state);
  useResizeObserver(elementRef);

  return (
    <div ref={elementRef} className={clsx(styles.container, props.className)}>
      <Painter state={state} />
    </div>
  );
});

/**
 * call specified action when resized.
 * @param elementRef ref object for an element
 */
const useResizeObserver = <T extends Element>(elementRef: React.RefObject<T | null>): void => {
  const actions = useEditorActions();
  React.useLayoutEffect(() => {
    const element = elementRef.current;
    if (element == null) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== element) {
          continue;
        }
        actions.updateCanvasSize(entry.contentRect.width, entry.contentRect.height);
      }
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
};
