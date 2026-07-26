import type React from "react";
import type { PageState } from "../../store";
import styles from "./LineItem.module.css";

/** svg elements for Line item. */
export const LineItem: React.FC<{
  item: PageState.Item.Line;
  selected?: boolean | undefined;
  onClick?: React.SVGAttributes<SVGGElement>["onClick"];
}> = (props) => {
  const baseLineProps: React.ComponentProps<"line"> = {
    x1: props.item.head[0],
    y1: props.item.head[1],
    x2: props.item.tail[0],
    y2: props.item.tail[1],
    strokeLinecap: "round",
  };
  return (
    <g className={styles.group} data-selected={props.selected} onClick={props.onClick}>
      <line {...baseLineProps} stroke={props.item.color} strokeWidth={props.item.width} />
    </g>
  );
};
