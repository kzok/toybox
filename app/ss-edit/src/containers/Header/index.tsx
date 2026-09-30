import {
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import clsx from "clsx";
import React from "react";
import { pageCtx } from "../../store";
import styles from "./index.module.css";

/** a header of main view */
export const Header = React.memo<{
  className?: string | undefined;
}>((props) => (
  <div className={clsx(props.className, styles.container)}>
    <FileMenu />
    <EditMenu />
  </div>
));

const FileMenu = React.memo(() => {
  const actions = pageCtx.useActions();
  const canSave = pageCtx.useCanSave();
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton className={styles.menuButton} appearance="transparent" size="medium">
          File
        </MenuButton>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          <MenuItem onClick={() => actions.picture.clearItems()}>New instance</MenuItem>
          <MenuItem disabled={!canSave} onClick={() => actions.picture.saveAsImage()}>
            Save as image
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
});

const EditMenu = React.memo(() => {
  const actions = pageCtx.useActions();
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton className={styles.menuButton} appearance="transparent" size="medium">
          Edit
        </MenuButton>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          <MenuItem onClick={() => actions.picture.addFromFilePicker()}>Add image</MenuItem>
          <MenuItem onClick={() => actions.addItemMode.enter("text")}>Add text</MenuItem>
          <MenuItem onClick={() => actions.addItemMode.enter("rect")}>Add rectangle</MenuItem>
          <MenuItem onClick={() => actions.addItemMode.enter("arrow")}>Add arrow</MenuItem>
          <MenuItem onClick={() => actions.addItemMode.enter("mosaic")}>Add mosaic</MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
});
