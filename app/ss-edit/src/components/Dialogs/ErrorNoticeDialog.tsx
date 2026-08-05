import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from "@fluentui/react-components";
import { ErrorCircleFilled } from "@fluentui/react-icons";
import React from "react";
import styles from "./ErrorNoticeDialog.module.css";

/**
 * For an `Error`, `Error.prototype.stack` begins with the message only on V8,
 * so prepend it unless it is already there.
 * Otherwise the thrown value itself is dumped as JSON.
 *
 * @param error thrown value
 * @returns details of the error, or null if there is nothing to show
 */
const describeErrorDetails = (error: unknown): string | null => {
  if (error instanceof Error) {
    const summary = String(error);
    const stack = error.stack ?? "";
    return stack.startsWith(summary) ? stack : [summary, stack].filter((v) => v !== "").join("\n");
  }
  try {
    return JSON.stringify(error, null, 2) ?? null;
  } catch {
    return null;
  }
};

/** error notification dialog */
export const ErrorNoticeDialog = React.memo<{
  error: unknown;
  resolve: () => void;
}>((props) => {
  const details = describeErrorDetails(props.error);

  return (
    <Dialog open>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <span className={styles.title}>
              <ErrorCircleFilled className={styles.errorIcon!} />
              Something Went Wrong
            </span>
          </DialogTitle>
          <DialogContent>
            <p>The operation could not be completed.</p>
            <p className={styles.errorSummary}>{String(props.error)}</p>
            {details !== null && <code className={styles.errorDetails}>{details}</code>}
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={() => props.resolve()}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
});
