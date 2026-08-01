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
      style={{ transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)` }}
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
  return (
    <div
      className={styles.imageItem}
      data-selected={selected}
      style={{
        left: item.offset[0] * scale,
        top: item.offset[1] * scale,
        width: item.data.width * scale,
        height: item.data.height * scale,
      }}
    />
  );
});
