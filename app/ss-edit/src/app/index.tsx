import { ImageAddRegular } from "@fluentui/react-icons";
import { useHotkey } from "@tanstack/react-hotkeys";
import React from "react";
import { EditorPane } from "../containers/EditorPane";
import { EditToolbar, TextEditorProvider } from "../containers/EditToolbar";
import { Footer } from "../containers/Footer";
import { Header } from "../containers/Header";
import { SidePanel } from "../containers/SidePanel";
import { useBeforeUnload } from "../hooks/useBeforeUnload";
import { useWindowFileDrop } from "../hooks/useWindowFileDrop";
import { pageCtx } from "../store";
import { AppProvider } from "./AppProvider";
import styles from "./index.module.css";

/** the application root container. */
export const App: React.FC = () => (
  <AppProvider className={styles.fluidProvider}>
    <div className={styles.container}>
      <Header className={styles.header} />
      <div className={styles.body}>
        <TextEditorProvider>
          <SidePanel />
          <div className={styles.paneArea}>
            <EditorPane />
            <EditToolbar />
          </div>
        </TextEditorProvider>
      </div>
      <Footer className={styles.footer} />
    </div>
    <AppHotkeyRegistry />
    <BeforeUnloadHandler />
    <DialogOutlet />
    <DropZone />
  </AppProvider>
);

const AppHotkeyRegistry = React.memo(() => {
  const actions = pageCtx.useActions();
  // NOTE: a dialog is modal, hence every hotkey stays out while one is open.
  const enabled = !pageCtx.useIsDialogOpen();
  // NOTE: off on a text item even when the focus is outside its editor, so that a key meant to
  // delete a character never deletes the whole item.
  const isEditingText = pageCtx.useIsEditingText();
  const deleteEnabled = enabled && !isEditingText;
  useHotkey("Mod+S", () => actions.picture.saveAsImage(), { enabled });
  useHotkey(
    "Escape",
    (e) => {
      // NOTE: an overlay such as a popover or a menu marks the Escape that closes it as handled.
      if (e.defaultPrevented) return;
      e.preventDefault();
      actions.selectMode.clear();
    },
    // NOTE: the manager would mark every Escape as handled before the check above otherwise.
    { enabled, preventDefault: false },
  );
  useHotkey("Delete", () => actions.picture.deleteSelected(), { enabled: deleteEnabled });
  // NOTE: a mac keyboard without a Forward Delete key sends Backspace in its place.
  useHotkey("Backspace", () => actions.picture.deleteSelected(), { enabled: deleteEnabled });
  return null;
});

const DropZone = React.memo(() => {
  const actions = pageCtx.useActions();
  const dragging = useWindowFileDrop(actions.picture.addFromDataTransfer);

  if (!dragging) {
    return null;
  }
  return (
    <div className={styles.dropOverlay}>
      <ImageAddRegular className={styles.dropOverlayIcon!} />
      Drop images here
    </div>
  );
});

const BeforeUnloadHandler = React.memo(() => {
  useBeforeUnload(pageCtx.useHasUnsavedChanges());
  return null;
});

const DialogOutlet = React.memo(() => {
  return pageCtx.useDialogReactNode();
});
