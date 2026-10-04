import React from "react";
import {
  arrowStyleSizeOf,
  type EditorItem,
  rectStyleSizeOf,
  splitLines,
  textStyleOf,
} from "../../../features/editorItem";
import { pageCtx } from "../../../store";
import { Vec2 } from "../../../utils/geometry";
import { useTextEditorRef } from "../../EditToolbar/context";
import { CanvasLayer } from "../CanvasLayer";
import { ResizeContainer, ResizeHandle, ResizePointHandle } from "../ResizeHandle";
import styles from "./index.module.css";

/** editor overlay content for "edit" mode */
export const EditMode = React.memo(() => {
  const item = pageCtx.useEditingItem();
  const children = React.useMemo((): React.ReactNode => {
    switch (item?.kind) {
      case "image":
        return <ImageItem key={item.id} item={item} />;
      case "text":
        return <TextItem key={item.id} item={item} />;
      case "rect":
        return <RectItem key={item.id} item={item} />;
      case "arrow":
        return <ArrowItem key={item.id} item={item} />;
      case "mosaic":
        return <MosaicItem key={item.id} item={item} />;
      default:
        item satisfies null;
        return null;
    }
  }, [item]);

  return <CanvasLayer>{children}</CanvasLayer>;
});

const ImageItem = React.memo<{
  item: EditorItem.Image;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const style = React.useMemo(
    (): React.CSSProperties => ({
      left: `${item.offset[0]}px`,
      top: `${item.offset[1]}px`,
      width: `${item.width}px`,
      height: `${item.height}px`,
    }),
    [item],
  );
  const onResize = React.useCallback(
    (cursor: Vec2.Tuple) => actions.editMode.resizeImage(item.id, cursor),
    [actions, item.id],
  );
  const onMove = useMoveHandler();

  return (
    <ResizeContainer
      className={styles.imageItem}
      data-item-kind={item.kind}
      style={style}
      onPointerDown={stopPropagation}
      onPointerMove={onMove}
      onPointerUp={stopPropagation}
      // NOTE: keeps the click from reaching the pane, which would clear the selection.
      onClick={stopPropagation}
    >
      <ResizeHandle direction="bottom-right" onResize={onResize} />
    </ResizeContainer>
  );
});

const RectItem = React.memo<{
  item: EditorItem.Rect;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const style = React.useMemo((): React.CSSProperties => {
    const { padding } = rectStyleSizeOf(item);
    return {
      left: `${item.offset[0]}px`,
      top: `${item.offset[1]}px`,
      width: `${item.width + padding * 2}px`,
      height: `${item.height + padding * 2}px`,
    };
  }, [item]);
  const onResize = React.useCallback(
    (cursor: Vec2.Tuple) => actions.editMode.resizeRect(item.id, cursor),
    [actions, item.id],
  );
  const onMove = useMoveHandler();

  return (
    <ResizeContainer
      className={styles.rectItem}
      data-item-kind={item.kind}
      style={style}
      onPointerDown={stopPropagation}
      onPointerMove={onMove}
      onPointerUp={stopPropagation}
      // NOTE: keeps the click from reaching the pane, which would clear the selection.
      onClick={stopPropagation}
    >
      <ResizeHandle direction="bottom-right" onResize={onResize} />
    </ResizeContainer>
  );
});

const MosaicItem = React.memo<{
  item: EditorItem.Mosaic;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const style = React.useMemo(
    (): React.CSSProperties => ({
      left: `${item.offset[0]}px`,
      top: `${item.offset[1]}px`,
      width: `${item.width}px`,
      height: `${item.height}px`,
    }),
    [item],
  );
  const onResize = React.useCallback(
    (cursor: Vec2.Tuple) => actions.editMode.resizeMosaic(item.id, cursor),
    [actions, item.id],
  );
  const onMove = useMoveHandler();

  return (
    <ResizeContainer
      className={styles.mosaicItem}
      data-item-kind={item.kind}
      style={style}
      onPointerDown={stopPropagation}
      onPointerMove={onMove}
      onPointerUp={stopPropagation}
      // NOTE: keeps the click from reaching the pane, which would clear the selection.
      onClick={stopPropagation}
    >
      <ResizeHandle direction="bottom-right" onResize={onResize} />
    </ResizeContainer>
  );
});

