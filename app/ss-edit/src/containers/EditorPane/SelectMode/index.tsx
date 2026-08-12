import { atom, useAtomValue } from "jotai";
import React from "react";
import { type EditorItem, textStyleOf } from "../../../features/editorItem";
import { usePointerEvents } from "../../../hooks";
import { pageCtx } from "../../../store";
import { useCanvasScale } from "../hooks/useCanvasScale";
import styles from "./index.module.css";

/** editor overlay content for "select" mode */
export const SelectMode = React.memo(() => {
  const items = pageCtx.useEditorItems();
  const canvasOffset = pageCtx.useCanvasOffset();

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

  return (
    <div
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
  const scale = useCanvasScale();
  const style = React.useMemo(
    (): React.CSSProperties => ({
      ...textStyleOf(item),
      left: `${(item.offset[0] * scale).toFixed(1)}px`,
      top: `${(item.offset[1] * scale).toFixed(1)}px`,
      ...({ "--scale": scale } as React.CSSProperties),
    }),
    [item, scale],
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
      e.preventDefault();
      e.stopPropagation();
    },
    onPointerMove: (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.buttons === 1) {
        // main (left) button
        e.currentTarget.setPointerCapture(e.pointerId);
        actions.editorItem.move(item.id, [e.movementX, e.movementY]);
        return;
      }
    },
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (singleSelect && item.kind === "text" && !e.ctrlKey) {
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
