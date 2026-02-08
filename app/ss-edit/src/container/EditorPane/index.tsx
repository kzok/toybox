import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";
import { editorAtoms } from "../../store/editor";
import { usePointerEvents } from "./hooks/usePointerEvents";
import { useResizeObserver } from "./hooks/useResizeObserver";
import styles from "./index.module.css";
import { ModeContent } from "./ModeContent";
import { PainterContent } from "./PainterContent";

/** an editor canvas pane of the application. */
export const EditorPane = React.memo((props: { className?: string | undefined }) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  useResizeObserver(elementRef);
  usePointerEvents(elementRef);

  return (
    <div ref={elementRef} className={clsx(styles.container, props.className)}>
      <Painter />
      <ModeOverlay />
    </div>
  );
});

const Painter = React.memo(() => {
  const view = useAtomValue(editorAtoms.view);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={view.size.width} height={view.size.height}>
      <title>canvas view</title>
      <ViewBoxG>
        <PainterContent />
      </ViewBoxG>
    </svg>
  );
});

const ModeOverlay = React.memo(() => {
  const view = useAtomValue(editorAtoms.view);

  return (
    <svg
      className={styles.modeOverlay}
      xmlns="http://www.w3.org/2000/svg"
      width={view.size.width}
      height={view.size.height}
    >
      <title>mode view</title>
      <ViewBoxG>
        <ModeContent />
      </ViewBoxG>
    </svg>
  );
});

/** <g/> element to set view box */
const ViewBoxG = (props: React.PropsWithChildren) => {
  const { scale, offset } = useAtomValue(editorAtoms.view);
  const transform = React.useMemo(() => {
    return [
      `scale(${scale.toFixed(2)})`,
      `translate(${(-offset[0]).toFixed(2)} ${(-offset[1]).toFixed(2)})`,
    ].join(" ");
  }, [scale, offset]);
  return <g transform={transform}>{props.children}</g>;
};
