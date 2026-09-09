import { atom, useAtomValue } from "jotai";
import React from "react";
import {
  ARROW_STYLE_SIZE,
  type EditorItem,
  rectStyleSizeOf,
  splitLines,
  textStyleOf,
} from "../../../features/editorItem";
import { pageCtx } from "../../../store";
import { Vec2 } from "../../../utils/geometry";
import { CanvasLayer } from "../CanvasLayer";
import { ResizeContainer, ResizeHandle, ResizePointHandle } from "../ResizeHandle";
import styles from "./index.module.css";

/** editor overlay content for "edit" mode */
export const EditMode = React.memo(() => {
  const item = useEditingItem();
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
    (cursor: Vec2.Tuple) => actions.edit.resizeImage(item.id, cursor),
    [actions, item.id],
  );

  return (
    <ResizeContainer
      className={styles.imageItem}
      data-item-kind={item.kind}
      style={style}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagationAndCapturePointer}
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
    (cursor: Vec2.Tuple) => actions.edit.resizeRect(item.id, cursor),
    [actions, item.id],
  );

  return (
    <ResizeContainer
      className={styles.rectItem}
      data-item-kind={item.kind}
      style={style}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagationAndCapturePointer}
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
    const { padding } = ARROW_STYLE_SIZE;
    return {
      width: `${item.length}px`,
      height: `${padding * 2}px`,
      marginTop: `${-padding}px`,
      transform: `rotate(${item.angle}rad)`,
    };
  }, [item.length, item.angle]);
  const onResizeTail = React.useCallback(
    (cursor: Vec2.Tuple) => actions.edit.resizeArrowTail(item.id, cursor),
    [actions, item.id],
  );
  const onResizeTip = React.useCallback(
    (cursor: Vec2.Tuple) => actions.edit.resizeArrowTip(item.id, cursor),
    [actions, item.id],
  );

  return (
    // a transparent container
    <ResizeContainer
      style={style}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagationAndCapturePointer}
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
  const elementRef = React.useRef<HTMLTextAreaElement>(null);
  const boxStyle = React.useMemo(
    (): React.CSSProperties => ({
      left: `${item.offset[0]}px`,
      top: `${item.offset[1]}px`,
    }),
    [item.offset],
  );
  const style = React.useMemo((): React.CSSProperties => textStyleOf(item), [item]);
  const onResizeFontSize = React.useCallback(
    (cursor: Vec2.Tuple) => actions.edit.resizeTextFontSize(item.id, cursor),
    [actions, item.id],
  );
  const onResizeWidth = React.useCallback(
    (cursor: Vec2.Tuple) => actions.edit.resizeTextWidth(item.id, cursor),
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
  }, []);

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
        onChange={(e) => actions.edit.setText(item.id, e.target.value)}
        onPointerDown={stopPropagationAndCapturePointer}
        onPointerMove={stopPropagation}
        onPointerUp={stopPropagation}
        onClick={stopPropagation}
      />
      <ResizeHandle direction="right" onResize={onResizeWidth} />
      <ResizeHandle direction="bottom-right" onResize={onResizeFontSize} />
    </ResizeContainer>
  );
});

const stopPropagationAndCapturePointer = (e: React.PointerEvent): void => {
  e.stopPropagation();
  // capture the pointer only when main (left) button.
  if (e.buttons === 1) {
    e.currentTarget.setPointerCapture(e.pointerId);
  }
};

const stopPropagation = (e: React.SyntheticEvent): void => e.stopPropagation();

/**
 * @returns the text item being edited, or null if there is none.
 */
const useEditingItem = (): EditorItem | null => {
  const atoms = pageCtx.useAtoms();
  return useAtomValue(
    React.useMemo(
      () =>
        atom((get): EditorItem | null => {
          const editorMode = get(atoms.editorMode);
          if (editorMode.kind !== "edit") return null;
          return get(atoms.editorItems).find((item) => item.id === editorMode.itemId) ?? null;
        }),
      [atoms],
    ),
  );
};
