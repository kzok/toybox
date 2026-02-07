import type React from "react";
import type { EditorState } from "../../store/editor";

/** svg elements for Line item. */
export const LineItem = (props: { item: EditorState.Item.Line }): React.ReactNode => {
  const { item } = props;
  return (
    <g>
      <line
        x1={item.head[0]}
        y1={item.head[1]}
        x2={item.tail[0]}
        y2={item.tail[1]}
        stroke={item.color}
        strokeWidth={item.width}
        strokeLinecap="round"
      />
    </g>
  );
};
