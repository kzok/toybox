import { Spacer } from "@~/ui/components/Spacer";
import { TypedSingleDropdown } from "@~/ui/components/TypedSingleDropdown";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  useId,
} from "@fluentui/react-components";
import { SaveEditFilled } from "@fluentui/react-icons";
import React, { useCallback, useState } from "react";
import {
  ALL_BACKGROUND,
  ALL_FORMAT,
  DEFAULT_OPTION,
  type ExportOption,
} from "../../features/renderer";
import styles from "./SaveImageDialog.module.css";

export const SaveImageDialog = React.memo<{
  save: (option: ExportOption) => Promise<void>;
  close: () => void;
}>((props) => {
  const [option, setOption] = useState(DEFAULT_OPTION);
  const [loading, setLoading] = useState(false);
  const saveImage = useCallback(async () => {
    try {
      setLoading(true);
      await props.save(option);
    } finally {
      setLoading(false);
    }
  }, [props.save, setLoading, option]);

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
          <DialogContent>
            <FileFormatDropdown
              value={option.format}
              onChange={(format) => setOption((prev) => ({ ...prev, format }))}
            />
            <Spacer size={8} />
            <BackgroundDropdown
              value={option.background}
              onChange={(background) => setOption((prev) => ({ ...prev, background }))}
            />
          </DialogContent>
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

const FileFormatDropdown: React.FC<{
  value: ExportOption["format"];
  onChange: (value: ExportOption["format"]) => void;
}> = (props) => {
  const htmlId = useId();

  return (
    <div className={styles.dropdownContainer}>
      <label htmlFor={htmlId}>File format</label>
      <TypedSingleDropdown
        id={htmlId}
        appearance="outline"
        value={props.value}
        options={ALL_FORMAT.map((value) => ({ value, label: value }))}
        onChange={({ value }) => props.onChange(value)}
      />
    </div>
  );
};

const BackgroundDropdown: React.FC<{
  value: ExportOption["background"];
  onChange: (value: ExportOption["background"]) => void;
}> = (props) => {
  const htmlId = useId();

  return (
    <div className={styles.dropdownContainer}>
      <label htmlFor={htmlId}>Background</label>
      <TypedSingleDropdown
        id={htmlId}
        appearance="outline"
        value={props.value}
        options={ALL_BACKGROUND.map((value) => ({ value, label: value }))}
        onChange={({ value }) => props.onChange(value)}
      />
    </div>
  );
};
