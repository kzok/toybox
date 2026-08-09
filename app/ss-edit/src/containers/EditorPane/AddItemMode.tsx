import React from "react";
import { type PageState, pageCtx } from "../../store";
import { Rect, Vec2 } from "../../utils/geometry";
import styles from "./AddItemMode.module.css";
import { useCanvasScale } from "./hooks/useCanvasScale";

type Range = NonNullable<PageState.Mode.AddItem["range"]>;

/** editor overlay content for "add-item" mode */
export const AddItemMode = React.memo<{
  editorMode: PageState.Mode.AddItem;
}>(({ editorMode }) => {
  return (
    <div className={styles.container} {...usePointerActions()}>
      {editorMode.range && <RangePreview range={editorMode.range} />}
    </div>
  );
});

/** the outline of the item about to be added. */
const RangePreview = React.memo<{
  range: Range;
}>(({ range }) => {
  const canvasOffset = pageCtx.useCanvasOffset();
  const scale = useCanvasScale();
  const style = React.useMemo((): React.CSSProperties => {
    const { head, size } = new Rect(...range);
    const offset = head.mul(scale).add(canvasOffset);
    const scaledSize = size.mul(scale);
    return {
      left: `${offset.x.toFixed(1)}px`,
      top: `${offset.y.toFixed(1)}px`,
      width: `${scaledSize.x.toFixed(1)}px`,
      height: `${scaledSize.y.toFixed(1)}px`,
    };
  }, [range, canvasOffset, scale]);

  // NOTE: `data-range-preview` is the only stable handle on this element from outside
  // (e.g. e2e tests), since the class name comes from a CSS module.
  return <div className={styles.range} style={style} data-range-preview />;
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
      actions.editorMode.updateAddItemRange(p);
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
      e.preventDefault();
      e.stopPropagation();
      if (draggingIdRef.current !== e.pointerId || e.buttons !== 1) return;
      updateRange(e);
    };
    const onPointerUp: React.PointerEventHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (draggingIdRef.current !== e.pointerId || e.button !== 0) return;
      draggingIdRef.current = null;
      actions.editorMode.commitAddItem();
    };
    const onPointerCancel: React.PointerEventHandler = (e) => {
      e.stopPropagation();
      if (draggingIdRef.current !== e.pointerId) return;
      draggingIdRef.current = null;
      actions.editorMode.cancelAddItem();
    };
    const onClick: React.MouseEventHandler = (e) => {
      e.preventDefault();
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
