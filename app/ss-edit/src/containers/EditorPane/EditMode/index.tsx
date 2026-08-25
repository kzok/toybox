import { atom, useAtomValue } from "jotai";
import React from "react";
import { type EditorItem, splitLines, textStyleOf } from "../../../features/editorItem";
import { pageCtx } from "../../../store";
import type { Vec2 } from "../../../utils/geometry";
import { CanvasLayer } from "../CanvasLayer";
import { ResizeContainer, ResizeHandle } from "../ResizeHandle";
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
        return null; // TODO: implement it.
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
      // NOTE: an ancestor component applies the offset and the scale.
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

/**
 * a transparent `<textarea/>` laid over the text rendered on the `<canvas/>`,
 * so that the caret and the selection are the only visible part of it.
 * @note a `<textarea/>` takes no children, hence the resize handles are siblings of it and the
 *   offset is carried by the box wrapping them. the wrapper is left to shrink to fit, so it stays
 *   exactly the `<textarea/>`'s box and the handles land on its right edge and bottom right corner.
 */
const TextItem = React.memo<{
  item: EditorItem.Text;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const elementRef = React.useRef<HTMLTextAreaElement>(null);
  const boxStyle = React.useMemo(
    (): React.CSSProperties => ({
      // NOTE: an ancestor component applies the offset and the scale.
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
        // NOTE: a <textarea/> does not grow with its content, hence the row count comes from the
        // laid out lines. that lands on the box the canvas paints because the lines and the line
        // height both come from `editorItem`.
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

/**
 * @param e event
 */
const stopPropagationAndCapturePointer = (e: React.PointerEvent): void => {
  e.stopPropagation();
  // capture the pointer only when main (left) button.
  if (e.buttons === 1) {
    e.currentTarget.setPointerCapture(e.pointerId);
  }
};

/**
 * @param e event
 */
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
