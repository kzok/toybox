import { useAtomValue } from "jotai";
import React from "react";
import { type EditorState, editorAtoms, useEditorActions } from "../../store/editor";
import { LineItem } from "../../ui/EditorItem";
import styles from "./PainterContent.module.css";

/** svg elements for painter content */
export const PainterContent = React.memo(() => {
  const items = useAtomValue(editorAtoms.items);
  const mode = useAtomValue(editorAtoms.mode);
  const children = React.useMemo(() => {
    if (mode.kind === "select") {
      const nonSelectedChlidren: React.ReactNode[] = [];
      const selectedChlidren: React.ReactNode[] = [];
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const item = items[i]!;
        if (mode.selectedIds.includes(item.id)) {
          selectedChlidren.push(<ConnectedItem key={item.id} item={item} selected />);
        } else {
          nonSelectedChlidren.push(<ConnectedItem key={item.id} item={item} />);
        }
      }
      return [...nonSelectedChlidren, ...selectedChlidren];
    }
    const result: React.ReactNode[] = [];
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i]!;
      result.push(<ConnectedItem key={item.id} item={item} />);
    }
    return result;
  }, [items, mode]);
  return children;
});

const ConnectedItem = React.memo<{
  item: EditorState.Item;
  selected?: boolean | undefined;
}>((props) => {
  const actions = useEditorActions();
  const onClick = React.useCallback(
    (e: React.MouseEvent): void => {
      actions.selectItem(props.item.id, e.ctrlKey || e.shiftKey);
    },
    [props.item],
  );
  const gProps = React.useMemo(
    (): React.SVGProps<SVGGElement> => ({
      className: styles.item,
      onClick,
      "aria-selected": props.selected,
    }),
    [props.selected, onClick],
  );

  switch (props.item.kind) {
    case "line":
      return <LineItem item={props.item} gProps={gProps} />;
  }
});
