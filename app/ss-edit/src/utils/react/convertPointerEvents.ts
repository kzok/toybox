import type React from "react";
import { Point2D } from "../geometry";

type Params<E> = {
  preventDefaultAndStopPropagation?: boolean;
  /** pointerdown event. */
  onPointerDown?: React.PointerEventHandler<E> | undefined;
  /** pointermove event. */
  onPointerMove?: React.PointerEventHandler<E> | undefined;
  /** click event ignoring drag. */
  onClick?: React.MouseEventHandler<E> | undefined;
};

type Result<E> = {
  onPointerDown: React.PointerEventHandler<E>;
  onPointerMove: React.PointerEventHandler<E>;
  onClick: React.MouseEventHandler<E>;
};

/**
 * convert callbacks in order to distinguish drag (pointermove) and click.
 *
 * @note Callers must memoize the result with `React.useMemo` because this is a plain function, not a hook.
 * @param params callbacks and options
 * @returns component props
 */
export const convertPointerEvents = <E extends Element = HTMLElement>(
  params: Params<E>,
): Result<E> => {
  /** [x,y] position of last "pointerdown" */
  let downP: Point2D | null = null;
  /** [x,y] position of last "pointermove" */
  let moveP: Point2D | null = null;

  return {
    onPointerDown: (e) => {
      if (params.preventDefaultAndStopPropagation) {
        e.preventDefault();
        e.stopPropagation();
      }
      downP = Point2D.new(e.clientX, e.clientY);
      moveP = null;
      params.onPointerDown?.(e);
    },
    onPointerMove: (e) => {
      if (params.preventDefaultAndStopPropagation) {
        e.preventDefault();
        e.stopPropagation();
      }
      moveP = Point2D.new(e.clientX, e.clientY);
      params.onPointerMove?.(e);
    },
    onClick: (e) => {
      if (params.preventDefaultAndStopPropagation) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (downP && moveP && downP.distance(moveP) > 2) {
        return; // dragged. ignore click.
      }
      params.onClick?.(e);
    },
  };
};
