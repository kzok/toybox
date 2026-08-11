import React from "react";
import { renderEditorItems } from "../../features/renderer";
import { pageCtx } from "../../store";
import styles from "./Painter.module.css";

/** editor canvas painter that renders items onto a `<canvas/>`. */
export const Painter = React.memo(() => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const view = pageCtx.useEditorView();
  const items = pageCtx.useEditorItems();
  const canvasOffset = pageCtx.useCanvasOffset();
  useRequestAnimationFrame(() => {
    const canvas = canvasRef.current;
    if (canvas == null) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      throw new Error("failed to get <canvas/> context 2d.");
    }
    ctx.reset();
    ctx.translate(...canvasOffset.tuple());
    ctx.scale(view.scale, view.scale);
    renderEditorItems(ctx, items);
  }, [view, items, canvasOffset]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={view.canvasSize.x}
      height={view.canvasSize.y}
    />
  );
});

/**
 * @param callback raf callback
 * @param deps useEffect dependencies
 */
const useRequestAnimationFrame = (
  callback: FrameRequestCallback,
  deps: readonly unknown[],
): void => {
  React.useLayoutEffect(() => {
    const handle = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(handle);
  }, deps);
};
