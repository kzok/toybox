import React from "react";
import { Vec2 } from "../utils/geometry";

type Params<E> = {
  /** pointerdown event. */
  onPointerDown?: React.PointerEventHandler<E> | undefined;
  /** pointermove event. */
  onPointerMove?: React.PointerEventHandler<E> | undefined;
  /** pointerup event. */
  onPointerUp?: React.PointerEventHandler<E> | undefined;
  /** click event ignoring drag. */
  onClick?: React.MouseEventHandler<E> | undefined;
};

type Result<E> = {
  onPointerDown: React.PointerEventHandler<E>;
  onPointerMove: React.PointerEventHandler<E>;
  onPointerUp: React.PointerEventHandler<E>;
  onClick: React.MouseEventHandler<E>;
};

/**
 * convert callbacks in order to distinguish drag (pointermove) and click.
 *
 * @param params callbacks
 * @returns component props
 */
export const usePointerEvents = <E extends Element = HTMLElement>(params: Params<E>): Result<E> => {
  const paramsRef = React.useRef(params);
  paramsRef.current = params;

  return React.useMemo(() => {
    /** [x,y] position of last "pointerdown" */
    let downP: Vec2 | null = null;
    /** [x,y] position of last "pointermove" */
    let moveP: Vec2 | null = null;

    return {
      onPointerDown: (e) => {
        downP = Vec2.new(e.clientX, e.clientY);
        moveP = null;
        paramsRef.current.onPointerDown?.(e);
      },
      onPointerMove: (e) => {
        moveP = Vec2.new(e.clientX, e.clientY);
        paramsRef.current.onPointerMove?.(e);
      },
      onPointerUp: (e) => {
        paramsRef.current.onPointerUp?.(e);
      },
      onClick: (e) => {
        if (downP && moveP && downP.distance(moveP) > 2) {
          // dragged. swallow the click so that ancestors don't handle it.
          e.stopPropagation();
          return;
        }
        paramsRef.current.onClick?.(e);
      },
    };
  }, []);
};
