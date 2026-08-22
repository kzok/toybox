import React from "react";
import { renderEditorItems } from "../../../features/renderer";
import { pageCtx } from "../../../store";
import styles from "./index.module.css";

/**
 * editor canvas painter that renders items onto a `<canvas/>`.
 * @note the transform applied to the 2D context below has to stay equivalent to the CSS transform
 *   of `CanvasLayer` — see the note there. the two only agree because both read `canvasOffset`
 *   and the same view scale.
 */
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
 * @note the paint is deferred to the next frame, the conventional way to drive a canvas rather
 *   than a fix for a measured problem. it does buy coalescing though: the request/cancel pair
 *   leaves only the last of a burst of updates to paint, and a drag emits one per `pointermove`.
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
