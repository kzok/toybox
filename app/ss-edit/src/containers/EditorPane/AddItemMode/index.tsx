import React from "react";
import { ARROW_STYLE_SIZE, type EditorItem, type ItemRange } from "../../../features/editorItem";
import { type PageState, pageCtx } from "../../../store";
import { Rect, Vec2 } from "../../../utils/geometry";
import { CanvasLayer } from "../CanvasLayer";
import styles from "./index.module.css";

/** editor overlay content for "add-item" mode */
export const AddItemMode = React.memo<{
  editorMode: PageState.Mode.AddItem;
}>(({ editorMode }) => {
  const preview = pageCtx.useAddItemPreview();
  return (
    // NOTE: this element must stay free of any transform: `usePointerActions` reads pointer
    // positions relative to its bounding rect (see `updateRange`).
    <div className={styles.container} {...usePointerActions()}>
      {editorMode.range && preview && (
        <CanvasLayer>
          <RangePreview item={preview} range={editorMode.range} />
        </CanvasLayer>
      )}
    </div>
  );
});

/**
 * the outline of the item about to be added, over the item itself as the `<canvas/>` paints it.
 * @note the box a drag gives the kinds that have one, and for an arrow the band `SelectMode` and
 *   `EditMode` give a finished one — the same shape the arrow will answer the pointer over once it
 *   is added. its own box would say nothing: the same box comes of dragging north east and south
 *   west, while which end the drag started from is the whole of what an arrow is.
 * @note taken from the item the drag would add rather than from the drag, so that the outline
 *   lands on the item painted under it however far the two differ. that is what shows a drag too
 *   small to be committed as it is where it will end up, instead of jumping there on release.
 * @note a text item is the exception, having no height of its own to be read: the drag it comes
 *   from names a font size and a wrapping width rather than a box, so the outline stays the drag.
 */
const RangePreview = React.memo<{
  item: EditorItem;
  range: ItemRange;
}>(({ item, range }) => {
  const isArrow = item.kind === "arrow";
  const style = React.useMemo((): React.CSSProperties => {
    // NOTE: an ancestor component applies the offset and the scale.
    const left = `${item.offset[0]}px`;
    const top = `${item.offset[1]}px`;
    switch (item.kind) {
      case "arrow": {
        // NOTE: the same band as `SelectMode` and `EditMode`, hence the same height: `padding` is
        //   how far the drawing spreads either side of the shaft, arrowhead and outline included.
        const { padding } = ARROW_STYLE_SIZE;
        return {
          left,
          top,
          width: `${item.length}px`,
          height: `${padding * 2}px`,
          marginTop: `${-padding}px`,
          // NOTE: laid out along +x from the tail and turned into place, the way `renderArrow`
          //   does it. `angle` is exactly what CSS `rotate()` takes.
          transform: `rotate(${item.angle}rad)`,
        };
      }
      case "rect":
        return { left, top, width: `${item.width}px`, height: `${item.height}px` };
      default: {
        const { head, size } = new Rect(...range);
        return {
          left: `${head.x}px`,
          top: `${head.y}px`,
          width: `${size.x}px`,
          height: `${size.y}px`,
        };
      }
    }
  }, [item, range]);

  // NOTE: `data-range-preview` is the only stable handle on this element from outside
  // (e.g. e2e tests), since the class name comes from a CSS module.
  return (
    <div className={isArrow ? styles.arrowRange : styles.range} style={style} data-range-preview />
  );
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
