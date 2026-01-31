import React from "react";

import styles from "./index.module.css";
import { renderCanvas } from "./render-canvas";
import type { EditorState } from "./types";

export const CanvasPane: React.FC<{
  /** canvas width px */
  width: number;
  /** canvas height px */
  height: number;
  editorState: EditorState;
}> = (props) => {
  const elementRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = elementRef.current;
    if (canvas == null) {
      return;
    }
    renderCanvas(canvas, props.editorState);
  }, [props.editorState]);

  return (
    <canvas
      className={styles.container}
      ref={elementRef}
      width={props.width}
      height={props.height}
    />
  );
};
