import { ImageAddRegular } from "@fluentui/react-icons";
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
    <BeforeUnloadHandler />
    <DialogOutlet />
    <DropZone />
  </AppProvider>
);

const DropZone = React.memo(() => {
  const actions = pageCtx.useActions();
  const dragging = useWindowFileDrop(actions.editorItem.addFromDataTransfer);

  if (!dragging) {
    return null;
  }
  return (
    <div className={styles.dropOverlay}>
      <ImageAddRegular className={styles.dropOverlayIcon!} />
      Drop an image here
    </div>
  );
});

const BeforeUnloadHandler = React.memo(() => {
  useBeforeUnload(pageCtx.useNeedConfirmBeforeUnload());
  return null;
});

const DialogOutlet = React.memo(() => {
  return pageCtx.useDialogReactNode();
});
