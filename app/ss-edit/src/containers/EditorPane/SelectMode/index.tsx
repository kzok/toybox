import { atom, useAtomValue } from "jotai";
import React from "react";
import {
  ARROW_STYLE_SIZE,
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

/**
 * the hit-target of a rect item in select mode.
 * @note the whole box takes the pointer, the middle of the rect included, as an image item's does.
 *   that costs the items a rect is drawn around: they cannot be clicked through it.
 * @note the box is the one the renderer paints, which `rectStyleSizeOf` pads on every side to take
 *   up the half of the outline lying outside the line's own box.
 */
const RectItem = React.memo<{
  item: EditorItem.Rect;
}>(({ item }) => {
  const style = React.useMemo((): React.CSSProperties => {
    const { padding } = rectStyleSizeOf(item);
    return {
      // NOTE: an ancestor component applies the offset and the scale.
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

/**
 * the hit-target of an arrow item in select mode.
 * @note a band along the arrow rather than the box it spans, unlike every other kind: the box of a
 *   diagonal arrow is mostly empty, and taking the pointer over all of it would put whatever lies
 *   in those corners out of reach. a rect pays that cost because its box is what it covers; an
 *   arrow's is not.
 * @note as wide as `padding` makes the drawing at the head, the widest part of it, which leaves
 *   the thin shaft a comfortable grab area as well. what falls outside is the few px the tail's
 *   rounding reaches behind `offset` and the miter beyond the tip.
 * @note laid out along +x from the tail and turned into place, the way `renderArrow` does it. it
 *   is pulled up by half its height and turned about its left edge, so that the point it pivots
 *   on is the tail itself rather than a corner of the band.
 */
const ArrowItem = React.memo<{
  item: EditorItem.Arrow;
}>(({ item }) => {
  const style = React.useMemo((): React.CSSProperties => {
    const { padding } = ARROW_STYLE_SIZE;
    return {
      // NOTE: an ancestor component applies the offset and the scale.
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
