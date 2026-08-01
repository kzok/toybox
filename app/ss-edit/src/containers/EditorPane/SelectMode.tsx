import React from "react";
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
      default:
        item.kind satisfies never;
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
  item: PageState.Item.Image;
  scale: number;
  selected: boolean;
}>(({ item, scale, selected }) => {
  const actions = pageCtx.usePageActions();
  return (
    <button
      type="button"
      className={styles.imageItem}
      data-selected={selected}
      style={{
        left: `${(item.offset[0] * scale).toFixed(1)}px`,
        top: `${(item.offset[1] * scale).toFixed(1)}px`,
        width: `${(item.data.width * scale).toFixed(1)}px`,
        height: `${(item.data.height * scale).toFixed(1)}px`,
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        actions.selectItem(item.id, e.ctrlKey);
      }}
    />
  );
});
