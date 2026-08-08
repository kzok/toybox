import React from "react";
import { type PageState, pageCtx, selectors } from "../../store";
import { Point2D } from "../../utils/geometry";
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
    const { head, size } = selectors.rangeRect(range);
    const offset = head.scale(scale).add(canvasOffset);
    const scaledSize = size.scale(scale);
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

  return React.useMemo(() => {
    const onPointerMove: React.PointerEventHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.buttons === 1) {
        // main (left) button
        e.currentTarget.setPointerCapture(e.pointerId);
        const p = Point2D.new(e.clientX, e.clientY).subtract(
          e.currentTarget.getBoundingClientRect(),
        );
        actions.editorMode.updateAddItemRange(p);
        return;
      }
    };
    const onPointerUp: React.PointerEventHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      actions.editorMode.commitAddItem();
    };
    const onClick: React.MouseEventHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    return {
      onPointerDown: onPointerMove,
      onPointerMove,
      onPointerUp,
      onClick,
    } as const;
  }, [actions]);
};
