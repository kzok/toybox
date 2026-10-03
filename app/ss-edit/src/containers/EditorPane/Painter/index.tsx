import React from "react";
import { renderEditorItem } from "../../../features/renderer";
import { pageCtx } from "../../../store";
import styles from "./index.module.css";

/** editor canvas painter that renders items onto a `<canvas/>`. */
export const Painter = React.memo(() => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const view = pageCtx.useEditorView();
  const items = pageCtx.useEditorItems();
  const preview = pageCtx.useAddItemPreview();
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
    // keep in sync with CSS transform of the overlays.
    ctx.translate(...canvasOffset.tuple());
    ctx.scale(view.scale, view.scale);
    for (const item of items) {
      renderEditorItem(ctx, item);
    }
    // preview added item on top of the other items.
    if (preview != null) {
      renderEditorItem(ctx, preview);
    }
  }, [view, items, preview, canvasOffset]);

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
 * @note the paint is deferred to the next frame, the conventional way to drive a canvas rather
 *   than a fix for a measured problem.
 */
const useRequestAnimationFrame = (
  callback: FrameRequestCallback,
  deps: readonly unknown[],
): void => {
  React.useLayoutEffect(
    () => {
      const handle = requestAnimationFrame(callback);
      return () => cancelAnimationFrame(handle);
    },
    // biome-ignore lint/correctness/useExhaustiveDependencies: the caller passes `deps`.
    deps,
  );
};
