import clsx from "clsx";
import React from "react";
import type { Vec2 } from "../../../utils/geometry";
import { Provider, useContextValue } from "./context";
import styles from "./index.module.css";

/** the edge or corner of the item's box a resize handle sits on. */
type ResizeHandleDirection = "bottom-right" | "right";

/** the end of the item a point resize handle grips. */
type ResizeHandleEnd = "tail" | "tip";

/**
 * the container element for `ResizeHandle` component.
 * @note every handle inside measures the pointer against this element's top-left corner, hence it
 *   has to be the one laid out at the item's offset.
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
 * @note the pointer is measured against the `ResizeContainer` it sits in.
 */
export const ResizeHandle = React.memo<{
  direction: ResizeHandleDirection;
  onResize: (cursor: Vec2.Tuple) => void;
}>(({ direction, onResize }) => {
  const anchorRef = useContextValue();
  const handlers = useGripHandlers(
    onResize,
    // NOTE: the bottom right corner of the anchor whichever edge the handle names
    //   because a handle gripping a single edge leaves the other component meaningless.
    //   this is harmless since the action behind such a handle ignores that component anyway.
    React.useCallback(() => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      return anchor == null ? null : [anchor.right, anchor.bottom];
    }, [anchorRef]),
  );

  return <span className={styles.resizeHandle} data-resize-handle={direction} {...handlers} />;
});

/**
 * the grip on a point of the item being edited.
 * @note the pointer is measured against the `ResizeContainer` it sits in.
 * @note the handle centres itself on `position`.
 */
export const ResizePointHandle = React.memo<{
  /** which end of the item this handle grips */
  end: ResizeHandleEnd;
  /** where the handle sits, in the coordinates its `ResizeContainer` is laid out in */
  position: Vec2.Tuple;
  onResize: (cursor: Vec2.Tuple) => void;
}>(({ end, position, onResize }) => {
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const handlers = useGripHandlers(
    onResize,
    React.useCallback(() => {
      const self = elementRef.current?.getBoundingClientRect();
      return self == null ? null : [self.left + self.width / 2, self.top + self.height / 2];
    }, []),
  );
  const style = React.useMemo(
    (): React.CSSProperties => ({ left: `${position[0]}px`, top: `${position[1]}px` }),
    [position],
  );

  return (
    <span
      ref={elementRef}
      className={styles.resizeHandle}
      data-resize-handle={end}
      style={style}
      {...handlers}
    />
  );
});

/**
 * @param onResize called with where the gripped point should go, relative to the anchor's top-left
 * @param gripOf where the point this handle grips currently is, in client coordinates
 * @returns the pointer handlers the two handles above share
 * @note what is reported is where the gripped point should go, not where the pointer is.
 */
const useGripHandlers = (
  onResize: (cursor: Vec2.Tuple) => void,
  gripOf: () => Vec2.Tuple | null,
) => {
  const anchorRef = useContextValue();
  /** where the drag went down, relative to the point being gripped */
  const grabOffsetRef = React.useRef<Vec2.Tuple | null>(null);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      // capture the pointer only when main (left) button.
      if (e.buttons === 1) {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const grip = gripOf();
        if (grip == null) return;
        grabOffsetRef.current = [e.clientX - grip[0], e.clientY - grip[1]];
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      e.stopPropagation();
      if (e.buttons === 1) {
        const anchor = anchorRef.current?.getBoundingClientRect();
        if (anchor == null || grabOffsetRef.current == null) return;
        const [grabX, grabY] = grabOffsetRef.current;
        onResize([e.clientX - grabX - anchor.left, e.clientY - grabY - anchor.top]);
      }
    },
    onPointerUp: stopPropagation,
    // NOTE: the "click" the drag ends with is a separate event from the pointer ones above.
    // letting it reach the pane would clear the selection and leave edit mode on every resize.
    onClick: stopPropagation,
  } as const;
};

const stopPropagation = (e: React.SyntheticEvent): void => e.stopPropagation();
