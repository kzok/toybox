import { ImageAddRegular } from "@fluentui/react-icons";
import { useHotkey } from "@tanstack/react-hotkeys";
import React from "react";
import { EditorPane } from "../containers/EditorPane";
import { Footer } from "../containers/Footer";
import { Header } from "../containers/Header";
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
      <EditorPane className={styles.canvas} />
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
  useHotkey("Mod+S", () => actions.picture.saveAsImage(), { enabled });
  useHotkey("Escape", () => actions.selection.clear(), { enabled });
  useHotkey("Delete", () => actions.selection.deleteSelected(), { enabled });
  // NOTE: a mac keyboard without a Forward Delete key sends Backspace in its place.
  useHotkey("Backspace", () => actions.selection.deleteSelected(), { enabled });
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
