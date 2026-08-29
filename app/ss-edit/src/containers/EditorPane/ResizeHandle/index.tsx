import clsx from "clsx";
import React from "react";
import type { Vec2 } from "../../../utils/geometry";
import { Provider, useContextValue } from "./context";
import styles from "./index.module.css";

/** the edge or corner of the item's box a resize handle sits on. */
export type ResizeHandleDirection = "bottom-right" | "right";

/** the end of the item a point resize handle grips. */
export type ResizeHandleEnd = "tail" | "tip";

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
  const handlers = useGripHandlers(
    onResize,
    // NOTE: the bottom right corner of the anchor, whichever edge the handle names — a handle
    //   gripping a single edge leaves the other component meaningless, which is harmless: the
    //   action behind such a handle ignores that component anyway.
    React.useCallback(() => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      return anchor == null ? null : [anchor.right, anchor.bottom];
    }, [anchorRef]),
  );

  return <span className={styles.resizeHandle} data-resize-handle={direction} {...handlers} />;
});

/**
 * the grip on a point of the item being edited, rather than on an edge or a corner of its box.
 * @note for an item whose parts are not corners of a box — an arrow's tail and tip, which sit
 *   wherever its angle puts them. `ResizeHandle`'s placement cannot say where those are, and its
 *   grip point, the anchor's bottom right corner, is not one of them either.
 * @note the handle centres itself on `position`, hence the middle of its own box is the point it
 *   grips and no scale arithmetic is needed to find it. that is also why the anchor may be, and
 *   for an arrow is, a `ResizeContainer` of no size at all: only its top-left is read.
 * @note `end` reaches the stylesheet through `data-resize-handle`, as `direction` does for the
 *   handle above: the two ends are styled alike, and the name is there to tell them apart from
 *   outside (e.g. e2e tests), which `position` alone leaves impossible.
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
 * @note what is reported is where the gripped point should go, not where the pointer is: the
 *   distance between the two is taken at "pointerdown" and held for the drag. without it a handle
 *   that does not sit exactly on the point it grips — `--outset` pushes the edge ones clear of the
 *   item's outline — would snap the item by that distance on the first move.
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

/**
 * @param e event
 */
const stopPropagation = (e: React.SyntheticEvent): void => e.stopPropagation();
