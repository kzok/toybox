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
  const { selected, singleSelect } = useItemSelected(item.id);

  return (
    <button
      type="button"
      className={styles.imageItem}
      data-item-kind={item.kind}
      data-selected={selected}
      style={style}
      {...usePointerActions(item, singleSelect)}
    />
  );
});

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
  const { selected, singleSelect } = useItemSelected(item.id);

  return (
    <button
      type="button"
      className={styles.textItem}
      data-item-kind={item.kind}
      data-selected={selected}
      style={style}
      {...usePointerActions(item, singleSelect)}
    >
      {item.content}
    </button>
  );
});

const usePointerActions = (item: EditorItem, singleSelect: boolean) => {
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
      e.preventDefault();
      // main (left) button
      if (e.buttons === 1) {
        actions.editorItem.move(item.id, [e.movementX, e.movementY]);
        return;
      }
    },
    onClick: (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (singleSelect && !e.ctrlKey) {
        actions.editorMode.enterEdit(item.id);
      } else {
        actions.editorMode.selectItem(item.id, e.ctrlKey);
      }
    },
  });
};

const useItemSelected = (itemId: string): { selected: boolean; singleSelect: boolean } => {
  const atoms = pageCtx.useAtoms();
  return useAtomValue(
    React.useMemo(
      () =>
        atom((get) => {
          let selected = false;
          let singleSelect = false;
          const editorMode = get(atoms.editorMode);
          if (editorMode.kind !== "select") {
            return { selected, singleSelect };
          }
          selected = editorMode.selectedIds.includes(itemId);
          if (selected) {
            singleSelect = editorMode.selectedIds.length === 1;
          }
          return { selected, singleSelect };
        }),
      [atoms, itemId],
    ),
  );
};
