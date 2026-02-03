import { useAtomValue } from "jotai";
import React from "react";
import { type EditorState, editorAtoms } from "../../../store/editor";

/**
 * @param item
 * @returns
 */
const renderItem = (item: EditorState.Item): React.ReactNode => {
  switch (item.kind) {
    case "line":
      return (
        <line
          x1={item.head[0]}
          y1={item.head[1]}
          x2={item.tail[0]}
          y2={item.tail[1]}
          stroke={item.color}
          strokeWidth={item.width}
          strokeLinecap="round"
        />
      );
  }
};

/** actual <svg/> element to render the application state. */
export const Painter = React.memo(() => {
  const view = useAtomValue(editorAtoms.view);
  const items = useAtomValue(editorAtoms.items);

  const children = React.useMemo(() => {
    const result: React.ReactNode[] = [];
    for (let i = items.length - 1; i >= 0; i -= 1) {
      result.push(renderItem(items[i]!));
    }
    return result;
  }, [items]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={view.canvas.width}
      height={view.canvas.height}
      viewBox={[
        view.offset[0].toString(),
        view.offset[1].toString(),
        view.canvas.width,
        view.canvas.height,
      ].join(" ")}
    >
      <title>canvas view</title>
      {...children}
    </svg>
  );
});
