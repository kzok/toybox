import React from "react";
import { type EditorItem, letterSpacingOf, lineHeightOf } from "../../features/editorItem";
import { usePointerEvents } from "../../hooks";
import { type PageState, pageCtx } from "../../store";
import styles from "./SelectMode.module.css";

/** editor overlay content for "select" mode */
export const SelectMode = React.memo<{
  editorMode: PageState.Mode.Select;
}>(({ editorMode }) => {
  const view = pageCtx.useEditorView();
  const items = pageCtx.useEditorItems();
  const canvasOffset = pageCtx.useCanvasOffset();

  const children = items.map((item): React.ReactNode => {
    switch (item.kind) {
      case "image":
        return (
          <ImageItem
            key={item.id}
            item={item}
            scale={view.scale}
            selected={editorMode.selectedIds.includes(item.id)}
          />
        );
      case "text":
        return (
          <TextItem
            key={item.id}
            item={item}
            scale={view.scale}
            selected={editorMode.selectedIds.includes(item.id)}
          />
        );
      default:
        item satisfies never;
        return null;
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
  scale: number;
  selected: boolean;
}>(({ item, scale, selected }) => (
  <button
    type="button"
    className={styles.imageItem}
    data-item-kind={item.kind}
    data-selected={selected}
    style={{
      left: `${(item.offset[0] * scale).toFixed(1)}px`,
      top: `${(item.offset[1] * scale).toFixed(1)}px`,
      width: `${item.data.width}px`,
      height: `${item.data.height}px`,
      ...({ "--scale": scale } as React.CSSProperties),
    }}
    {...usePointerActions(item)}
  />
));

const TextItem = React.memo<{
  item: EditorItem.Text;
  scale: number;
  selected: boolean;
}>(({ item, scale, selected }) => {
  return (
    <button
      type="button"
      className={styles.textItem}
      data-item-kind={item.kind}
      data-selected={selected}
      style={{
        left: `${(item.offset[0] * scale).toFixed(1)}px`,
        top: `${(item.offset[1] * scale).toFixed(1)}px`,
        width: `${item.width}px`,
        fontSize: `${item.fontSize}px`,
        lineHeight: `${lineHeightOf(item.fontSize)}px`,
        letterSpacing: `${letterSpacingOf(item.fontSize)}px`,
        ...({ "--scale": scale } as React.CSSProperties),
      }}
      {...usePointerActions(item)}
    >
      {item.content}
    </button>
  );
});

const usePointerActions = (item: EditorItem) => {
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
      actions.selectItem(item.id, e.ctrlKey);
    },
  });
};
