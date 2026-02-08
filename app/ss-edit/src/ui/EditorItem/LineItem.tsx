import type React from "react";
import type { EditorState } from "../../store/editor";

/** svg elements for Line item. */
export const LineItem: React.FC<{
  item: EditorState.Item.Line;
  gProps?: React.SVGProps<SVGGElement>;
}> = (props) => {
  const children: React.ReactNode[] = [];
  const baseLineProps: React.ComponentProps<"line"> = {
    x1: props.item.head[0],
    y1: props.item.head[1],
    x2: props.item.tail[0],
    y2: props.item.tail[1],
    strokeLinecap: "round",
  };
  children.push(
    <line {...baseLineProps} stroke={props.item.color} strokeWidth={props.item.width} />,
  );
  return <g {...props.gProps}>{...children}</g>;
};
