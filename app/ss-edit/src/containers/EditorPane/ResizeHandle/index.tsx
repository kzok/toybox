import clsx from "clsx";
import React from "react";
import type { Vec2 } from "../../../utils/geometry";
import { Provider, useContextValue } from "./context";
import styles from "./index.module.css";

/** the edge or corner of the item's box a resize handle sits on. */
export type ResizeHandleDirection = "bottom-right" | "right";

/**
 * the container element for `ResizeHandle` component.
 * @note every handle inside measures the pointer against this element's top-left corner, hence it
 *   has to be the one laid out at the item's offset. it is also the box they place themselves on
 *   (see `index.module.css`), so a caller styles it into the item's shape and nothing else.
 */
export const ResizeContainer: React.FC<React.ComponentPropsWithoutRef<"span">> = ({
  className,
  children,
  ...rest
}) => {
  /** the anchor the resize handle measures the new size against. */
  const anchorRef = React.useRef<HTMLElement>(null);
  return (
    <Provider value={anchorRef}>
      <span {...rest} ref={anchorRef} className={clsx(styles.container, className)}>
        {children}
      </span>
    </Provider>
  );
};

/**
 * the round grip on an edge or a corner of the item being edited.
 * @note laid out against `--scale`, which `CanvasLayer` exposes, so it belongs inside one.
 * @note the pointer is reported relative to the top-left corner of the `ResizeContainer` it sits
 *   in, which must therefore be the element laid out at the item's offset.
 * @note `direction` drives both the styling and `data-resize-handle`, the only stable handle on
 *   this element from outside (e.g. e2e tests), so that the two can never name different grips.
 */
export const ResizeHandle = React.memo<{
  direction: ResizeHandleDirection;
  onResize: (cursor: Vec2.Tuple) => void;
}>(({ direction, onResize }) => {
  const anchorRef = useContextValue();

  return (
    <span
      className={clsx(
        styles.resizeHandle,
        direction === "bottom-right" ? styles.isBottomRight : styles.isRight,
      )}
      data-resize-handle={direction}
      onPointerDown={(e) => {
        e.stopPropagation();
        // capture the pointer only when main (left) button.
        if (e.buttons === 1) {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (e.buttons === 1) {
          const anchor = anchorRef.current?.getBoundingClientRect();
          if (anchor == null) return;
          onResize([e.clientX - anchor.left, e.clientY - anchor.top]);
        }
      }}
      onPointerUp={stopPropagation}
      // NOTE: the "click" the drag ends with is a separate event from the pointer ones above.
      // letting it reach the pane would clear the selection and leave edit mode on every resize.
      onClick={stopPropagation}
    />
  );
});

/**
 * @param e event
 */
const stopPropagation = (e: React.SyntheticEvent): void => e.stopPropagation();
