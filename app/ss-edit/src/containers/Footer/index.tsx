import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import { ZoomIn16Regular } from "@fluentui/react-icons";
import clsx from "clsx";
import React from "react";
import { pageCtx } from "../../store";
import styles from "./index.module.css";

/** a footer of main view */
export const Footer = React.memo<{
  className?: string | undefined;
}>((props) => (
  <div className={clsx(props.className, styles.container)}>
    <span className={styles.spacer} />
    <Separator />
    <Zoom />
    <Separator />
    <Offset />
  </div>
));

const Separator = () => <span className={styles.separator} />;

const Zoom = React.memo(() => {
  const { scale } = pageCtx.useEditorView();
  const actions = pageCtx.usePageActions();

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          className={styles.zoom}
          appearance="transparent"
          size="small"
          icon={<ZoomIn16Regular />}
          title="Zoom level"
        >
          {formatZoomLevel(scale)}
        </MenuButton>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          {ZOOM_ITEMS.map((item) => (
            <MenuItem key={item} onClick={() => actions.zoom(item)}>
              {formatZoomLevel(item)}
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
});

const formatZoomLevel = (scale: number): string => `${(scale * 100).toFixed()}%`;

const ZOOM_ITEMS: readonly number[] = [2, 1.5, 1, 0.5];

const Offset = React.memo(() => {
  const { size } = pageCtx.useEntirePictureRect();

  return (
    <Button className={styles.offset} appearance="subtle" size="small" title="Offset">
      {size.x.toFixed()} x {size.y.toFixed()}
    </Button>
  );
});
