import { atom, useAtomValue } from "jotai";
import React from "react";
import { type EditorItem, splitLines, textStyleOf } from "../../../features/editorItem";
import { pageCtx } from "../../../store";
import { CanvasLayer } from "../CanvasLayer";
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
      default:
        return null; // should never happen
    }
  }, [item]);

  return <CanvasLayer>{children}</CanvasLayer>;
});

const ImageItem = React.memo<{
  item: EditorItem.Image;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const elementRef = React.useRef<HTMLButtonElement>(null);
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
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: pointer-only drag handle; onClick here
      only swallows the click so it doesn't reach the parent button, it triggers no action. */}
      <span
        className={styles.resizeHandle}
        data-resize-handle
        onPointerDown={(e) => {
          e.stopPropagation();
          // capture the pointer only when main (left) button.
          if (e.buttons === 1) {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.buttons === 1) {
            const anchor = elementRef.current?.getBoundingClientRect();
            if (anchor == null) return;
            actions.edit.resizeImage(item.id, [e.clientX - anchor.left, e.clientY - anchor.top]);
          }
        }}
        onPointerUp={stopPropagation}
        onClick={stopPropagation}
      />
    </button>
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
  const elementRef = React.useRef<HTMLTextAreaElement>(null);
  const style = React.useMemo((): React.CSSProperties => {
    return {
      ...textStyleOf(item),
      left: `${item.offset[0]}px`,
      top: `${item.offset[1]}px`,
    };
  }, [item]);

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
      onChange={(e) => actions.edit.setText(item.id, e.target.value)}
      onPointerDown={stopPropagationAndCapturePointer}
      onPointerMove={stopPropagation}
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
