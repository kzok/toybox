import { atom, useAtomValue } from "jotai";
import React from "react";
import { type EditorItem, splitLines, textStyleOf } from "../../../features/editorItem";
import { useFocusOut } from "../../../hooks";
import { pageCtx } from "../../../store";
import { useCanvasScale } from "../hooks/useCanvasScale";
import styles from "./index.module.css";

/** editor overlay content for "edit" mode */
export const EditMode = React.memo(() => {
  const actions = pageCtx.useActions();
  const elementRef = React.useRef<HTMLDivElement>(null);
  useFocusOut(elementRef, () => actions.editorMode.clear());
  const canvasOffset = pageCtx.useCanvasOffset();
  const item = useEditingItem();
  const children = React.useMemo((): React.ReactNode => {
    switch (item?.kind) {
      case "image":
        return <ImageItem key={item.id} item={item} />;
      case "text":
        return <TextItem key={item.id} item={item} />;
      default:
        return null; // should never happen
    }
  }, [item]);

  return (
    <div
      ref={elementRef}
      className={styles.container}
      style={{
        transform: `translate(${canvasOffset.x.toFixed(1)}px, ${canvasOffset.y.toFixed(1)}px)`,
      }}
    >
      {children}
    </div>
  );
});

const ImageItem = React.memo<{
  item: EditorItem.Image;
}>(({ item }) => {
  const scale = useCanvasScale();
  const elementRef = React.useRef<HTMLButtonElement>(null);
  const style = React.useMemo(
    (): React.CSSProperties => ({
      left: `${(item.offset[0] * scale).toFixed(1)}px`,
      top: `${(item.offset[1] * scale).toFixed(1)}px`,
      width: `${item.data.width}px`,
      height: `${item.data.height}px`,
      ...({ "--scale": scale } as React.CSSProperties),
    }),
    [item, scale],
  );

  React.useEffect(() => {
    elementRef.current?.focus();
  }, []);

  return (
    <button
      ref={elementRef}
      type="button"
      className={styles.imageItem}
      data-item-kind={item.kind}
      style={style}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagationAndCapturePointer}
      onPointerUp={stopPropagation}
      onClick={stopPropagation}
    />
  );
});

/**
 * a transparent `<textarea/>` laid over the text rendered on the `<canvas/>`,
 * so that the caret and the selection are the only visible part of it.
 */
const TextItem = React.memo<{
  item: EditorItem.Text;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const scale = useCanvasScale();
  const elementRef = React.useRef<HTMLTextAreaElement>(null);
  const style = React.useMemo((): React.CSSProperties => {
    return {
      ...textStyleOf(item),
      left: `${(item.offset[0] * scale).toFixed(1)}px`,
      top: `${(item.offset[1] * scale).toFixed(1)}px`,
      ...({ "--scale": scale } as React.CSSProperties),
    };
  }, [item, scale]);

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
      onChange={(e) => actions.editorItem.editText(item.id, e.target.value)}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagationAndCapturePointer}
      onPointerUp={stopPropagation}
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
    />
  );
});

/**
 * @param e event
 */
const stopPropagationAndCapturePointer = (e: React.PointerEvent): void => {
  e.stopPropagation();
  if (e.buttons === 1) {
    // primary button (left click / touch) only
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
  }
};

/**
 * @param e event
 */
const stopPropagation = (e: React.SyntheticEvent): void => {
  e.stopPropagation();
};

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
