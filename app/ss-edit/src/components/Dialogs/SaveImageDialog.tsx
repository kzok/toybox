import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from "@fluentui/react-components";
import { SaveEditFilled } from "@fluentui/react-icons";
import React, { useCallback, useState } from "react";
import styles from "./SaveImageDialog.module.css";

export const SaveImageDialog = React.memo<{
  save: () => Promise<void>;
  close: () => void;
}>((props) => {
  const [loading, setLoading] = useState(false);
  const saveImage = useCallback(async () => {
    try {
      setLoading(true);
      await props.save();
    } finally {
      setLoading(false);
    }
  }, [props.save, setLoading]);

  return (
    <Dialog open>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <span className={styles.title}>
              <SaveEditFilled className={styles.saveIcon!} />
              Save as image
            </span>
          </DialogTitle>
          <DialogContent></DialogContent>
          <DialogActions>
            <Button appearance="primary" disabled={loading} onClick={saveImage}>
              Save
            </Button>
            <Button appearance="secondary" onClick={props.close}>
              Cancel
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
});
