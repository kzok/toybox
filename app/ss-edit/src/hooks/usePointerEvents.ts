import React from "react";
import { Point2D } from "../utils/geometry";

type Params<E> = {
  preventDefault?: boolean;
  /** pointermove event. */
  onPointerDown?: React.DOMAttributes<E>["onPointerDown"];
  /** pointermove event. */
  onPointerMove?: React.DOMAttributes<E>["onPointerMove"];
  /** click event ignoring drag. */
  onClick?: React.DOMAttributes<E>["onClick"];
};

type Result<E> = {
  onPointerDown: NonNullable<React.DOMAttributes<E>["onPointerDown"]>;
  onPointerMove: NonNullable<React.DOMAttributes<E>["onPointerMove"]>;
  onClick: NonNullable<React.DOMAttributes<E>["onClick"]>;
};

/**
 * a hook to provide wrapped React pointer event handlers.
 * @description
 * - distinguish drag (pointermove) and click.
 *
 * @param params callbacks and options
 * @returns component props
 */
export const usePointerEvents = <E extends Element = HTMLElement>(params: Params<E>): Result<E> => {
  const paramsRef = React.useRef(params);
  paramsRef.current = params;

  return React.useMemo(() => {
    /** [x,y] position of last "pointerdown" */
    let downP: Point2D | null = null;
    /** [x,y] position of last "pointermove" */
    let moveP: Point2D | null = null;

    return {
      onPointerDown: (e) => {
        if (paramsRef.current.preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        downP = Point2D.new(e.clientX, e.clientY);
        moveP = null;
        paramsRef.current.onPointerDown?.(e);
      },
      onPointerMove: (e) => {
        if (paramsRef.current.preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        moveP = Point2D.new(e.clientX, e.clientY);
        paramsRef.current.onPointerMove?.(e);
      },
      onClick: (e) => {
        if (paramsRef.current.preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (downP && moveP) {
          if (downP.distance(moveP) > 2) {
            return; // dragged. ignore click.
          }
        }
        paramsRef.current.onClick?.(e);
      },
    };
  }, []);
};