const ArrowItem = React.memo<{
  item: EditorItem.Arrow;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const style = React.useMemo(
    (): React.CSSProperties => ({
      left: `${item.offset[0]}px`,
      top: `${item.offset[1]}px`,
    }),
    [item.offset],
  );
  const tip = React.useMemo(
    (): Vec2.Tuple => Vec2.polar(item.length, item.angle).tuple(),
    [item.length, item.angle],
  );
  // NOTE: the same band `SelectMode` uses as the item's hit area, laid inside the container so
  // that the container itself stays free of the rotation the handles must not be measured through.
  const bandStyle = React.useMemo((): React.CSSProperties => {
    const { padding } = arrowStyleSizeOf(item.length);
    return {
      width: `${item.length}px`,
      height: `${padding * 2}px`,
      marginTop: `${-padding}px`,
      transform: `rotate(${item.angle}rad)`,
    };
  }, [item.length, item.angle]);
  const onResizeTail = React.useCallback(
    (cursor: Vec2.Tuple) => actions.editMode.resizeArrowTail(item.id, cursor),
    [actions, item.id],
  );
  const onResizeTip = React.useCallback(
    (cursor: Vec2.Tuple) => actions.editMode.resizeArrowTip(item.id, cursor),
    [actions, item.id],
  );
  const onMove = useMoveHandler();

  return (
    // a transparent container
    <ResizeContainer
      style={style}
      onPointerDown={stopPropagation}
      onPointerMove={onMove}
      onPointerUp={stopPropagation}
      // NOTE: keeps the click from reaching the pane, which would clear the selection.
      onClick={stopPropagation}
    >
      {/* a visible band */}
      <span className={styles.arrowItem} data-item-kind={item.kind} style={bandStyle} />
      <ResizePointHandle end="tail" position={TAIL_POSITION} onResize={onResizeTail} />
      <ResizePointHandle end="tip" position={tip} onResize={onResizeTip} />
    </ResizeContainer>
  );
});

/** arrow tail's place in the container's own coordinates. */
const TAIL_POSITION: Vec2.Tuple = Vec2.ORIGIN.tuple();

const TextItem = React.memo<{
  item: EditorItem.Text;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const elementRef = useTextEditorRef();
  const boxStyle = React.useMemo(
    (): React.CSSProperties => ({
      left: `${item.offset[0]}px`,
      top: `${item.offset[1]}px`,
    }),
    [item.offset],
  );
  const style = React.useMemo((): React.CSSProperties => textStyleOf(item), [item]);
  const onResizeFontSize = React.useCallback(
    (cursor: Vec2.Tuple) => actions.editMode.resizeTextFontSize(item.id, cursor),
    [actions, item.id],
  );
  const onResizeWidth = React.useCallback(
    (cursor: Vec2.Tuple) => actions.editMode.resizeTextWidth(item.id, cursor),
    [actions, item.id],
  );

  React.useEffect(() => {
    const element = elementRef.current;
    if (element == null) {
      return;
    }
    element.focus();
    // place the caret at the end of the content.
    element.setSelectionRange(element.value.length, element.value.length);
  }, [elementRef]);

  return (
    <ResizeContainer style={boxStyle}>
      <textarea
        ref={elementRef}
        className={styles.textItem}
        data-item-kind={item.kind}
        rows={splitLines(item).length}
        style={style}
        // NOTE: uncontrolled so that React never rewrites the value being composed
        // by an IME. "input" events fire during a composition as well, hence the
        // canvas previews the text before it is confirmed.
        defaultValue={item.content}
        spellCheck={false}
        onChange={(e) => actions.editMode.setText(item.id, e.target.value)}
        onPointerDown={stopPropagationAndCapturePointer}
        onPointerMove={stopPropagation}
        onPointerUp={stopPropagation}
        onClick={stopPropagation}
        onContextMenu={stopPropagation}
      />
      <ResizeHandle direction="right" onResize={onResizeWidth} />
      <ResizeHandle direction="bottom-right" onResize={onResizeFontSize} />
    </ResizeContainer>
  );
});

/**
 * @returns a `pointermove` handler dragging the item along while the main (left) button is held
 */
const useMoveHandler = () => {
  const actions = pageCtx.useActions();
  return React.useCallback(
    (e: React.PointerEvent): void => {
      stopPropagationAndCapturePointer(e);
      if (e.buttons === 1) {
        actions.editMode.move([e.movementX, e.movementY]);
      }
    },
    [actions],
  );
};

const stopPropagationAndCapturePointer = (e: React.PointerEvent): void => {
  e.stopPropagation();
  // capture the pointer only when main (left) button.
  if (e.buttons === 1) {
    e.currentTarget.setPointerCapture(e.pointerId);
  }
};

/** @note stopping `keydown` would kill every hotkey: the manager listens on `document`. */
const stopPropagation = (e: React.MouseEvent): void => e.stopPropagation();
