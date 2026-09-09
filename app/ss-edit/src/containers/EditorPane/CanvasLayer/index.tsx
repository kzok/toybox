import React from "react";
import { pageCtx } from "../../../store";
import { useCanvasScale } from "../hooks/useCanvasScale";
import styles from "./index.module.css";

/**
 * a transparent layer sharing the coordinate space of the `<canvas/>` painted by `Painter`.
 * the children are laid out in canvas coordinates and need no offset/scale math of their own.
 */
export const CanvasLayer = React.memo<{
  children?: React.ReactNode;
}>(({ children }) => {
  const canvasOffset = pageCtx.useCanvasOffset();
  const scale = useCanvasScale();

  return (
    <div
      className={styles.container}
      style={{
        // the transform here and the one `Painter` paints through must stay in sync.
        transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${scale})`,
        // exposed so that descendants can cancel out `scale()`.
        ...({ "--scale": scale } as React.CSSProperties),
      }}
    >
      {children}
    </div>
  );
});
