import React from "react";

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
    /** if pointermove fired between pointerdown and click. */
    let moved = false;

    return {
      onPointerDown: (e) => {
        if (paramsRef.current.preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        moved = false;
        paramsRef.current.onPointerDown?.(e);
      },
      onPointerMove: (e) => {
        if (paramsRef.current.preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        moved = true;
        paramsRef.current.onPointerMove?.(e);
      },
      onClick: (e) => {
        if (paramsRef.current.preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (moved) return; // dragged. ignore click.
        paramsRef.current.onClick?.(e);
      },
    };
  }, []);
};
