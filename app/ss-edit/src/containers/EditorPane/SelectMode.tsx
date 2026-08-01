import React from "react";
import { type PageState, pageCtx } from "../../store";
import { Point2D } from "../../utils/geometry";
import styles from "./SelectMode.module.css";

/** editor overlay content for "select" mode */
export const SelectMode = React.memo<{
  editorMode: PageState.Mode.Select;
}>(({ editorMode }) => {
  const view = pageCtx.useEditorView();
  const items = pageCtx.useEditorItems();

  const children = items.map((item): React.ReactNode => {
    switch (item.kind) {
      case "image":
        return <ImageItem item={item} selected={editorMode.selectedIds.includes(item.id)} />;
      default:
        item.kind satisfies never;
        return null;
    }
  });

  const [w, h] = view.canvasSize;
  const paneOffset = Point2D.new(view.canvasSize).scale(0.5);
  const offset = paneOffset.subtract(Point2D.new(view.offset).scale(view.scale));
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <title>select mode editor</title>
      <g transform={`translate(${offset.x} ${offset.y}) scale(${view.scale})`}>{children}</g>
    </svg>
  );
});

const ImageItem = React.memo<{
  item: PageState.Item.Image;
  selected: boolean;
}>(({ item, selected }) => {
  return (
    <rect
      className={styles.imageItem}
      data-selected={selected}
      x={item.offset[0]}
      y={item.offset[1]}
      width={item.data.width}
      height={item.data.height}
    />
  );
});
