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
          <MenuItem onClick={() => actions.editorItem.clear()}>New instance</MenuItem>
          <MenuItem disabled={!canSave} onClick={() => actions.editorItem.saveAsPng()}>
            Save as PNG
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
          <MenuItem onClick={() => actions.editorItem.addFromFilePicker()}>Add image</MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
});
