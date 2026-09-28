import { atom, useAtomValue } from "jotai";
import React from "react";
import {
  arrowStyleSizeOf,
  type EditorItem,
  rectStyleSizeOf,
  textStyleOf,
} from "../../../features/editorItem";
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
        return <RectItem key={item.id} item={item} />;
      case "arrow":
        return <ArrowItem key={item.id} item={item} />;
      case "mosaic":
        return <MosaicItem key={item.id} item={item} />;
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
      {
        // the content is rendered into it, transparent, only to give the span its box.
        item.content
      }
    </span>
  );
});

const RectItem = React.memo<{
  item: EditorItem.Rect;
}>(({ item }) => {
  const style = React.useMemo((): React.CSSProperties => {
    const { padding } = rectStyleSizeOf(item);
    return {
      left: `${item.offset[0]}px`,
      top: `${item.offset[1]}px`,
      width: `${item.width + padding * 2}px`,
      height: `${item.height + padding * 2}px`,
    };
  }, [item]);
  const selected = useItemSelected(item.id);

  return (
    <span
      className={styles.rectItem}
      data-item-kind={item.kind}
      data-selected={selected}
      style={style}
      {...usePointerActions(item, selected)}
    />
  );
});

const ArrowItem = React.memo<{
  item: EditorItem.Arrow;
}>(({ item }) => {
  const style = React.useMemo((): React.CSSProperties => {
    const { padding } = arrowStyleSizeOf(item.length);
    return {
      left: `${item.offset[0]}px`,
      top: `${item.offset[1]}px`,
      width: `${item.length}px`,
      height: `${padding * 2}px`,
      marginTop: `${-padding}px`,
      transform: `rotate(${item.angle}rad)`,
    };
  }, [item]);
  const selected = useItemSelected(item.id);

  return (
    <span
      className={styles.arrowItem}
      data-item-kind={item.kind}
      data-selected={selected}
      style={style}
      {...usePointerActions(item, selected)}
    />
  );
});

const MosaicItem = React.memo<{
  item: EditorItem.Mosaic;
}>(({ item }) => {
  const style = React.useMemo(
    (): React.CSSProperties => ({
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
      className={styles.mosaicItem}
      data-item-kind={item.kind}
      data-selected={selected}
      style={style}
      {...usePointerActions(item, selected)}
    />
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
