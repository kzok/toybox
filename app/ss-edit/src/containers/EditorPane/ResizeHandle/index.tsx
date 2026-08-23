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
 * the grip on an edge or a corner of the item being edited.
 * @note laid out against `--scale`, which `CanvasLayer` exposes, so it belongs inside one.
 * @note the pointer is reported relative to the top-left corner of the `ResizeContainer` it sits
 *   in, which must therefore be the element laid out at the item's offset.
 * @note what is reported is where the gripped edge should go, not where the pointer is: the
 *   distance between the two is taken at "pointerdown" and held for the drag. without it a handle
 *   that does not sit exactly on the edge it grips — every one of them, since `--outset` pushes
 *   them clear of the outline — would snap the item by that distance on the first move.
 * @note `direction` reaches the stylesheet through `data-resize-handle` rather than through a
 *   class of its own: the attribute is there regardless, being the only stable handle on this
 *   element from outside (e.g. e2e tests), and selecting on it leaves nothing to drift from it.
 */
export const ResizeHandle = React.memo<{
  direction: ResizeHandleDirection;
  onResize: (cursor: Vec2.Tuple) => void;
}>(({ direction, onResize }) => {
  const anchorRef = useContextValue();
  /**
   * where the drag went down, relative to the bottom right corner of the anchor.
   * @note a handle gripping a single edge leaves the other component meaningless, which is
   *   harmless: the action behind such a handle ignores that component anyway.
   */
  const grabOffsetRef = React.useRef<Vec2.Tuple | null>(null);

  return (
    <span
      className={styles.resizeHandle}
      data-resize-handle={direction}
      onPointerDown={(e) => {
        e.stopPropagation();
        // capture the pointer only when main (left) button.
        if (e.buttons === 1) {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          const anchor = anchorRef.current?.getBoundingClientRect();
          if (anchor == null) return;
          grabOffsetRef.current = [e.clientX - anchor.right, e.clientY - anchor.bottom];
        }
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (e.buttons === 1) {
          const anchor = anchorRef.current?.getBoundingClientRect();
          if (anchor == null || grabOffsetRef.current == null) return;
          const [grabX, grabY] = grabOffsetRef.current;
          onResize([e.clientX - grabX - anchor.left, e.clientY - grabY - anchor.top]);
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
