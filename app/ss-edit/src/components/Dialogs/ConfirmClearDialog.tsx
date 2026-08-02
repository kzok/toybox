import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from "@fluentui/react-components";
import React from "react";

/** confirm clear dialog */
export const ConfirmClearDialog = React.memo<{
  resolve: (_: boolean) => void;
}>((props) => {
  return (
    <Dialog open>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogContent>
            You have made changes that have not been saved.
            <br />
            Are you sure you want to discard them?
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={() => props.resolve(true)}>
              Discard Changes
            </Button>
            <Button appearance="secondary" onClick={() => props.resolve(false)}>
              Cancel
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
});
