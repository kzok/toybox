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
import { pickImageFile } from "../../utils/fileIO";
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
  const actions = pageCtx.usePageActions();
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
          <MenuItem onClick={() => actions.clearItems()}>New instance</MenuItem>
          <MenuItem disabled={!canSave} onClick={() => actions.saveAsPng()}>
            Save as PNG
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
});

const EditMenu = React.memo(() => {
  const actions = pageCtx.usePageActions();
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton className={styles.menuButton} appearance="transparent" size="medium">
          Edit
        </MenuButton>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          <MenuItem
            onClick={async () => {
              const picked = await pickImageFile();
              if (picked == null) {
                return; // cancelled.
              }
              actions.addImageItem(picked.image);
            }}
          >
            Add image
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
});
