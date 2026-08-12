import { atom, useAtomValue } from "jotai";
import React from "react";
import {
  type EditorItem,
  letterSpacingOf,
  lineHeightOf,
  measureTextSize,
  paddingOf,
} from "../../../features/editorItem";
import { pageCtx } from "../../../store";
import { useCanvasScale } from "../hooks/useCanvasScale";
import styles from "./index.module.css";

/** editor overlay content for "edit" mode */
export const EditMode = React.memo(() => {
  const canvasOffset = pageCtx.useCanvasOffset();
  const item = useEditingTextItem();

  return (
    <div
      className={styles.container}
      style={{
        transform: `translate(${canvasOffset.x.toFixed(1)}px, ${canvasOffset.y.toFixed(1)}px)`,
      }}
    >
      {item && <TextItemEditor key={item.id} item={item} />}
    </div>
  );
});

/**
 * a transparent `<textarea/>` laid over the text rendered on the `<canvas/>`,
 * so that the caret and the selection are the only visible part of it.
 */
const TextItemEditor = React.memo<{
  item: EditorItem.Text;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const scale = useCanvasScale();
  const elementRef = React.useRef<HTMLTextAreaElement>(null);
  const style = React.useMemo((): React.CSSProperties => {
    const height = `${measureTextSize(item).y}px`;
    return {
      left: `${(item.offset[0] * scale).toFixed(1)}px`,
      top: `${(item.offset[1] * scale).toFixed(1)}px`,
      width: `${item.width}px`,
      height,
      minHeight: height,
      fontSize: `${item.fontSize}px`,
      padding: `${paddingOf(item.fontSize)}px`,
      lineHeight: `${lineHeightOf(item.fontSize)}px`,
      letterSpacing: `${letterSpacingOf(item.fontSize)}px`,
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
      className={styles.textarea}
      style={style}
      // NOTE: uncontrolled so that React never rewrites the value being composed
      // by an IME. "input" events fire during a composition as well, hence the
      // canvas previews the text before it is confirmed.
      defaultValue={item.content}
      spellCheck={false}
      onChange={(e) => actions.editorItem.editText(item.id, e.target.value)}
      onBlur={() => actions.editorMode.clear()}
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
const useEditingTextItem = (): EditorItem.Text | null => {
  const atoms = pageCtx.useAtoms();
  return useAtomValue(
    React.useMemo(
      () =>
        atom((get): EditorItem.Text | null => {
          const editorMode = get(atoms.editorMode);
          if (editorMode.kind !== "edit") return null;
          const item = get(atoms.editorItems).find((item) => item.id === editorMode.itemId);
          return item?.kind === "text" ? item : null;
        }),
      [atoms],
    ),
  );
};
