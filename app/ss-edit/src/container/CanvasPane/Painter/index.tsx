import React from "react";
import type { Editor } from "../../../store/editor";
import styles from "./index.module.css";
import { renderCanvas } from "./render-canvas";

/**
 * an actual <canvas/> elements to render the application state.
 */
export const Painter: React.FC<{
  state: Editor.State;
}> = (props) => {
  const elementRef = React.useRef<HTMLCanvasElement>(null);
  React.useLayoutEffect(() => {
    const canvas = elementRef.current;
    if (canvas == null) {
      return;
    }
    renderCanvas(canvas, props.state);
  }, [props.state]);

  return (
    <canvas
      className={styles.container}
      ref={elementRef}
      width={props.state.view.canvas.width}
      height={props.state.view.canvas.height}
    />
  );
};
