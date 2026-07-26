import React from "react";
import { type PageState, selectors, useEditorActions } from "../../store";
import { LineItem } from "../../ui/EditorItem";

/** svg elements for painter content */
export const PainterContent = React.memo(() => {
  const items = selectors.useEditorItems();
  const mode = selectors.useEditorMode();
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
  item: PageState.Item;
  selected?: boolean | undefined;
}>((props) => {
  const actions = useEditorActions();
  const onClick = React.useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      actions.selectItem(props.item.id, e.ctrlKey || e.shiftKey);
    },
    [props.item],
  );
  switch (props.item.kind) {
    case "line":
      return <LineItem item={props.item} selected={props.selected} onClick={onClick} />;
  }
});
