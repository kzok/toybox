import {
  ColorSwatch,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  SpinButton,
  type SpinButtonProps,
  SwatchPicker,
  type SwatchPickerProps,
  Toolbar,
  ToolbarButton,
  tokens,
} from "@fluentui/react-components";
import { TextColorRegular, TextFontSizeRegular } from "@fluentui/react-icons";
import React from "react";
import {
  type EditorItem,
  MAX_FONT_SIZE_PX,
  MIN_FONT_SIZE_PX,
  TEXT_COLORS,
} from "../../features/editorItem";
import { pageCtx } from "../../store";
import styles from "./index.module.css";

/** toolbar for edit mode, shown only on a text item */
export const EditToolbar = React.memo(() => {
  const item = pageCtx.useEditingTextItem();

  if (item == null) {
    return null;
  }
  return (
    <Toolbar className={styles.container} aria-label="Text style">
      <FontSizeInput item={item} />
      <ColorPicker item={item} />
    </Toolbar>
  );
});

const FontSizeInput = React.memo<{
  item: EditorItem.Text;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const inputId = React.useId();
  const onChange: SpinButtonProps["onChange"] = (_, data) => {
    // NOTE: `value` is undefined when the user typed the number rather than spun it.
    const fontSize = data.value ?? Number.parseFloat(data.displayValue ?? "");
    if (Number.isFinite(fontSize)) {
      actions.editMode.setTextFontSize(item.id, fontSize);
    }
  };

  return (
    <span className={styles.fontSize} title="Font size">
      {/* NOTE: `htmlFor` rather than wrapping the input: biome cannot see an input inside a component. */}
      <label className={styles.icon} htmlFor={inputId}>
        <TextFontSizeRegular />
      </label>
      <SpinButton
        id={inputId}
        className={styles.fontSizeInput}
        aria-label="Font size"
        value={item.fontSize}
        min={MIN_FONT_SIZE_PX}
        max={MAX_FONT_SIZE_PX}
        onChange={onChange}
      />
    </span>
  );
});

const ColorPicker = React.memo<{
  item: EditorItem.Text;
}>(({ item }) => {
  const actions = pageCtx.useActions();
  const [open, setOpen] = React.useState(false);
  const onSelectionChange: SwatchPickerProps["onSelectionChange"] = (_, data) => {
    actions.editMode.setTextColor(item.id, data.selectedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(_, data) => setOpen(data.open)} positioning="below-start">
      <PopoverTrigger disableButtonEnhancement>
        <ToolbarButton
          className={styles.colorButton}
          aria-label="Text color"
          title="Text color"
          icon={<TextColorRegular />}
        >
          <span className={styles.colorChip} style={{ backgroundColor: item.color }} />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverSurface>
        <SwatchPicker
          aria-label="Text color"
          selectedValue={item.color}
          onSelectionChange={onSelectionChange}
        >
          {TEXT_COLORS.map((color) => (
            <ColorSwatch
              key={color.value}
              color={color.value}
              value={color.value}
              aria-label={color.label}
              borderColor={tokens.colorNeutralStroke1}
            />
          ))}
        </SwatchPicker>
      </PopoverSurface>
    </Popover>
  );
});
