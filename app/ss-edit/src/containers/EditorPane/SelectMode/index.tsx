import { atom, useAtomValue } from "jotai";
import React from "react";
import { type EditorItem, textStyleOf } from "../../../features/editorItem";
import { usePointerEvents } from "../../../hooks";
import { pageCtx } from "../../../store";
import { CanvasLayer } from "../CanvasLayer";
import styles from "./index.module.css";

/** editor overlay content for "select" mode */
export const SelectMode = React.memo(() => {
  const items = pageCtx.useEditorItems();

  const children = items.map((item): React.ReactNode => {
    switch (item.kind) {
      case "image":
        return <ImageItem key={item.id} item={item} />;
      case "text":
        return <TextItem key={item.id} item={item} />;
      case "rect":
        return null; // TODO: implement it.
      default:
        item satisfies never;
        throw new Error(`unknown item: ${JSON.stringify(item)}`);
    }
  });

  return <CanvasLayer>{children}</CanvasLayer>;
});

const ImageItem = React.memo<{
  item: EditorItem.Image;
}>(({ item }) => {
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
  const selected = useItemSelected(item.id);

  return (
    <span
      className={styles.imageItem}
      data-item-kind={item.kind}
      data-selected={selected}
      style={style}
      {...usePointerActions(item, selected)}
    />
  );
});

/**
 * the hit-target of a text item in select mode.
 * @note the content is rendered into it, transparent, only to give the span its box: the shared
 *   text style sets the width, and without children there would be no height and hence no hit
 *   area at all.
 */
const TextItem = React.memo<{
  item: EditorItem.Text;
}>(({ item }) => {
  const style = React.useMemo(
    (): React.CSSProperties => ({
      ...textStyleOf(item),
      left: `${item.offset[0]}px`,
      top: `${item.offset[1]}px`,
    }),
    [item],
  );
  const selected = useItemSelected(item.id);

  return (
    <span
      className={styles.textItem}
      data-item-kind={item.kind}
      data-selected={selected}
      style={style}
      {...usePointerActions(item, selected)}
    >
      {item.content}
    </span>
  );
});

const usePointerActions = (item: EditorItem, selected: boolean) => {
  const actions = pageCtx.useActions();

  return usePointerEvents({
    onPointerDown: (e) => {
      e.stopPropagation();
      // capture the pointer only when main (left) button.
      if (e.buttons === 1) {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    onPointerMove: (e) => {
      e.stopPropagation();
      // main (left) button
      if (e.buttons === 1) {
        actions.selection.move(item.id, [e.movementX, e.movementY]);
        return;
      }
    },
    onClick: (e) => {
      e.stopPropagation();
      if (selected && !e.ctrlKey) {
        actions.edit.enter(item.id);
      } else {
        actions.selection.select(item.id, e.ctrlKey);
      }
    },
  });
};

const useItemSelected = (itemId: string): boolean => {
  const atoms = pageCtx.useAtoms();
  return useAtomValue(
    React.useMemo(
      () =>
        atom((get) => {
          const editorMode = get(atoms.editorMode);
          if (editorMode.kind !== "select") return false;
          return editorMode.selectedIds.includes(itemId);
        }),
      [atoms, itemId],
    ),
  );
};
