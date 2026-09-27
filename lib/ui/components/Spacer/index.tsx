import { clsx } from "clsx";
import { memo } from "react";
import styles from "./index.module.css";

/** Spacer component as replacement of margin */
export const Spacer = memo<{
  /** (px) */
  size: number;
  horizontal?: boolean | undefined;
}>((props) => (
  <span
    className={clsx(styles.container, props.horizontal && styles.horizontal)}
    style={{ "--size": `${props.size}px` } as React.CSSProperties}
  />
));
