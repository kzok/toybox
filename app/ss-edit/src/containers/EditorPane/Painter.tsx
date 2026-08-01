import React from "react";
import { createItemRenderer } from "../../features/renderer";
import { pageCtx } from "../../store";
import styles from "./Painter.module.css";

/** editor canvas painter that renders items onto a `<canvas/>`. */
export const Painter = React.memo(() => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rendererRef = React.useRef<ReturnType<typeof createItemRenderer>>(null);
  const view = pageCtx.useEditorView();
  const items = pageCtx.useEditorItems();
  const canvasOffset = pageCtx.useCanvasOffset();
  React.useLayoutEffect(() => {
    const canvas = canvasRef.current!;
    if (!rendererRef.current) {
      rendererRef.current = createItemRenderer(canvas);
    }
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      throw new Error("failed to get <canvas/> context 2d.");
    }
    ctx.reset();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(...canvasOffset.tuple());
    ctx.scale(view.scale, view.scale);
    rendererRef.current(items);
  }, [view, items, canvasOffset]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={view.canvasSize[0]}
      height={view.canvasSize[1]}
    />
  );
});
