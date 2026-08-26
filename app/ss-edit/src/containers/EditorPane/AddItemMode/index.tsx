import React from "react";
import { clampArrowLength } from "../../../features/editorItem";
import { type PageState, pageCtx } from "../../../store";
import { Rect, Vec2 } from "../../../utils/geometry";
import { CanvasLayer } from "../CanvasLayer";
import styles from "./index.module.css";

type Range = NonNullable<PageState.Mode.AddItem["range"]>;

/** editor overlay content for "add-item" mode */
export const AddItemMode = React.memo<{
  editorMode: PageState.Mode.AddItem;
}>(({ editorMode }) => {
  return (
    // NOTE: this element must stay free of any transform: `usePointerActions` reads pointer
    // positions relative to its bounding rect (see `updateRange`).
    <div className={styles.container} {...usePointerActions()}>
      {editorMode.range && (
        <CanvasLayer>
          <RangePreview itemKind={editorMode.itemKind} range={editorMode.range} />
        </CanvasLayer>
      )}
    </div>
  );
});

/**
 * the outline of the item about to be added.
 * @note a box for the kinds a drag gives a box to, and a line for an arrow, which a box says
 *   nothing about: the same box comes of dragging north east and south west, while which end the
 *   drag started from is the whole of what an arrow is.
 */
const RangePreview = React.memo<{
  itemKind: PageState.Mode.AddItem["itemKind"];
  range: Range;
}>(({ itemKind, range }) => {
  const isArrow = itemKind === "arrow";
  const style = React.useMemo((): React.CSSProperties => {
    // NOTE: an ancestor component applies the offset and the scale.
    if (isArrow) {
      const [tail, tip] = range;
      return {
        left: `${tail.x}px`,
        top: `${tail.y}px`,
        // NOTE: the length the item would actually be added at rather than the one dragged, so
        //   that a drag too short to be committed as it is shows where it will end up instead of
        //   jumping there on release.
        width: `${clampArrowLength(tip.distance(tail))}px`,
        // NOTE: laid out along +x from the tail and turned into place, the way `renderArrow`
        //   does it. `angle()` is exactly what CSS `rotate()` takes.
        transform: `rotate(${tip.sub(tail).angle()}rad)`,
      };
    }
    const { head, size } = new Rect(...range);
    return {
      left: `${head.x}px`,
      top: `${head.y}px`,
      width: `${size.x}px`,
      height: `${size.y}px`,
    };
  }, [isArrow, range]);

  // NOTE: `data-range-preview` is the only stable handle on this element from outside
  // (e.g. e2e tests), since the class name comes from a CSS module.
  return <div className={isArrow ? styles.line : styles.range} style={style} data-range-preview />;
});

const usePointerActions = () => {
  const actions = pageCtx.useActions();
  /**
   * pointerId of the drag that went down on this element, or null while there is none.
   * @note a pointer pressed elsewhere (e.g. on the header) and dragged in here must not
   *   add an item, hence only the drag that began here is followed.
   */
  const draggingIdRef = React.useRef<number | null>(null);

  return React.useMemo(() => {
    const updateRange = (e: React.PointerEvent): void => {
      const p = Vec2.new(e.clientX, e.clientY).sub(e.currentTarget.getBoundingClientRect());
      actions.addItem.updateRange(p);
    };
    const onPointerDown: React.PointerEventHandler = (e) => {
      if (e.button !== 0) return; // main (left) button only
      e.preventDefault();
      e.stopPropagation();
      draggingIdRef.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateRange(e);
    };
    const onPointerMove: React.PointerEventHandler = (e) => {
      e.stopPropagation();
      if (draggingIdRef.current !== e.pointerId || e.buttons !== 1) return;
      updateRange(e);
    };
    const onPointerUp: React.PointerEventHandler = (e) => {
      e.stopPropagation();
      if (draggingIdRef.current !== e.pointerId || e.button !== 0) return;
      draggingIdRef.current = null;
      actions.addItem.commit();
    };
    const onPointerCancel: React.PointerEventHandler = (e) => {
      e.stopPropagation();
      if (draggingIdRef.current !== e.pointerId) return;
      draggingIdRef.current = null;
      actions.addItem.cancel();
    };
    const onClick: React.MouseEventHandler = (e) => {
      e.stopPropagation();
    };

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onClick,
    } as const;
  }, [actions]);
};
