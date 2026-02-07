import { useAtomValue } from "jotai";
import React from "react";
import { type EditorState, editorAtoms } from "../../../store/editor";
import { LineItem } from "../../../ui/EditorItem";

/**
 * @param item
 * @returns
 */
const renderItem = (item: EditorState.Item): React.ReactNode => {
  switch (item.kind) {
    case "line":
      return <LineItem item={item} />;
  }
};

const PaintedItems = React.memo(() => {
  const items = useAtomValue(editorAtoms.items);

  const children = React.useMemo(() => {
    const result: React.ReactNode[] = [];
    for (let i = items.length - 1; i >= 0; i -= 1) {
      result.push(renderItem(items[i]!));
    }
    return result;
  }, [items]);

  return children;
});

/** actual <svg/> element to render the application state. */
export const Painter = React.memo(() => {
  const view = useAtomValue(editorAtoms.view);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={view.size.width} height={view.size.height}>
      <title>canvas view</title>
      <g
        transform={`scale(${view.scale.toFixed(2)}) translate(${(-view.offset[0]).toFixed(2)} ${(-view.offset[1]).toFixed(2)})`}
      >
        <PaintedItems />
      </g>
    </svg>
  );
});
