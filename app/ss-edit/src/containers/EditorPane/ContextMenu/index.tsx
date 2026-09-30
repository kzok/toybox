import {
  Menu,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  type MenuProps,
  type PositioningVirtualElement,
} from "@fluentui/react-components";
import { useStore } from "jotai";
import React from "react";
import { type PageState, pageCtx } from "../../../store";
import styles from "./index.module.css";

/** where and on which view the menu was opened. */
type OpenedAt = Readonly<{
  /** a zero-size box at the pointer, which the menu is placed against. */
  anchor: PositioningVirtualElement;
  /** the view when the menu was opened. */
  view: PageState.View;
}>;

/**
 * @returns the `contextmenu` handler of the editor pane, and the menu that it opens.
 * @note render the menu outside the pane. React events bubble through the portal of the popover,
 *   so the pointer handlers of the pane would also handle the clicks on the menu.
 */
export const useEditorContextMenu = (): [React.MouseEventHandler, React.ReactNode] => {
  const store = useStore();
  const atoms = pageCtx.useAtoms();
  const [openedAt, setOpenedAt] = React.useState<OpenedAt | null>(null);

  const onContextMenu = React.useCallback(
    (e: React.MouseEvent): void => {
      // NOTE: read, not subscribed: a subscription would re-render the pane on every pan frame.
      if (!hasMenu(store.get(atoms.editorMode))) return;
      e.preventDefault();
      const { clientX: x, clientY: y } = e;
      setOpenedAt({
        anchor: { getBoundingClientRect: () => DOMRect.fromRect({ x, y, width: 0, height: 0 }) },
        view: store.get(atoms.editorView),
      });
    },
    [store, atoms],
  );
  const onClose = React.useCallback(() => setOpenedAt(null), []);

  const menu = openedAt && <EditorContextMenu openedAt={openedAt} onClose={onClose} />;
  return [onContextMenu, menu];
};

const EditorContextMenu = React.memo<{
  openedAt: OpenedAt;
  onClose: () => void;
}>(({ openedAt, onClose }) => {
  const actions = pageCtx.useActions();
  const editorMode = pageCtx.useEditorMode();
  const editorView = pageCtx.useEditorView();
  // NOTE: the wheel handler of the pane stops the propagation of `wheel`, so the menu never sees
  // the scroll that it would close on by itself.
  const open = hasMenu(editorMode) && editorView === openedAt.view;

  React.useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);

  const onOpenChange: MenuProps["onOpenChange"] = (_, data) => {
    if (!data.open) onClose();
  };

  return (
    <Menu open={open} onOpenChange={onOpenChange} positioning={{ target: openedAt.anchor }}>
      <MenuPopover>
        <MenuList className={styles.menuList}>
          <MenuItem onClick={() => actions.selectMode.bringToFront()}>Bring to front</MenuItem>
          <MenuItem onClick={() => actions.selectMode.sendToBack()}>Send to back</MenuItem>
          <MenuDivider />
          <MenuItem
            className={styles.deleteItem}
            onClick={() => actions.selectMode.deleteSelected()}
          >
            Delete
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
});

/** @returns whether the mode has the context menu */
const hasMenu = (mode: PageState.Mode): boolean => mode.kind === "select" || mode.kind === "edit";
